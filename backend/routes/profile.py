import json
from flask import Blueprint, request, jsonify
from middleware import require_auth
from db import get_conn, put_conn

profile_bp = Blueprint('profile', __name__)


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id       INTEGER PRIMARY KEY,
            name     TEXT  NOT NULL DEFAULT '',
            title    TEXT  NOT NULL DEFAULT '',
            bio      TEXT  NOT NULL DEFAULT '',
            skills   JSONB NOT NULL DEFAULT '[]',
            hobbies  JSONB NOT NULL DEFAULT '[]',
            subjects JSONB NOT NULL DEFAULT '[]'
        )
    """)
    cur.execute("INSERT INTO profile (id) VALUES (1) ON CONFLICT DO NOTHING")


@profile_bp.route('/api/profile')
def get_profile():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT name, title, bio, skills, hobbies, subjects FROM profile WHERE id = 1"
            )
            row = cur.fetchone()
        if not row:
            return jsonify({'name': '', 'title': '', 'bio': '', 'skills': [], 'hobbies': [], 'subjects': []})
        return jsonify({
            'name':     row[0],
            'title':    row[1],
            'bio':      row[2],
            'skills':   row[3],
            'hobbies':  row[4],
            'subjects': row[5],
        })
    finally:
        put_conn(conn)


@profile_bp.route('/api/profile', methods=['PUT'])
@require_auth
def save_profile():
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                """
                UPDATE profile SET
                    name     = %s,
                    title    = %s,
                    bio      = %s,
                    skills   = %s::jsonb,
                    hobbies  = %s::jsonb,
                    subjects = %s::jsonb
                WHERE id = 1
                """,
                (
                    data.get('name', ''),
                    data.get('title', ''),
                    data.get('bio', ''),
                    json.dumps(data.get('skills', [])),
                    json.dumps(data.get('hobbies', [])),
                    json.dumps(data.get('subjects', [])),
                ),
            )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
