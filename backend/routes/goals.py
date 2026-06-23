from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

goals_bp = Blueprint('goals', __name__)


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            doel       TEXT NOT NULL,
            wil_leren  TEXT NOT NULL DEFAULT '',
            nodig      TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


@goals_bp.route('/api/goals')
@require_auth
def get_goals():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT id, doel, wil_leren, nodig, created_at FROM goals WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            rows = cur.fetchall()
        return jsonify([{
            'id':         r[0],
            'doel':       r[1],
            'wil_leren':  r[2],
            'nodig':      r[3],
            'created_at': r[4].isoformat() if r[4] else None,
        } for r in rows])
    finally:
        put_conn(conn)


@goals_bp.route('/api/goals', methods=['POST'])
@require_auth
def add_goal():
    user_id = session['user']['id']
    data = request.get_json(force=True)
    doel = data.get('doel', '').strip()
    if not doel:
        return jsonify({'error': 'Doel is verplicht'}), 400
    wil_leren = data.get('wil_leren', '').strip()
    nodig = data.get('nodig', '').strip()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                "INSERT INTO goals (user_id, doel, wil_leren, nodig) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (user_id, doel, wil_leren, nodig),
            )
            row = cur.fetchone()
            conn.commit()
        return jsonify({
            'id': row[0], 'doel': doel, 'wil_leren': wil_leren,
            'nodig': nodig, 'created_at': row[1].isoformat(),
        }), 201
    finally:
        put_conn(conn)


@goals_bp.route('/api/goals/<int:goal_id>', methods=['PUT'])
@require_auth
def update_goal(goal_id):
    user_id = session['user']['id']
    data = request.get_json(force=True)
    doel = data.get('doel', '').strip()
    if not doel:
        return jsonify({'error': 'Doel is verplicht'}), 400
    wil_leren = data.get('wil_leren', '').strip()
    nodig = data.get('nodig', '').strip()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE goals SET doel=%s, wil_leren=%s, nodig=%s WHERE id=%s AND user_id=%s",
                (doel, wil_leren, nodig, goal_id, user_id),
            )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


@goals_bp.route('/api/goals/<int:goal_id>', methods=['DELETE'])
@require_auth
def delete_goal(goal_id):
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM goals WHERE id = %s AND user_id = %s",
                (goal_id, user_id),
            )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
