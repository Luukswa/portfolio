import json
from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

profile_bp = Blueprint('profile', __name__)


def _ensure_table(cur):
    # Migrate old single-row table (had integer 'id' PK) to per-user schema
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profile' AND column_name = 'id'
    """)
    if cur.fetchone():
        cur.execute("DROP TABLE profile")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            user_id  INTEGER PRIMARY KEY,
            name     TEXT  NOT NULL DEFAULT '',
            title    TEXT  NOT NULL DEFAULT '',
            bio      TEXT  NOT NULL DEFAULT '',
            skills   JSONB NOT NULL DEFAULT '[]',
            hobbies  JSONB NOT NULL DEFAULT '[]',
            subjects JSONB NOT NULL DEFAULT '[]'
        )
    """)


@profile_bp.route('/api/profile')
@require_auth
def get_profile():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT name, title, bio, skills, hobbies, subjects FROM profile WHERE user_id = %s",
                (user_id,),
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
    user_id = session['user']['id']
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                """
                INSERT INTO profile (user_id, name, title, bio, skills, hobbies, subjects)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
                ON CONFLICT (user_id) DO UPDATE SET
                    name     = EXCLUDED.name,
                    title    = EXCLUDED.title,
                    bio      = EXCLUDED.bio,
                    skills   = EXCLUDED.skills,
                    hobbies  = EXCLUDED.hobbies,
                    subjects = EXCLUDED.subjects
                """,
                (
                    user_id,
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
