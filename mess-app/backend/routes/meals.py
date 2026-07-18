from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.meal import Meal
from bson import ObjectId
from datetime import datetime

meals_bp = Blueprint('meals', __name__)

@meals_bp.route('/meals', methods=['POST'])
@jwt_required()
def create_meal():
    data = request.get_json()
    
    required_fields = ['member_id', 'meal_count', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = get_db()
    meal_model = Meal(db)
    
    # Set cost if not provided
    if 'cost' not in data:
        data['cost'] = data['meal_count'] * 50  # Default rate per meal
    
    try:
        result = meal_model.create_meal(data)
        return jsonify({
            'message': 'Meal created successfully',
            'meal_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@meals_bp.route('/meals', methods=['GET'])
@jwt_required()
def get_meals():
    member_id = request.args.get('member_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    db = get_db()
    meal_model = Meal(db)
    
    if member_id:
        meals = meal_model.get_meals_by_member(member_id, start_date, end_date)
    elif start_date and end_date:
        meals = meal_model.get_meals_by_date_range(start_date, end_date)
    else:
        meals = list(db.meals.find().sort('date', -1).limit(100))
    
    # Convert ObjectId to string
    for meal in meals:
        meal['_id'] = str(meal['_id'])
    
    return jsonify(meals), 200

@meals_bp.route('/meals/<meal_id>', methods=['PUT'])
@jwt_required()
def update_meal(meal_id):
    data = request.get_json()
    
    db = get_db()
    meal_model = Meal(db)
    
    result = meal_model.update_meal(meal_id, data)
    if result.matched_count == 0:
        return jsonify({'error': 'Meal not found'}), 404
    
    return jsonify({'message': 'Meal updated successfully'}), 200

@meals_bp.route('/meals/<meal_id>', methods=['DELETE'])
@jwt_required()
def delete_meal(meal_id):
    db = get_db()
    meal_model = Meal(db)
    
    result = meal_model.delete_meal(meal_id)
    if result.deleted_count == 0:
        return jsonify({'error': 'Meal not found'}), 404
    
    return jsonify({'message': 'Meal deleted successfully'}), 200

@meals_bp.route('/meals/summary', methods=['GET'])
@jwt_required()
def get_meal_summary():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'error': 'Start date and end date required'}), 400
    
    db = get_db()
    meal_model = Meal(db)
    
    summary = meal_model.get_meal_summary(start_date, end_date)
    
    # Convert ObjectId to string
    for item in summary:
        item['_id'] = str(item['_id'])
        item['member']['_id'] = str(item['member']['_id'])
        item['member'].pop('password', None)
    
    return jsonify(summary), 200