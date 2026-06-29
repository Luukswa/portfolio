import os
from flask import Blueprint, request, jsonify
from middleware import require_admin
from db import get_conn, put_conn

_UPLOADS_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/users')
@require_admin
def list_users():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN NOT NULL DEFAULT false")
            conn.commit()
            cur.execute(
                "SELECT id, display_name, email, last_login, is_admin, is_teacher FROM users ORDER BY display_name"
            )
            rows = cur.fetchall()
        return jsonify([{
            'id':           r[0],
            'display_name': r[1],
            'email':        r[2],
            'last_login':   r[3].isoformat() if r[3] else None,
            'is_admin':     r[4],
            'is_teacher':   r[5],
        } for r in rows])
    finally:
        put_conn(conn)



@admin_bp.route('/api/admin/users/<int:user_id>/profile/reset', methods=['POST'])
@require_admin
def reset_user_profile(user_id):
    # Delete avatar file from disk
    suffix = f'_{user_id}'
    if os.path.exists(_UPLOADS_BASE):
        for entry in os.scandir(_UPLOADS_BASE):
            if entry.is_dir() and entry.name.endswith(suffix):
                for f in os.listdir(entry.path):
                    if f.startswith('avatar.'):
                        os.remove(os.path.join(entry.path, f))
                break

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE profile SET
                    name = '', title = '', bio = '',
                    skills = '[]'::jsonb, hobbies = '[]'::jsonb, subjects = '[]'::jsonb,
                    avatar_url = ''
                WHERE user_id = %s
            """, (user_id,))
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


@admin_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@require_admin
def update_user(user_id):
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if 'is_admin' in data:
                cur.execute("UPDATE users SET is_admin = %s WHERE id = %s", (bool(data['is_admin']), user_id))
            if 'is_teacher' in data:
                cur.execute("UPDATE users SET is_teacher = %s WHERE id = %s", (bool(data['is_teacher']), user_id))
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
