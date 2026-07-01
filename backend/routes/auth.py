import os
import secrets
import requests
import msal
from flask import Blueprint, request, session, jsonify, redirect
from middleware import require_auth
from db import get_conn, put_conn

auth_bp = Blueprint('auth', __name__)

# Scope for the Graph group-membership check; MSAL adds openid/profile/offline_access automatically.
GRAPH_SCOPES = ['https://graph.microsoft.com/GroupMember.Read.All']

_msal_app = None


def _get_msal_app():
    global _msal_app
    if _msal_app is None:
        _msal_app = msal.ConfidentialClientApplication(
            os.environ['AZURE_CLIENT_ID'],
            authority=f"https://login.microsoftonline.com/{os.environ['AZURE_TENANT_ID']}",
            client_credential=os.environ['AZURE_CLIENT_SECRET'],
        )
    return _msal_app


def _azure_configured():
    return bool(
        os.environ.get('AZURE_CLIENT_ID')
        and os.environ.get('AZURE_TENANT_ID')
        and os.environ.get('AZURE_CLIENT_SECRET')
    )


def _redirect_uri():
    return f"{os.environ.get('APP_BASE_URL', '').rstrip('/')}/api/auth/callback"


def _login_user(azure_id, email, display_name):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN NOT NULL DEFAULT false")
            cur.execute(
                """
                INSERT INTO users (azure_id, email, display_name, last_login)
                VALUES (%(azure_id)s, %(email)s, %(display_name)s, NOW())
                ON CONFLICT (azure_id) DO UPDATE
                    SET email        = EXCLUDED.email,
                        display_name = EXCLUDED.display_name,
                        last_login   = NOW()
                RETURNING id, is_admin, is_teacher
                """,
                {'azure_id': azure_id, 'email': email, 'display_name': display_name},
            )
            row = cur.fetchone()
            conn.commit()
    finally:
        put_conn(conn)

    session['user'] = {
        'id': row[0],
        'azure_id': azure_id,
        'email': email,
        'display_name': display_name,
        'is_admin': row[1],
        'is_teacher': row[2],
    }


@auth_bp.route('/sso')
def sso_callback():
    token = request.args.get('token', '').strip()
    if not token:
        return 'Missing SSO token', 400

    portal_url = os.environ.get('PORTAL_BASE_URL', '').rstrip('/')
    secret = os.environ.get('SSO_SHARED_SECRET', '')

    try:
        resp = requests.get(
            f'{portal_url}/api/sso/verify/{token}',
            headers={'x-sso-secret': secret},
            timeout=5,
        )
        resp.raise_for_status()
        user_data = resp.json()
    except Exception:
        return 'SSO verification failed', 401

    _login_user(user_data['azure_id'], user_data['email'], user_data['display_name'])
    return redirect('/')


@auth_bp.route('/api/auth/login')
def login():
    if not _azure_configured():
        return redirect('/?error=azure_not_configured')

    state = secrets.token_hex(16)
    session['msal_state'] = state
    auth_url = _get_msal_app().get_authorization_request_url(
        GRAPH_SCOPES,
        state=state,
        redirect_uri=_redirect_uri(),
    )
    return redirect(auth_url)


@auth_bp.route('/api/auth/callback')
def callback():
    if request.args.get('error'):
        return redirect('/?error=azure_denied')

    code = request.args.get('code')
    state = request.args.get('state')
    if not code or not state or state != session.pop('msal_state', None):
        return redirect('/?error=invalid_state')

    result = _get_msal_app().acquire_token_by_authorization_code(
        code,
        scopes=GRAPH_SCOPES,
        redirect_uri=_redirect_uri(),
    )
    if 'error' in result:
        return redirect('/?error=token_failed')

    claims = result.get('id_token_claims', {})
    azure_id = claims.get('oid')
    email = (claims.get('preferred_username') or claims.get('email') or '').lower()
    display_name = claims.get('name') or email
    if not azure_id:
        return redirect('/?error=no_azure_id')

    allowed_groups = [g.strip() for g in os.environ.get('AZURE_ALLOWED_GROUP_ID', '').split(',') if g.strip()]
    if allowed_groups:
        try:
            graph_resp = requests.post(
                'https://graph.microsoft.com/v1.0/me/checkMemberGroups',
                headers={
                    'Authorization': f"Bearer {result['access_token']}",
                    'Content-Type': 'application/json',
                },
                json={'groupIds': allowed_groups},
                timeout=10,
            )
            graph_resp.raise_for_status()
            matched_groups = graph_resp.json().get('value', [])
        except Exception:
            return redirect('/?error=auth_failed')

        if not any(g in allowed_groups for g in matched_groups):
            return redirect('/?error=unauthorized_group')

    _login_user(azure_id, email, display_name)
    return redirect('/')


@auth_bp.route('/api/auth/me')
@require_auth
def me():
    return jsonify(session['user'])


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})
