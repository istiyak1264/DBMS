import os
from dotenv import load_dotenv
import secrets
import string

# Load environment variables
load_dotenv()


class Config:
    # ===== DATABASE CONFIGURATION =====
    # MongoDB connection string with authentication
    MONGO_URI = os.getenv('MONGO_URI')

    # If MONGO_URI is not set, build it from individual components
    if not MONGO_URI:
        MONGO_HOST = os.getenv('MONGO_HOST', 'mongodb')
        MONGO_PORT = os.getenv('MONGO_PORT', '27017')
        MONGO_DATABASE = os.getenv('MONGO_DATABASE', 'mess_management')
        MONGO_USERNAME = os.getenv('MONGO_USERNAME')
        MONGO_PASSWORD = os.getenv('MONGO_PASSWORD')
        # Root users created via MONGO_INITDB_ROOT_USERNAME/PASSWORD always
        # authenticate against the "admin" database, so that's the correct
        # default authSource (not the app's own database name).
        MONGO_AUTH_SOURCE = os.getenv('MONGO_AUTH_SOURCE', 'admin')

        if MONGO_USERNAME and MONGO_PASSWORD:
            MONGO_URI = (
                f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}@"
                f"{MONGO_HOST}:{MONGO_PORT}/{MONGO_DATABASE}?authSource={MONGO_AUTH_SOURCE}"
            )
        else:
            MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DATABASE}"

    if not MONGO_URI:
        raise ValueError("MONGO_URI environment variable is not set")

    # ===== JWT CONFIGURATION =====
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        JWT_SECRET_KEY = ''.join(
            secrets.choice(string.ascii_letters + string.digits + string.punctuation)
            for _ in range(50)
        )
        print("WARNING: JWT_SECRET_KEY not set. Generated a random key (will change on every restart).")

    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))

    # ===== SERVER CONFIGURATION =====
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

    # ===== FILE UPLOAD CONFIGURATION =====
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

    # ===== SECURITY CONFIGURATION =====
    SECRET_KEY = os.getenv('SECRET_KEY', JWT_SECRET_KEY)
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # ===== CORS CONFIGURATION =====
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:8081'
    ).split(',')

    # ===== RATE LIMITING =====
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'True').lower() == 'true'
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100 per day;10 per hour')

    # ===== LOGGING =====
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

    @staticmethod
    def validate_config():
        """Validate critical configuration values"""
        if not Config.MONGO_URI:
            raise ValueError("MONGO_URI must be set")
        if not Config.JWT_SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY must be set")
        if Config.JWT_ACCESS_TOKEN_EXPIRES <= 0:
            raise ValueError("JWT_ACCESS_TOKEN_EXPIRES must be positive")
        return True


# Validate configuration on import
Config.validate_config()