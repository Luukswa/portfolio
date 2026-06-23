import os
from flask import Blueprint, jsonify

branding_bp = Blueprint('branding', __name__)


@branding_bp.route('/api/config/branding')
def branding():
    return jsonify({
        'appName': os.environ.get('APP_NAME', 'Portfolio'),
        'primaryColor': os.environ.get('PRIMARY_COLOR', '#4f46e5'),
        'logoUrl': os.environ.get('LOGO_URL', '/logo.png'),
    })
