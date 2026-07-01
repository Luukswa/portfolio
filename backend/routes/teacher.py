import io
import os
from flask import Blueprint, jsonify, render_template, send_file
from xhtml2pdf import pisa
from middleware import require_teacher
from db import get_conn, put_conn
from routes.werkstukken import _find_user_dir, _find_werk_dir, _safe

teacher_bp = Blueprint('teacher', __name__)


def _fetch_profile(cur, student_id):
    cur.execute("SELECT display_name FROM users WHERE id = %s", (student_id,))
    user_row = cur.fetchone()
    display_name = user_row[0] if user_row else ''
    cur.execute(
        "SELECT name, title, bio, skills, hobbies, subjects, avatar_url FROM profile WHERE user_id = %s",
        (student_id,),
    )
    row = cur.fetchone()
    base = {'display_name': display_name}
    if not row:
        return {**base, 'name': '', 'title': '', 'bio': '', 'skills': [], 'hobbies': [], 'subjects': [], 'avatar_url': ''}
    return {**base, 'name': row[0], 'title': row[1], 'bio': row[2], 'skills': row[3], 'hobbies': row[4], 'subjects': row[5], 'avatar_url': row[6]}


def _fetch_grades(cur, student_id):
    cur.execute(
        "SELECT id, vak, cijfer, created_at FROM grades WHERE user_id = %s ORDER BY vak, created_at DESC",
        (student_id,),
    )
    return [{'id': r[0], 'vak': r[1], 'cijfer': float(r[2]), 'created_at': r[3].isoformat() if r[3] else None} for r in cur.fetchall()]


def _fetch_goals(cur, student_id):
    cur.execute(
        "SELECT id, doel, wil_leren, nodig FROM goals WHERE user_id = %s ORDER BY created_at DESC",
        (student_id,),
    )
    return [{'id': r[0], 'doel': r[1], 'wil_leren': r[2], 'nodig': r[3]} for r in cur.fetchall()]


def _fetch_werkstukken(cur, student_id):
    cur.execute(
        "SELECT id, vak, gemaakt_bij, datum, trots_omdat FROM werkstukken WHERE user_id=%s ORDER BY created_at DESC",
        (student_id,),
    )
    rows = cur.fetchall()
    result = []
    for r in rows:
        cur.execute(
            "SELECT id, filename FROM werkstuk_fotos WHERE werkstuk_id=%s AND filename != '' ORDER BY created_at",
            (r[0],),
        )
        fotos = [{'id': f[0], 'filename': f[1], 'url': f'/api/werkstukken/{r[0]}/fotos/{f[0]}'} for f in cur.fetchall()]
        result.append({'id': r[0], 'vak': r[1], 'gemaakt_bij': r[2],
                        'datum': r[3], 'trots_omdat': r[4], 'fotos': fotos})
    return result


def _fetch_referenties(cur, student_id):
    cur.execute(
        "SELECT id, type, naam, datum, vak, opmerking FROM referenties WHERE user_id = %s ORDER BY id",
        (student_id,),
    )
    return [
        {'id': r[0], 'type': r[1], 'naam': r[2], 'datum': r[3], 'vak': r[4], 'opmerking': r[5]}
        for r in cur.fetchall()
    ]


def _fetch_cv(cur, student_id):
    cur.execute(
        "SELECT naam, adres, postcode, telefoon, email, hobbies, vaardigheden, werkervaring FROM cv_data WHERE user_id = %s",
        (student_id,),
    )
    row = cur.fetchone()
    if not row:
        return {'naam': '', 'adres': '', 'postcode': '', 'telefoon': '', 'email': '', 'hobbies': [], 'vaardigheden': [], 'werkervaring': []}
    return {'naam': row[0], 'adres': row[1], 'postcode': row[2], 'telefoon': row[3], 'email': row[4], 'hobbies': row[5], 'vaardigheden': row[6], 'werkervaring': row[7]}


