from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.user import User
from bson import ObjectId

users_bp = Blueprint('users', __name__)

@users_bp.route('/members', methods=['GET'])
@jwt_required()
def get_members():
    db = get_db()
    user_model = User(db)
    
    members = user_model.get_all_members()
    # Convert ObjectId to string and remove password
    for member in members:
        member['_id'] = str(member['_id'])
        member.pop('password', None)
    
    return jsonify(members), 200

@users_bp.route('/members/<member_id>', methods=['GET'])
@jwt_required()
def get_member(member_id):
    db = get_db()
    user_model = User(db)
    
    member = user_model.find_by_id(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    
    member['_id'] = str(member['_id'])
    member.pop('password', None)
    
    return jsonify(member), 200

@users_bp.route('/members/<member_id>', methods=['PUT'])
@jwt_required()
def update_member(member_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Check if user is updating their own profile or is admin
    db = get_db()
    user_model = User(db)
    
    current_user = user_model.find_by_id(current_user_id)
    if not current_user or (current_user_id != member_id and current_user.get('role') != 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Remove sensitive fields from update
    update_data = {k: v for k, v in data.items() if k not in ['_id', 'password', 'created_at']}
    
    result = user_model.update_user(member_id, update_data)
    if result.matched_count == 0:
        return jsonify({'error': 'Member not found'}), 404
    
    return jsonify({'message': 'Member updated successfully'}), 200

@users_bp.route('/members/<member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    current_user_id = get_jwt_identity()
    
    db = get_db()
    user_model = User(db)
    
    current_user = user_model.find_by_id(current_user_id)
    if not current_user or current_user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    result = user_model.delete_user(member_id)
    if result.deleted_count == 0:
        return jsonify({'error': 'Member not found'}), 404
    
    return jsonify({'message': 'Member deleted successfully'}), 200

@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    db = get_db()
    user_model = User(db)
    
    member_count = user_model.get_member_count()
    
    return jsonify({
        'total_members': member_count
    }), 200