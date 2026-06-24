import os
from flask import Blueprint, jsonify, request
from middleware import require_admin
from db import get_conn, put_conn

branding_bp = Blueprint('branding', __name__)

VALID_THEMES = {'standaard', 'genseler'}


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
    finally:
        put_conn(conn)
    return jsonify({
        'appName': os.environ.get('APP_NAME') or 'Portfolio',
        'primaryColor': os.environ.get('PRIMARY_COLOR') or '#0d4c92',
        'logoUrl': os.environ.get('LOGO_URL') or '/logo.png',
        'theme': theme,
    })


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
