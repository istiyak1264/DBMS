from flask_pymongo import PyMongo
from flask import current_app, g
from flask.json.provider import DefaultJSONProvider
from bson import ObjectId
from datetime import datetime, timezone

# Initialize PyMongo instance
mongo = PyMongo()


class MongoJSONProvider(DefaultJSONProvider):
    """Flask 2.2+ JSON provider that knows how to serialize ObjectId and
    datetime objects coming back from MongoDB. Replaces the old
    `app.json_encoder = ...` pattern, which was removed in Flask 2.3."""

    @staticmethod
    def default(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return DefaultJSONProvider.default(obj)


def init_db(app):
    try:
        mongo.init_app(app)

        with app.app_context():
            mongo.db.command('ping')
            app.logger.info("Successfully connected to MongoDB with authentication")

            db_info = mongo.db.command('dbStats')
            app.logger.info(f"Database: {mongo.db.name}, Collections: {db_info.get('collections', 0)}")

            create_indexes()

        return mongo
    except Exception as e:
        app.logger.error(f"Failed to connect to MongoDB: {str(e)}")
        app.logger.error("Please check your MongoDB credentials in the .env file")
        raise


def get_db():
    if mongo.db is None:
        raise RuntimeError("Database not initialized. Call init_db first.")
    return mongo.db


def get_collection(collection_name):
    db = get_db()
    return db[collection_name]


def create_indexes():
    try:
        db = get_db()

        # Users collection indexes
        db.users.create_index('email', unique=True)
        db.users.create_index([('name', 1)])
        db.users.create_index([('role', 1)])
        db.users.create_index([('created_at', -1)])

        # Meals collection indexes
        db.meals.create_index([('member_id', 1), ('date', -1)])
        db.meals.create_index([('date', -1)])
        db.meals.create_index([('member_id', 1)])

        # Expenses collection indexes
        db.expenses.create_index([('date', -1)])
        db.expenses.create_index([('category', 1)])
        db.expenses.create_index([('date', -1), ('category', 1)])

        # Combined indexes for reports
        db.meals.create_index([('member_id', 1), ('date', -1), ('meal_count', 1)])
        db.expenses.create_index([('category', 1), ('date', -1)])

        current_app.logger.info("Database indexes created successfully")
    except Exception as e:
        current_app.logger.error(f"Error creating indexes: {str(e)}")
        raise


def get_connection_status():
    try:
        db = get_db()
        db.command('ping')
        return {
            'status': 'connected',
            'database': db.name,
            'collections': db.list_collection_names(),
            'authenticated': True
        }
    except Exception as e:
        return {
            'status': 'disconnected',
            'error': str(e),
            'authenticated': False
        }


def backup_collection(source_collection, target_collection):
    """Copy every document from `source_collection` into `target_collection`
    within the same database. Returns the number of documents copied.

    Used by the `flask backup` CLI command in app.py, which previously
    imported a function that didn't exist here."""
    db = get_db()
    documents = list(db[source_collection].find())
    if not documents:
        return 0
    db[target_collection].insert_many(documents)
    return len(documents)


# Context processor for Flask
def get_db_context():
    if 'db' not in g:
        g.db = get_db()
    return g.db


# Cleanup function
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        # PyMongo handles connection pooling automatically
        pass