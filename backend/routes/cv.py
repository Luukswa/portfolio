import json
from flask import Blueprint, request, jsonify, session
from middleware import require_auth
from db import get_conn, put_conn

cv_bp = Blueprint('cv', __name__)


def _ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cv_data (
            user_id      INTEGER PRIMARY KEY,
            naam         TEXT NOT NULL DEFAULT '',
            adres        TEXT NOT NULL DEFAULT '',
            postcode     TEXT NOT NULL DEFAULT '',
            telefoon     TEXT NOT NULL DEFAULT '',
            email        TEXT NOT NULL DEFAULT '',
            hobbies      JSONB NOT NULL DEFAULT '[]',
            vaardigheden JSONB NOT NULL DEFAULT '[]',
            werkervaring JSONB NOT NULL DEFAULT '[]'
        )
    """)


@cv_bp.route('/api/cv')
@require_auth
def get_cv():
    user_id = session['user']['id']
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            cur.execute(
                "SELECT naam, adres, postcode, telefoon, email, hobbies, vaardigheden, werkervaring FROM cv_data WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
        if not row:
            return jsonify({
                'naam': '', 'adres': '', 'postcode': '', 'telefoon': '',
                'email': session['user'].get('email', ''),
                'hobbies': [], 'vaardigheden': [], 'werkervaring': [],
            })
        return jsonify({
            'naam': row[0], 'adres': row[1], 'postcode': row[2],
            'telefoon': row[3], 'email': row[4],
            'hobbies': row[5], 'vaardigheden': row[6], 'werkervaring': row[7],
        })
    finally:
        put_conn(conn)


@cv_bp.route('/api/cv', methods=['PUT'])
@require_auth
def save_cv():
    user_id = session['user']['id']
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            cur.execute("""
                INSERT INTO cv_data (user_id, naam, adres, postcode, telefoon, email, hobbies, vaardigheden, werkervaring)
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
                ON CONFLICT (user_id) DO UPDATE SET
                    naam=EXCLUDED.naam, adres=EXCLUDED.adres, postcode=EXCLUDED.postcode,
                    telefoon=EXCLUDED.telefoon, email=EXCLUDED.email,
                    hobbies=EXCLUDED.hobbies, vaardigheden=EXCLUDED.vaardigheden,
                    werkervaring=EXCLUDED.werkervaring
            """, (
                user_id,
                data.get('naam', ''), data.get('adres', ''), data.get('postcode', ''),
                data.get('telefoon', ''), data.get('email', ''),
                json.dumps(data.get('hobbies', [])),
                json.dumps(data.get('vaardigheden', [])),
                json.dumps(data.get('werkervaring', [])),
            ))
            conn.commit()
        return jsonify({'ok': True})
    finally:
        put_conn(conn)
