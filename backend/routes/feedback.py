from flask import Blueprint, request, jsonify, session
from middleware import require_auth, require_teacher
from db import get_conn, put_conn

feedback_bp = Blueprint('feedback', __name__)

# target_type -> table to validate target_id against.
# 'singleton' targets (profiel/cijfers/cv) are section-level, not tied to one row,
# so target_id is just the student's own id.
TARGETS = {
    'goal':       {'table': 'goals',       'singleton': False},
    'werkstuk':   {'table': 'werkstukken', 'singleton': False},
    'referentie': {'table': 'referenties', 'singleton': False},
    'profiel':    {'table': 'profile',     'singleton': True},
    'cijfers':    {'table': 'grades',      'singleton': True},
    'cv':         {'table': 'cv_data',     'singleton': True},
}


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id           SERIAL PRIMARY KEY,
            student_id   INTEGER NOT NULL,
            teacher_id   INTEGER NOT NULL,
            teacher_name TEXT NOT NULL DEFAULT '',
            target_type  TEXT NOT NULL,
            target_id    INTEGER NOT NULL,
            body         TEXT NOT NULL DEFAULT '',
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def _row_to_dict(r):
    return {
        'id': r[0], 'target_type': r[1], 'target_id': r[2],
        'teacher_id': r[3], 'teacher_name': r[4],
        'body': r[5], 'created_at': r[6].isoformat() if r[6] else None,
    }


def _fetch_feedback(cur, student_id):
    cur.execute(
        "SELECT id, target_type, target_id, teacher_id, teacher_name, body, created_at "
        "FROM feedback WHERE student_id = %s ORDER BY created_at",
        (student_id,),
    )
    return [_row_to_dict(r) for r in cur.fetchall()]


@feedback_bp.route('/api/feedback')
@require_auth
def my_feedback():
    student_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            return jsonify(_fetch_feedback(cur, student_id))
    finally:
        put_conn(conn)


@feedback_bp.route('/api/teacher/students/<int:student_id>/feedback')
@require_teacher
def student_feedback(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            return jsonify(_fetch_feedback(cur, student_id))
    finally:
        put_conn(conn)


@feedback_bp.route('/api/teacher/students/<int:student_id>/feedback', methods=['POST'])
@require_teacher
def add_feedback(student_id):
    data = request.get_json(force=True)
    target_type = data.get('target_type', '')
    target_id = data.get('target_id')
    body = (data.get('body') or '').strip()

    meta = TARGETS.get(target_type)
    if not meta or target_id is None or not body:
        return jsonify({'error': 'Ongeldige invoer'}), 400

    teacher = session['user']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            if meta['singleton']:
                valid = int(target_id) == student_id
            else:
                cur.execute(
                    f"SELECT 1 FROM {meta['table']} WHERE id = %s AND user_id = %s",
                    (target_id, student_id),
                )
                valid = cur.fetchone() is not None
            if not valid:
                return jsonify({'error': 'Niet gevonden'}), 404

            cur.execute(
                """
                INSERT INTO feedback (student_id, teacher_id, teacher_name, target_type, target_id, body)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (student_id, teacher['id'], teacher['display_name'], target_type, target_id, body),
            )
            new_id, created_at = cur.fetchone()
            conn.commit()

        return jsonify({
            'id': new_id, 'target_type': target_type, 'target_id': target_id,
            'teacher_id': teacher['id'], 'teacher_name': teacher['display_name'],
            'body': body, 'created_at': created_at.isoformat(),
        }), 201
    finally:
        put_conn(conn)


@feedback_bp.route('/api/teacher/feedback/<int:feedback_id>', methods=['DELETE'])
@require_teacher
def delete_feedback(feedback_id):
    teacher = session['user']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if teacher.get('is_admin'):
                cur.execute("DELETE FROM feedback WHERE id = %s", (feedback_id,))
            else:
                cur.execute("DELETE FROM feedback WHERE id = %s AND teacher_id = %s", (feedback_id, teacher['id']))
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
