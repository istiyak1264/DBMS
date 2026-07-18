from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database import init_db, get_db, close_db, mongo, MongoJSONProvider
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
import json

# Initialize Flask app
app = Flask(__name__)

# Load configuration
app.config.from_object(Config)

# Custom JSON provider for MongoDB objects (ObjectId, datetime).
# Flask 2.3 removed `app.json_encoder`; this is the replacement API.
app.json = MongoJSONProvider(app)

# Enable CORS with configuration
CORS(
    app,
    origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:3001']),
    supports_credentials=True,
    allow_headers=['Content-Type', 'Authorization'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
)

# Initialize JWT
jwt = JWTManager(app)


# Setup logging
def setup_logging():
    """Configure logging for the application"""
    if not os.path.exists('logs'):
        os.makedirs('logs')

    file_handler = RotatingFileHandler(
        'logs/mess_management.log',
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.INFO)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if app.config.get('DEBUG') else logging.INFO)

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.DEBUG if app.config.get('DEBUG') else logging.INFO)

    logging.basicConfig(level=logging.INFO)

    app.logger.info('Logging configured successfully')


setup_logging()

# Initialize database
try:
    mongo = init_db(app)
    app.logger.info("Database initialized successfully")
except Exception as e:
    app.logger.error(f"Database initialization failed: {str(e)}")
    raise


# JWT error handlers
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({
        'error': 'Missing or invalid authorization token',
        'message': 'Please provide a valid JWT token'
    }), 401


@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({
        'error': 'Invalid token',
        'message': 'The provided token is invalid or expired'
    }), 401


@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token expired',
        'message': 'Your session has expired. Please login again'
    }), 401


@jwt.revoked_token_loader
def revoked_token_response(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token revoked',
        'message': 'This token has been revoked'
    }), 401


# Request handlers
@app.before_request
def before_request():
    if not request.path.startswith('/static'):
        app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    g.start_time = datetime.now(timezone.utc)


@app.after_request
def after_request(response):
    if hasattr(g, 'start_time'):
        duration = (datetime.now(timezone.utc) - g.start_time).total_seconds() * 1000
        app.logger.info(f"Response: {response.status_code} - {duration:.2f}ms")

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    return response


@app.teardown_appcontext
def teardown_db(error):
    close_db(error)


# Import and register blueprints
from routes.auth import auth_bp
from routes.users import users_bp
from routes.meals import meals_bp
from routes.expenses import expenses_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(meals_bp, url_prefix='/api')
app.register_blueprint(expenses_bp, url_prefix='/api')

# Create uploads directory if it doesn't exist
os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = 'connected'
    try:
        mongo.db.command('ping')
    except Exception as e:
        db_status = f'disconnected: {str(e)}'
        app.logger.error(f"Health check failed: {str(e)}")

    return jsonify({
        'status': 'healthy' if db_status == 'connected' else 'unhealthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'service': 'Mess Management API',
        'version': '1.0.0',
        'database': db_status,
        'environment': app.config.get('ENVIRONMENT', 'production')
    }), 200 if db_status == 'connected' else 503


# System info endpoint
@app.route('/api/system', methods=['GET'])
def system_info():
    try:
        db_stats = mongo.db.command('dbStats')

        return jsonify({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'database': {
                'name': mongo.db.name,
                'collections': db_stats.get('collections', 0),
                'objects': db_stats.get('objects', 0),
                'data_size': db_stats.get('dataSize', 0),
                'storage_size': db_stats.get('storageSize', 0),
                'index_size': db_stats.get('indexSize', 0)
            },
            'server': {
                'host': request.host,
                'environment': app.config.get('ENVIRONMENT', 'production'),
                'debug': app.config.get('DEBUG', False)
            }
        }), 200
    except Exception as e:
        app.logger.error(f"System info error: {str(e)}")
        return jsonify({
            'error': 'Failed to get system information',
            'message': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'error': 'Resource not found',
        'message': 'The requested URL was not found on the server',
        'path': request.path
    }), 404


@app.errorhandler(405)
def method_not_allowed_error(error):
    return jsonify({
        'error': 'Method not allowed',
        'message': f'The {request.method} method is not allowed for this endpoint',
        'path': request.path
    }), 405


@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


@app.errorhandler(Exception)
def handle_exception(error):
    app.logger.error(f"Unhandled exception: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'An unexpected error occurred',
        'message': str(error) if app.config.get('DEBUG') else 'Please try again later'
    }), 500


# Context processor for template variables (if using templates)
@app.context_processor
def utility_processor():
    def get_current_year():
        return datetime.now(timezone.utc).year
    return dict(current_year=get_current_year)


# CLI commands
@app.cli.command('create-admin')
def create_admin_command():
    """Create an admin user (for development)"""
    from models.user import User
    from database import get_db

    email = input('Enter admin email: ')
    name = input('Enter admin name: ')
    password = input('Enter admin password: ')

    try:
        db = get_db()
        user_model = User(db)

        existing = user_model.find_by_email(email)
        if existing:
            print(f'User with email {email} already exists')
            return

        user_data = {
            'name': name,
            'email': email,
            'password': password,
            'role': 'admin',
            'is_active': True
        }

        result = user_model.create_user(user_data)
        print(f'Admin user created successfully with ID: {result.inserted_id}')
    except Exception as e:
        print(f'Error creating admin user: {str(e)}')


@app.cli.command('db-status')
def db_status_command():
    """Check database connection status"""
    from database import get_connection_status

    status = get_connection_status()
    print(json.dumps(status, indent=2))


@app.cli.command('backup')
def backup_command():
    """Backup database collections"""
    from database import backup_collection

    collections = ['users', 'meals', 'expenses']
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')

    for collection in collections:
        try:
            count = backup_collection(collection, f"{collection}_backup_{timestamp}")
            print(f"Backed up {count} documents from {collection}")
        except Exception as e:
            print(f"Error backing up {collection}: {str(e)}")


# Run the application
if __name__ == '__main__':
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', False)
    host = app.config.get('HOST', '0.0.0.0')

    app.logger.info(f"Starting Mess Management API on port {port}")
    app.logger.info(f"Environment: {app.config.get('ENVIRONMENT', 'production')}")

    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )