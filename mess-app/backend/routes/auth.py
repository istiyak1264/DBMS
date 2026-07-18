from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import get_db
from models.user import User
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = get_db()
    user_model = User(db)
    
    # Check if user already exists
    existing_user = user_model.find_by_email(data['email'])
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create user
    try:
        result = user_model.create_user(data)
        return jsonify({
            'message': 'User created successfully',
            'user_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    db = get_db()
    user_model = User(db)
    
    user = user_model.find_by_email(data['email'])
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user_model.verify_password(user, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create access token
    access_token = create_access_token(
        identity=str(user['_id']),
        expires_delta=timedelta(days=1)
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'member')
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    db = get_db()
    user_model = User(db)
    
    user = user_model.find_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Remove password from response
    user.pop('password', None)
    user['_id'] = str(user['_id'])
    
    return jsonify(user), 200