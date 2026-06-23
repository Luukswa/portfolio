import os
from flask import Blueprint, jsonify

branding_bp = Blueprint('branding', __name__)


@branding_bp.route('/api/config/branding')
def branding():
    return jsonify({
        'appName': os.environ.get('APP_NAME') or 'Portfolio',
        'primaryColor': os.environ.get('PRIMARY_COLOR') or '#0d4c92',
        'logoUrl': os.environ.get('LOGO_URL') or '/logo.png',
    })
