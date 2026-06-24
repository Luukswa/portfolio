import os
import re
from flask import Blueprint, request, jsonify, session, send_from_directory
from middleware import require_auth
from db import get_conn, put_conn

werkstukken_bp = Blueprint('werkstukken', __name__)

UPLOADS_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
ALLOWED_EXT = {'jpg', 'jpeg', 'png', 'webp', 'gif'}


def _ext(filename):
    return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

def _safe(name):
    name = name.lower().strip()
    name = re.sub(r'[^\w]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_') or 'gebruiker'

def _user_dir(display_name, user_id):
    return os.path.join(UPLOADS_BASE, f'{_safe(display_name)}_{user_id}')

def _find_user_dir(user_id):
    suffix = f'_{user_id}'
    if os.path.exists(UPLOADS_BASE):
        for entry in os.scandir(UPLOADS_BASE):
            if entry.is_dir() and entry.name.endswith(suffix):
                return entry.path
    return None

def _foto_dir(user_dir):
    return os.path.join(user_dir, 'werkstukken')


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS werkstukken (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL,
            vak         TEXT NOT NULL DEFAULT '',
            gemaakt_bij TEXT NOT NULL DEFAULT '',
            datum       TEXT NOT NULL DEFAULT '',
            trots_omdat TEXT NOT NULL DEFAULT '',
            foto_url    TEXT NOT NULL DEFAULT '',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def _row(r):
    return {'id': r[0], 'vak': r[1], 'gemaakt_bij': r[2], 'datum': r[3], 'trots_omdat': r[4], 'foto_url': r[5]}


@werkstukken_bp.route('/api/werkstukken')
@require_auth
def get_werkstukken():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT id, vak, gemaakt_bij, datum, trots_omdat, foto_url FROM werkstukken WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            return jsonify([_row(r) for r in cur.fetchall()])
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken', methods=['POST'])
@require_auth
def add_werkstuk():
    user_id = session['user']['id']
    vak         = request.form.get('vak', '')
    gemaakt_bij = request.form.get('gemaakt_bij', '')
    datum       = request.form.get('datum', '')
    trots_omdat = request.form.get('trots_omdat', '')
    file        = request.files.get('file')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute(
                "INSERT INTO werkstukken (user_id, vak, gemaakt_bij, datum, trots_omdat) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (user_id, vak, gemaakt_bij, datum, trots_omdat),
            )
            new_id = cur.fetchone()[0]

            foto_url = ''
            if file and file.filename and _ext(file.filename) in ALLOWED_EXT:
                ext = _ext(file.filename)
                user_dir = _find_user_dir(user_id) or _user_dir(session['user']['display_name'], user_id)
                foto_subdir = _foto_dir(user_dir)
                os.makedirs(foto_subdir, exist_ok=True)
                for f in os.listdir(foto_subdir):
                    if f.startswith(f'werkstuk_{new_id}.'):
                        try: os.remove(os.path.join(foto_subdir, f))
                        except: pass
                file.save(os.path.join(foto_subdir, f'werkstuk_{new_id}.{ext}'))
                foto_url = f'/api/werkstukken/{new_id}/foto'
                cur.execute("UPDATE werkstukken SET foto_url=%s WHERE id=%s", (foto_url, new_id))

            conn.commit()
        return jsonify({'id': new_id, 'vak': vak, 'gemaakt_bij': gemaakt_bij, 'datum': datum, 'trots_omdat': trots_omdat, 'foto_url': foto_url}), 201
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>', methods=['PUT'])
@require_auth
def update_werkstuk(werk_id):
    user_id = session['user']['id']
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE werkstukken SET vak=%s, gemaakt_bij=%s, datum=%s, trots_omdat=%s WHERE id=%s AND user_id=%s",
                (data.get('vak',''), data.get('gemaakt_bij',''), data.get('datum',''), data.get('trots_omdat',''), werk_id, user_id),
            )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>', methods=['DELETE'])
@require_auth
def delete_werkstuk(werk_id):
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM werkstukken WHERE id=%s AND user_id=%s", (werk_id, user_id))
            conn.commit()
        user_dir = _find_user_dir(user_id)
        if user_dir:
            foto_subdir = _foto_dir(user_dir)
            if os.path.exists(foto_subdir):
                for f in os.listdir(foto_subdir):
                    if f.startswith(f'werkstuk_{werk_id}.'):
                        try: os.remove(os.path.join(foto_subdir, f))
                        except: pass
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>/foto', methods=['POST'])
@require_auth
def upload_foto(werk_id):
    user_id = session['user']['id']
    if 'file' not in request.files:
        return jsonify({'error': 'Geen bestand'}), 400
    file = request.files['file']
    if not file.filename or _ext(file.filename) not in ALLOWED_EXT:
        return jsonify({'error': 'Ongeldig bestandstype'}), 400

    ext = _ext(file.filename)
    user_dir = _find_user_dir(user_id) or _user_dir(session['user']['display_name'], user_id)
    foto_subdir = _foto_dir(user_dir)
    os.makedirs(foto_subdir, exist_ok=True)

    for f in os.listdir(foto_subdir):
        if f.startswith(f'werkstuk_{werk_id}.'):
            try: os.remove(os.path.join(foto_subdir, f))
            except: pass

    file.save(os.path.join(foto_subdir, f'werkstuk_{werk_id}.{ext}'))
    foto_url = f'/api/werkstukken/{werk_id}/foto'

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE werkstukken SET foto_url=%s WHERE id=%s AND user_id=%s", (foto_url, werk_id, user_id))
            conn.commit()
    finally:
        put_conn(conn)

    return jsonify({'foto_url': foto_url})


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>/foto')
@require_auth
def get_foto(werk_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM werkstukken WHERE id=%s", (werk_id,))
            row = cur.fetchone()
    finally:
        put_conn(conn)
    if not row:
        return '', 404
    user_dir = _find_user_dir(row[0])
    if user_dir:
        foto_subdir = _foto_dir(user_dir)
        if os.path.exists(foto_subdir):
            for f in os.listdir(foto_subdir):
                if f.startswith(f'werkstuk_{werk_id}.'):
                    return send_from_directory(foto_subdir, f)
    return '', 404
