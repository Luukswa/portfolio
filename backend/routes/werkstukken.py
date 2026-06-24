import os
import re
import shutil
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

def _make_werk_dir(user_dir, vak, werk_id):
    safe_vak = _safe(vak) if vak else 'werkstuk'
    return os.path.join(user_dir, 'werkstukken', f'{safe_vak}_{werk_id}')

def _find_werk_dir(user_dir, werk_id):
    base = os.path.join(user_dir, 'werkstukken')
    suffix = f'_{werk_id}'
    if os.path.exists(base):
        for entry in os.scandir(base):
            if entry.is_dir() and entry.name.endswith(suffix):
                return entry.path
    return None


def _ensure_tables(cur):
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
    cur.execute("""
        CREATE TABLE IF NOT EXISTS werkstuk_fotos (
            id          SERIAL PRIMARY KEY,
            werkstuk_id INTEGER NOT NULL,
            filename    TEXT NOT NULL DEFAULT '',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def _fotos_for(cur, werk_id):
    cur.execute(
        "SELECT id FROM werkstuk_fotos WHERE werkstuk_id=%s AND filename != '' ORDER BY created_at",
        (werk_id,),
    )
    return [{'id': r[0], 'url': f'/api/werkstukken/{werk_id}/fotos/{r[0]}'} for r in cur.fetchall()]


def _save_foto_file(file, user_id, werk_id, vak, foto_id, display_name):
    ext = _ext(file.filename)
    filename = f'foto_{foto_id}.{ext}'
    user_dir = _find_user_dir(user_id) or _user_dir(display_name, user_id)
    werk_dir = _find_werk_dir(user_dir, werk_id) or _make_werk_dir(user_dir, vak, werk_id)
    os.makedirs(werk_dir, exist_ok=True)
    file.save(os.path.join(werk_dir, filename))
    return filename


# ── List / create own werkstukken ────────────────────────────────────────────

@werkstukken_bp.route('/api/werkstukken')
@require_auth
def get_werkstukken():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_tables(cur)
            conn.commit()
            cur.execute(
                "SELECT id, vak, gemaakt_bij, datum, trots_omdat FROM werkstukken WHERE user_id=%s ORDER BY created_at DESC",
                (user_id,),
            )
            rows = cur.fetchall()
            result = []
            for r in rows:
                result.append({
                    'id': r[0], 'vak': r[1], 'gemaakt_bij': r[2],
                    'datum': r[3], 'trots_omdat': r[4],
                    'fotos': _fotos_for(cur, r[0]),
                })
            return jsonify(result)
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken', methods=['POST'])
@require_auth
def add_werkstuk():
    user_id     = session['user']['id']
    vak         = request.form.get('vak', '')
    gemaakt_bij = request.form.get('gemaakt_bij', '')
    datum       = request.form.get('datum', '')
    trots_omdat = request.form.get('trots_omdat', '')
    file        = request.files.get('file')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_tables(cur)
            cur.execute(
                "INSERT INTO werkstukken (user_id, vak, gemaakt_bij, datum, trots_omdat) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (user_id, vak, gemaakt_bij, datum, trots_omdat),
            )
            new_id = cur.fetchone()[0]

            fotos = []
            if file and file.filename and _ext(file.filename) in ALLOWED_EXT:
                cur.execute("INSERT INTO werkstuk_fotos (werkstuk_id) VALUES (%s) RETURNING id", (new_id,))
                foto_id = cur.fetchone()[0]
                filename = _save_foto_file(file, user_id, new_id, vak, foto_id, session['user']['display_name'])
                cur.execute("UPDATE werkstuk_fotos SET filename=%s WHERE id=%s", (filename, foto_id))
                fotos = [{'id': foto_id, 'url': f'/api/werkstukken/{new_id}/fotos/{foto_id}'}]

            conn.commit()
        return jsonify({'id': new_id, 'vak': vak, 'gemaakt_bij': gemaakt_bij,
                        'datum': datum, 'trots_omdat': trots_omdat, 'fotos': fotos}), 201
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>', methods=['PUT'])
@require_auth
def update_werkstuk(werk_id):
    user_id = session['user']['id']
    data    = request.get_json(force=True)
    conn    = get_conn()
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
    conn    = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM werkstuk_fotos WHERE werkstuk_id=%s", (werk_id,))
            cur.execute("DELETE FROM werkstukken WHERE id=%s AND user_id=%s", (werk_id, user_id))
            conn.commit()
        user_dir = _find_user_dir(user_id)
        if user_dir:
            werk_dir = _find_werk_dir(user_dir, werk_id)
            if werk_dir:
                try: shutil.rmtree(werk_dir)
                except: pass
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


# ── Per-werkstuk foto management ─────────────────────────────────────────────

@werkstukken_bp.route('/api/werkstukken/<int:werk_id>/fotos', methods=['POST'])
@require_auth
def add_foto(werk_id):
    user_id = session['user']['id']
    if 'file' not in request.files:
        return jsonify({'error': 'Geen bestand'}), 400
    file = request.files['file']
    if not file.filename or _ext(file.filename) not in ALLOWED_EXT:
        return jsonify({'error': 'Ongeldig bestandstype'}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT vak FROM werkstukken WHERE id=%s AND user_id=%s", (werk_id, user_id))
            row = cur.fetchone()
            if not row:
                return jsonify({'error': 'Niet gevonden'}), 404
            vak = row[0]

            cur.execute("INSERT INTO werkstuk_fotos (werkstuk_id) VALUES (%s) RETURNING id", (werk_id,))
            foto_id = cur.fetchone()[0]
            filename = _save_foto_file(file, user_id, werk_id, vak, foto_id, session['user']['display_name'])
            cur.execute("UPDATE werkstuk_fotos SET filename=%s WHERE id=%s", (filename, foto_id))
            conn.commit()

        return jsonify({'id': foto_id, 'url': f'/api/werkstukken/{werk_id}/fotos/{foto_id}'})
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>/fotos/<int:foto_id>', methods=['DELETE'])
@require_auth
def delete_foto(werk_id, foto_id):
    user_id = session['user']['id']
    conn    = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.filename FROM werkstukken w
                JOIN werkstuk_fotos f ON f.werkstuk_id = w.id
                WHERE w.id=%s AND w.user_id=%s AND f.id=%s
            """, (werk_id, user_id, foto_id))
            row = cur.fetchone()
            if not row:
                return jsonify({'error': 'Niet gevonden'}), 404
            filename = row[0]
            cur.execute("DELETE FROM werkstuk_fotos WHERE id=%s", (foto_id,))
            conn.commit()

        user_dir = _find_user_dir(user_id)
        if user_dir:
            werk_dir = _find_werk_dir(user_dir, werk_id)
            if werk_dir and filename:
                try: os.remove(os.path.join(werk_dir, filename))
                except: pass
        return jsonify({'ok': True})
    finally:
        put_conn(conn)


@werkstukken_bp.route('/api/werkstukken/<int:werk_id>/fotos/<int:foto_id>')
@require_auth
def get_foto_by_id(werk_id, foto_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT w.user_id, f.filename FROM werkstukken w
                JOIN werkstuk_fotos f ON f.werkstuk_id = w.id
                WHERE w.id=%s AND f.id=%s AND f.filename != ''
            """, (werk_id, foto_id))
            row = cur.fetchone()
    finally:
        put_conn(conn)
    if not row:
        return '', 404
    user_id, filename = row
    user_dir = _find_user_dir(user_id)
    if user_dir:
        werk_dir = _find_werk_dir(user_dir, werk_id)
        if werk_dir and os.path.exists(os.path.join(werk_dir, filename)):
            return send_from_directory(werk_dir, filename)
    return '', 404
