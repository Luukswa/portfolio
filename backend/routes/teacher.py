import json
from flask import Blueprint, jsonify
from middleware import require_teacher
from db import get_conn, put_conn

teacher_bp = Blueprint('teacher', __name__)


@teacher_bp.route('/api/teacher/students')
@require_teacher
def list_students():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, display_name, email, last_login FROM users ORDER BY display_name"
            )
            rows = cur.fetchall()
        return jsonify([{
            'id':           r[0],
            'display_name': r[1],
            'email':        r[2],
            'last_login':   r[3].isoformat() if r[3] else None,
        } for r in rows])
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/profile')
@require_teacher
def student_profile(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
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
            return jsonify({**base, 'name': '', 'title': '', 'bio': '', 'skills': [], 'hobbies': [], 'subjects': [], 'avatar_url': ''})
        return jsonify({**base, 'name': row[0], 'title': row[1], 'bio': row[2], 'skills': row[3], 'hobbies': row[4], 'subjects': row[5], 'avatar_url': row[6]})
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/grades')
@require_teacher
def student_grades(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, vak, cijfer, created_at FROM grades WHERE user_id = %s ORDER BY vak, created_at DESC",
                (student_id,),
            )
            rows = cur.fetchall()
        return jsonify([{'id': r[0], 'vak': r[1], 'cijfer': float(r[2]), 'created_at': r[3].isoformat() if r[3] else None} for r in rows])
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/goals')
@require_teacher
def student_goals(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, doel, wil_leren, nodig FROM goals WHERE user_id = %s ORDER BY created_at DESC",
                (student_id,),
            )
            rows = cur.fetchall()
        return jsonify([{'id': r[0], 'doel': r[1], 'wil_leren': r[2], 'nodig': r[3]} for r in rows])
    finally:
        put_conn(conn)


@teacher_bp.route('/api/teacher/students/<int:student_id>/cv')
@require_teacher
def student_cv(student_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT naam, adres, postcode, telefoon, email, hobbies, vaardigheden, werkervaring FROM cv_data WHERE user_id = %s",
                (student_id,),
            )
            row = cur.fetchone()
        if not row:
            return jsonify({'naam': '', 'adres': '', 'postcode': '', 'telefoon': '', 'email': '', 'hobbies': [], 'vaardigheden': [], 'werkervaring': []})
        return jsonify({'naam': row[0], 'adres': row[1], 'postcode': row[2], 'telefoon': row[3], 'email': row[4], 'hobbies': row[5], 'vaardigheden': row[6], 'werkervaring': row[7]})
    finally:
        put_conn(conn)
