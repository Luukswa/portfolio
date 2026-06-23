import os
from flask import Flask, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ['FLASK_SECRET_KEY']

# Trust one proxy (NGINX) so request.is_secure and cookie Secure flag work correctly
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'

from routes.auth import auth_bp
from routes.branding import branding_bp
from routes.profile import profile_bp

app.register_blueprint(auth_bp)
app.register_blueprint(branding_bp)
app.register_blueprint(profile_bp)

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    candidate = os.path.join(DIST, path)
    if path and os.path.isfile(candidate):
        return send_from_directory(DIST, path)
    return send_from_directory(DIST, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
