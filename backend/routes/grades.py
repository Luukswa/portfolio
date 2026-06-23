from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

grades_bp = Blueprint('grades', __name__)


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS grades (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            vak        TEXT NOT NULL,
            cijfer     NUMERIC(4,1) NOT NULL CHECK (cijfer >= 1 AND cijfer <= 10),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


@grades_bp.route('/api/grades')
@require_auth
def get_grades():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT id, vak, cijfer, created_at FROM grades WHERE user_id = %s ORDER BY vak, created_at DESC",
                (user_id,),
            )
            rows = cur.fetchall()
        return jsonify([{
            'id':         r[0],
            'vak':        r[1],
            'cijfer':     float(r[2]),
            'created_at': r[3].isoformat() if r[3] else None,
        } for r in rows])
    finally:
        put_conn(conn)


@grades_bp.route('/api/grades', methods=['POST'])
@require_auth
def add_grade():
    user_id = session['user']['id']
    data = request.get_json(force=True)
    vak = data.get('vak', '').strip()
    if not vak:
        return jsonify({'error': 'Vak is verplicht'}), 400
    try:
        cijfer = round(float(data.get('cijfer')), 1)
        if not (1.0 <= cijfer <= 10.0):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'Cijfer moet tussen 1.0 en 10.0 liggen'}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                "INSERT INTO grades (user_id, vak, cijfer) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user_id, vak, cijfer),
            )
            row = cur.fetchone()
            conn.commit()
        return jsonify({'id': row[0], 'vak': vak, 'cijfer': cijfer, 'created_at': row[1].isoformat()}), 201
    finally:
        put_conn(conn)


@grades_bp.route('/api/grades/<int:grade_id>', methods=['DELETE'])
@require_auth
def delete_grade(grade_id):
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM grades WHERE id = %s AND user_id = %s",
                (grade_id, user_id),
            )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
