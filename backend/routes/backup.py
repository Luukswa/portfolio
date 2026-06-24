import json
import os
import re
from datetime import datetime
from flask import Blueprint, jsonify
from middleware import require_admin
from db import get_conn, put_conn

try:
    from psycopg.types.json import Jsonb
except ImportError:
    Jsonb = None

backup_bp = Blueprint('backup', __name__)

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backups')

_FILENAME_RE = re.compile(r'^backup_\d{8}_\d{6}\.json$')


def _serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    raise TypeError(f'Type {type(obj)} not serializable')


def _coerce(v):
    if isinstance(v, (list, dict)):
        return Jsonb(v) if Jsonb else json.dumps(v, ensure_ascii=False)
    if isinstance(v, str) and re.match(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', v):
        try:
            return datetime.fromisoformat(v[:19])
        except ValueError:
            pass
    return v


def _collect(conn, cur):
    def q(sql):
        try:
            cur.execute(sql)
            cols = [d.name for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except Exception:
            conn.rollback()
            return []

    return {
        'users':          q("SELECT id, display_name, email, last_login, is_admin, is_teacher FROM users ORDER BY id"),
        'profiles':       q("SELECT * FROM profile ORDER BY user_id"),
        'grades':         q("SELECT * FROM grades ORDER BY user_id, id"),
        'goals':          q("SELECT * FROM goals ORDER BY user_id, id"),
        'cv':             q("SELECT * FROM cv_data ORDER BY user_id"),
        'referenties':    q("SELECT * FROM referenties ORDER BY user_id"),
        'werkstukken':    q("SELECT * FROM werkstukken ORDER BY user_id, id"),
        'werkstuk_fotos': q("SELECT * FROM werkstuk_fotos ORDER BY werkstuk_id, id"),
        'settings':       q("SELECT * FROM settings ORDER BY key"),
    }


@backup_bp.route('/api/admin/backups')
@require_admin
def list_backups():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backups = []
    for name in os.listdir(BACKUP_DIR):
        if not _FILENAME_RE.match(name):
            continue
        path = os.path.join(BACKUP_DIR, name)
        stat = os.stat(path)
        backups.append({
            'name': name,
            'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'size': stat.st_size,
        })
    backups.sort(key=lambda b: b['created_at'], reverse=True)
    return jsonify(backups)


@backup_bp.route('/api/admin/backups', methods=['POST'])
@require_admin
def create_backup():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            data = _collect(conn, cur)
    finally:
        put_conn(conn)

    data['exported_at'] = datetime.now().isoformat()
    data['version'] = 1

    os.makedirs(BACKUP_DIR, exist_ok=True)
    name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    path = os.path.join(BACKUP_DIR, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, default=_serial, ensure_ascii=False, indent=2)

    stat = os.stat(path)
    return jsonify({
        'name': name,
        'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
        'size': stat.st_size,
    }), 201


@backup_bp.route('/api/admin/backups/<name>/restore', methods=['POST'])
@require_admin
def restore_backup(name):
    if not _FILENAME_RE.match(name):
        return jsonify({'error': 'Ongeldig bestand'}), 400
    path = os.path.join(BACKUP_DIR, name)
    if not os.path.isfile(path):
        return jsonify({'error': 'Back-up niet gevonden'}), 404

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            def table_exists(table):
                cur.execute(
                    "SELECT EXISTS (SELECT FROM information_schema.tables "
                    "WHERE table_schema='public' AND table_name=%s)",
                    (table,)
                )
                return cur.fetchone()[0]

            def restore_table(table, rows, pk_col=None):
                if not table_exists(table):
                    return
                cur.execute(f"DELETE FROM {table}")
                if not rows:
                    return
                cols = list(rows[0].keys())
                col_list = ', '.join(f'"{c}"' for c in cols)
                placeholders = ', '.join(['%s'] * len(cols))
                for row in rows:
                    cur.execute(f'INSERT INTO {table} ({col_list}) VALUES ({placeholders})',
                                [_coerce(row[c]) for c in cols])
                if pk_col:
                    cur.execute(
                        f"SELECT setval(pg_get_serial_sequence(%s, %s), "
                        f"COALESCE((SELECT MAX({pk_col}) FROM {table}), 1))",
                        (table, pk_col)
                    )

            try:
                restore_table('profile',        data.get('profiles', []))
                restore_table('grades',         data.get('grades', []),         'id')
                restore_table('goals',          data.get('goals', []),          'id')
                restore_table('cv_data',        data.get('cv', []))
                restore_table('referenties',    data.get('referenties', []))
                restore_table('werkstukken',    data.get('werkstukken', []),    'id')
                restore_table('werkstuk_fotos', data.get('werkstuk_fotos', []), 'id')
                restore_table('settings',       data.get('settings', []))
                conn.commit()
            except Exception as e:
                conn.rollback()
                return jsonify({'error': str(e)}), 500
    finally:
        put_conn(conn)

    return jsonify({'ok': True})


@backup_bp.route('/api/admin/backups/<name>', methods=['DELETE'])
@require_admin
def delete_backup(name):
    if not _FILENAME_RE.match(name):
        return jsonify({'error': 'Ongeldig bestand'}), 400
    path = os.path.join(BACKUP_DIR, name)
    if not os.path.isfile(path):
        return jsonify({'error': 'Back-up niet gevonden'}), 404
    os.remove(path)
    return jsonify({'ok': True})
