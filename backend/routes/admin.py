import json
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from middleware import require_admin
from db import get_conn, put_conn

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


@admin_bp.route('/api/admin/backup')
@require_admin
def backup():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            def query(sql, *params):
                try:
                    cur.execute(sql, params or None)
                    cols = [d.name for d in cur.description]
                    return [dict(zip(cols, row)) for row in cur.fetchall()]
                except Exception:
                    conn.rollback()
                    return []

            data = {
                'exported_at': datetime.now().isoformat(),
                'version': 1,
                'users':          query("SELECT id, display_name, email, last_login, is_admin, is_teacher FROM users ORDER BY id"),
                'profiles':       query("SELECT * FROM profile ORDER BY user_id"),
                'grades':         query("SELECT * FROM grades ORDER BY user_id, id"),
                'goals':          query("SELECT * FROM goals ORDER BY user_id, id"),
                'cv':             query("SELECT * FROM cv_data ORDER BY user_id"),
                'referenties':    query("SELECT * FROM referenties ORDER BY user_id"),
                'werkstukken':    query("SELECT * FROM werkstukken ORDER BY user_id, id"),
                'werkstuk_fotos': query("SELECT * FROM werkstuk_fotos ORDER BY werkstuk_id, id"),
                'settings':       query("SELECT * FROM settings ORDER BY key"),
            }
    finally:
        put_conn(conn)

    def serial(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        raise TypeError(f'Type {type(obj)} not serializable')

    date_str = datetime.now().strftime('%Y-%m-%d')
    return Response(
        json.dumps(data, default=serial, ensure_ascii=False, indent=2),
        mimetype='application/json',
        headers={'Content-Disposition': f'attachment; filename="portfolio-backup-{date_str}.json"'},
    )


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
