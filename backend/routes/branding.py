import os
from flask import Blueprint, jsonify, request, send_from_directory
from middleware import require_admin
from db import get_conn, put_conn

branding_bp = Blueprint('branding', __name__)

VALID_THEMES = {'standaard', 'genseler'}
ALLOWED_LOGO_EXT = {'jpg', 'jpeg', 'png', 'webp', 'svg'}
LOGO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads', 'branding')


def _ext(filename):
    return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''


def _ensure_settings_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT ''
        )
    """)


def _get_setting(cur, key, default=''):
    cur.execute("SELECT value FROM settings WHERE key=%s", (key,))
    row = cur.fetchone()
    return row[0] if row else default


def _set_setting(cur, key, value):
    cur.execute("""
        INSERT INTO settings (key, value) VALUES (%s, %s)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    """, (key, value))


@branding_bp.route('/api/config/branding')
def branding():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_settings_table(cur)
            conn.commit()
            theme = _get_setting(cur, 'theme', 'standaard')
            logo_ext = _get_setting(cur, 'logo_ext', '')
            logo_v = _get_setting(cur, 'logo_v', '0')
    finally:
        put_conn(conn)

    if logo_ext:
        logo_url = f'/api/config/logo?v={logo_v}'
    else:
        logo_url = os.environ.get('LOGO_URL') or ''

    return jsonify({
        'appName': os.environ.get('APP_NAME') or 'Portfolio',
        'primaryColor': os.environ.get('PRIMARY_COLOR') or '#0d4c92',
        'logoUrl': logo_url,
        'theme': theme,
    })


@branding_bp.route('/api/config/logo')
def get_logo():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_settings_table(cur)
            conn.commit()
            logo_ext = _get_setting(cur, 'logo_ext', '')
    finally:
        put_conn(conn)
    if not logo_ext:
        return '', 404
    logo_file = f'logo.{logo_ext}'
    if not os.path.exists(os.path.join(LOGO_DIR, logo_file)):
        return '', 404
    return send_from_directory(LOGO_DIR, logo_file)


@branding_bp.route('/api/admin/branding', methods=['PUT'])
@require_admin
def update_branding():
    data = request.get_json(force=True) or {}
    theme = data.get('theme', 'standaard')
    if theme not in VALID_THEMES:
        return jsonify({'error': 'Ongeldig thema'}), 400
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_settings_table(cur)
            _set_setting(cur, 'theme', theme)
            conn.commit()
    finally:
        put_conn(conn)
    return jsonify({'ok': True, 'theme': theme})


@branding_bp.route('/api/admin/branding/logo', methods=['POST'])
@require_admin
def upload_logo():
    if 'file' not in request.files:
        return jsonify({'error': 'Geen bestand'}), 400
    file = request.files['file']
    ext = _ext(file.filename)
    if ext not in ALLOWED_LOGO_EXT:
        return jsonify({'error': 'Ongeldig bestandstype'}), 400

    os.makedirs(LOGO_DIR, exist_ok=True)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_settings_table(cur)
            old_ext = _get_setting(cur, 'logo_ext', '')
            if old_ext and old_ext != ext:
                try:
                    os.remove(os.path.join(LOGO_DIR, f'logo.{old_ext}'))
                except OSError:
                    pass

            file.save(os.path.join(LOGO_DIR, f'logo.{ext}'))

            v = int(_get_setting(cur, 'logo_v', '0')) + 1
            _set_setting(cur, 'logo_ext', ext)
            _set_setting(cur, 'logo_v', str(v))
            conn.commit()
    finally:
        put_conn(conn)

    return jsonify({'ok': True, 'logoUrl': f'/api/config/logo?v={v}'})


@branding_bp.route('/api/admin/branding/logo', methods=['DELETE'])
@require_admin
def delete_logo():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_settings_table(cur)
            logo_ext = _get_setting(cur, 'logo_ext', '')
            _set_setting(cur, 'logo_ext', '')
            _set_setting(cur, 'logo_v', '0')
            conn.commit()
        if logo_ext:
            try:
                os.remove(os.path.join(LOGO_DIR, f'logo.{logo_ext}'))
            except OSError:
                pass
    finally:
        put_conn(conn)
    return jsonify({'ok': True})
