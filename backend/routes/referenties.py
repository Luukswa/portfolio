from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

referenties_bp = Blueprint('referenties', __name__)


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS referenties (
            user_id        INTEGER PRIMARY KEY,
            ref1_datum     TEXT NOT NULL DEFAULT '',
            ref1_naam      TEXT NOT NULL DEFAULT '',
            ref1_vak       TEXT NOT NULL DEFAULT '',
            ref1_opmerking TEXT NOT NULL DEFAULT '',
            ref2_datum     TEXT NOT NULL DEFAULT '',
            ref2_naam      TEXT NOT NULL DEFAULT '',
            ref2_vak       TEXT NOT NULL DEFAULT '',
            ref2_opmerking TEXT NOT NULL DEFAULT ''
        )
    """)


def _row_to_dict(row):
    return {
        'ref1': {'datum': row[0], 'naam': row[1], 'vak': row[2], 'opmerking': row[3]},
        'ref2': {'datum': row[4], 'naam': row[5], 'vak': row[6], 'opmerking': row[7]},
    }


def _empty():
    empty = {'datum': '', 'naam': '', 'vak': '', 'opmerking': ''}
    return {'ref1': dict(empty), 'ref2': dict(empty)}


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
                "SELECT ref1_datum, ref1_naam, ref1_vak, ref1_opmerking, ref2_datum, ref2_naam, ref2_vak, ref2_opmerking FROM referenties WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
        return jsonify(_row_to_dict(row) if row else _empty())
    finally:
        put_conn(conn)


@referenties_bp.route('/api/referenties', methods=['PUT'])
@require_auth
def save_referenties():
    user_id = session['user']['id']
    data = request.get_json(force=True)
    r1 = data.get('ref1', {})
    r2 = data.get('ref2', {})
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute("""
                INSERT INTO referenties (user_id, ref1_datum, ref1_naam, ref1_vak, ref1_opmerking, ref2_datum, ref2_naam, ref2_vak, ref2_opmerking)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    ref1_datum=EXCLUDED.ref1_datum, ref1_naam=EXCLUDED.ref1_naam,
                    ref1_vak=EXCLUDED.ref1_vak, ref1_opmerking=EXCLUDED.ref1_opmerking,
                    ref2_datum=EXCLUDED.ref2_datum, ref2_naam=EXCLUDED.ref2_naam,
                    ref2_vak=EXCLUDED.ref2_vak, ref2_opmerking=EXCLUDED.ref2_opmerking
            """, (
                user_id,
                r1.get('datum', ''), r1.get('naam', ''), r1.get('vak', ''), r1.get('opmerking', ''),
                r2.get('datum', ''), r2.get('naam', ''), r2.get('vak', ''), r2.get('opmerking', ''),
            ))
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
