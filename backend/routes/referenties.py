from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

referenties_bp = Blueprint('referenties', __name__)


def _ensure_table(cur):
    # Migrate old fixed-column schema
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'referenties' AND column_name = 'ref1_datum'
    """)
    if cur.fetchone():
        cur.execute("DROP TABLE referenties")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS referenties (
            id        SERIAL PRIMARY KEY,
            user_id   INTEGER NOT NULL,
            type      TEXT NOT NULL DEFAULT '',
            naam      TEXT NOT NULL DEFAULT '',
            datum     TEXT NOT NULL DEFAULT '',
            vak       TEXT NOT NULL DEFAULT '',
            opmerking TEXT NOT NULL DEFAULT ''
        )
    """)


@referenties_bp.route('/api/referenties')
@require_auth
def get_referenties():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT id, type, naam, datum, vak, opmerking FROM referenties WHERE user_id = %s ORDER BY id",
                (user_id,),
            )
            rows = cur.fetchall()
        return jsonify([
            {'id': r[0], 'type': r[1], 'naam': r[2], 'datum': r[3], 'vak': r[4], 'opmerking': r[5]}
            for r in rows
        ])
    finally:
        put_conn(conn)


@referenties_bp.route('/api/referenties', methods=['PUT'])
@require_auth
def save_referenties():
    user_id = session['user']['id']
    items = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute("DELETE FROM referenties WHERE user_id = %s", (user_id,))
            for item in items:
                cur.execute(
                    "INSERT INTO referenties (user_id, type, naam, datum, vak, opmerking) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, item.get('type', ''), item.get('naam', ''), item.get('datum', ''), item.get('vak', ''), item.get('opmerking', '')),
                )
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