@teacher_bp.route('/api/teacher/students')
@require_teacher
def list_students():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, display_name, email, last_login FROM users "
                "WHERE is_teacher = false AND is_admin = false ORDER BY display_name"
            )
            rows = cur.fetchall()
            ids = [r[0] for r in rows]
            if not ids:
                return jsonify([])

            cur.execute("SELECT user_id, name FROM profile WHERE user_id = ANY(%s)", (ids,))
            profiel = {r[0]: bool((r[1] or '').strip()) for r in cur.fetchall()}

            cur.execute("SELECT user_id, COUNT(*) FROM grades WHERE user_id = ANY(%s) GROUP BY user_id", (ids,))
            cijfers = {r[0]: r[1] for r in cur.fetchall()}

            cur.execute("SELECT user_id, COUNT(*) FROM goals WHERE user_id = ANY(%s) GROUP BY user_id", (ids,))
            doelen = {r[0]: r[1] for r in cur.fetchall()}

            cur.execute(
                "SELECT user_id, naam, adres, telefoon, email, vaardigheden, werkervaring "
                "FROM cv_data WHERE user_id = ANY(%s)",
                (ids,),
            )
            cv = {
                r[0]: bool((r[1] or '').strip() or (r[2] or '').strip() or (r[3] or '').strip() or (r[4] or '').strip() or r[5] or r[6])
                for r in cur.fetchall()
            }

            cur.execute("SELECT user_id, COUNT(*) FROM referenties WHERE user_id = ANY(%s) GROUP BY user_id", (ids,))
            referenties = {r[0]: r[1] for r in cur.fetchall()}

            cur.execute("SELECT user_id, COUNT(*) FROM werkstukken WHERE user_id = ANY(%s) GROUP BY user_id", (ids,))
            werkstukken = {r[0]: r[1] for r in cur.fetchall()}

        return jsonify([{
            'id':           r[0],
            'display_name': r[1],
            'email':        r[2],
            'last_login':   r[3].isoformat() if r[3] else None,
            'completion': {
                'profiel':     profiel.get(r[0], False),
                'cijfers':     cijfers.get(r[0], 0),
                'doelen':      doelen.get(r[0], 0),
                'cv':          cv.get(r[0], False),
                'referenties': referenties.get(r[0], 0),
                'werkstukken': werkstukken.get(r[0], 0),
            },
        } for r in rows])
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/profile')
@require_teacher
def student_profile(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_profile(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/grades')
@require_teacher
def student_grades(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_grades(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/goals')
@require_teacher
def student_goals(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_goals(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/werkstukken')
@require_teacher
def student_werkstukken(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_werkstukken(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/referenties')
@require_teacher
def student_referenties(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_referenties(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/cv')
@require_teacher
def student_cv(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            return jsonify(_fetch_cv(cur, student_id))
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/pdf')
@require_teacher
def student_pdf(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            profile     = _fetch_profile(cur, student_id)
            grades      = _fetch_grades(cur, student_id)
            goals       = _fetch_goals(cur, student_id)
            cv          = _fetch_cv(cur, student_id)
            referenties = _fetch_referenties(cur, student_id)
            werkstukken = _fetch_werkstukken(cur, student_id)
    finally:
        put_conn(conn)

    avg = round(sum(g['cijfer'] for g in grades) / len(grades), 1) if grades else None

    user_dir = _find_user_dir(student_id)

    avatar_path = None
    if user_dir:
        for f in os.listdir(user_dir):
            if f.startswith('avatar.'):
                avatar_path = os.path.join(user_dir, f).replace('\\', '/')
                break

    for w in werkstukken:
        foto_paths = []
        werk_dir = _find_werk_dir(user_dir, w['id']) if user_dir else None
        if werk_dir:
            for foto in w['fotos']:
                path = os.path.join(werk_dir, foto['filename'])
                if os.path.isfile(path):
                    foto_paths.append(path.replace('\\', '/'))
        w['foto_paths'] = foto_paths

    html = render_template(
        'portfolio_pdf.html',
        profile=profile, avatar_path=avatar_path,
        grades=grades, avg=avg, goals=goals, cv=cv,
        referenties=referenties, werkstukken=werkstukken,
    )

    buf = io.BytesIO()
    pisa.CreatePDF(html, dest=buf, link_callback=lambda uri, rel: uri)
    buf.seek(0)

    filename = f"portfolio_{_safe(profile['display_name'] or 'leerling')}.pdf"
    return send_file(buf, mimetype='application/pdf', as_attachment=True, download_name=filename)
