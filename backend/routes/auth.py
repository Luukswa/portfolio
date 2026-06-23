import os
import requests
from flask import Blueprint, request, session, jsonify, redirect
from middleware import require_auth
from db import get_conn, put_conn

auth_bp = Blueprint('auth', __name__)


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
                user_data,
            )
            row = cur.fetchone()
            conn.commit()

        session['user'] = {
            'id': row[0],
            'azure_id': user_data['azure_id'],
            'email': user_data['email'],
            'display_name': user_data['display_name'],
            'is_admin': row[1],
            'is_teacher': row[2],
        }
    finally:
        put_conn(conn)

    return redirect('/')


@auth_bp.route('/api/auth/me')
@require_auth
def me():
    return jsonify(session['user'])


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})
