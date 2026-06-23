import json
import os
from flask import Blueprint, request, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from middleware import require_auth
from db import get_conn, put_conn

profile_bp = Blueprint('profile', __name__)

UPLOADS_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
ALLOWED_EXT = {'jpg', 'jpeg', 'png', 'webp', 'gif'}


def _ext(filename):
    return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''


def _user_dir(user_id):
    return os.path.join(UPLOADS_BASE, str(user_id))


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
            user_id   INTEGER PRIMARY KEY,
            name      TEXT  NOT NULL DEFAULT '',
            title     TEXT  NOT NULL DEFAULT '',
            bio       TEXT  NOT NULL DEFAULT '',
            skills    JSONB NOT NULL DEFAULT '[]',
            hobbies   JSONB NOT NULL DEFAULT '[]',
            subjects  JSONB NOT NULL DEFAULT '[]',
            avatar_url TEXT NOT NULL DEFAULT ''
        )
    """)
    # Add avatar_url to existing tables that pre-date this column
    cur.execute("""
        ALTER TABLE profile ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''
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
                "SELECT name, title, bio, skills, hobbies, subjects, avatar_url FROM profile WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
        if not row:
            return jsonify({'name': '', 'title': '', 'bio': '', 'skills': [], 'hobbies': [], 'subjects': [], 'avatar_url': ''})
        return jsonify({
            'name':       row[0],
            'title':      row[1],
            'bio':        row[2],
            'skills':     row[3],
            'hobbies':    row[4],
            'subjects':   row[5],
            'avatar_url': row[6],
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


@profile_bp.route('/api/profile/avatar', methods=['POST'])
@require_auth
def upload_avatar():
    user_id = session['user']['id']
    if 'file' not in request.files:
        return jsonify({'error': 'Geen bestand'}), 400
    file = request.files['file']
    if not file.filename or _ext(file.filename) not in ALLOWED_EXT:
        return jsonify({'error': 'Ongeldig bestandstype'}), 400

    ext = _ext(file.filename)
    user_dir = _user_dir(user_id)
    os.makedirs(user_dir, exist_ok=True)

    # Remove previous avatar for this user
    for f in os.listdir(user_dir):
        if f.startswith('avatar.'):
            os.remove(os.path.join(user_dir, f))

    filename = f'avatar.{ext}'
    file.save(os.path.join(user_dir, filename))

    avatar_url = f'/api/profile/avatar/{user_id}'
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                """
                INSERT INTO profile (user_id, avatar_url)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
                """,
                (user_id, avatar_url),
            )
            conn.commit()
    finally:
        put_conn(conn)

    return jsonify({'avatar_url': avatar_url})


@profile_bp.route('/api/profile/avatar/<int:user_id>', methods=['DELETE'])
@require_auth
def delete_avatar(user_id):
    if session['user']['id'] != user_id:
        return jsonify({'error': 'Forbidden'}), 403
    user_dir = _user_dir(user_id)
    if os.path.exists(user_dir):
        for f in os.listdir(user_dir):
            if f.startswith('avatar.'):
                os.remove(os.path.join(user_dir, f))
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE profile SET avatar_url = '' WHERE user_id = %s", (user_id,))
            conn.commit()
    finally:
        put_conn(conn)
    return jsonify({'ok': True})


@profile_bp.route('/api/profile/avatar/<int:user_id>')
def get_avatar(user_id):
    user_dir = _user_dir(user_id)
    if os.path.exists(user_dir):
        for f in os.listdir(user_dir):
            if f.startswith('avatar.'):
                return send_from_directory(user_dir, f)
    return '', 404
