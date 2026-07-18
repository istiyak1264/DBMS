from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import get_db
from models.expense import Expense
from bson import ObjectId

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    data = request.get_json()
    
    required_fields = ['description', 'amount', 'category', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = get_db()
    expense_model = Expense(db)
    
    try:
        result = expense_model.create_expense(data)
        return jsonify({
            'message': 'Expense created successfully',
            'expense_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    
    db = get_db()
    expense_model = Expense(db)
    
    if start_date and end_date:
        expenses = expense_model.get_expenses_by_date(start_date, end_date)
    elif category:
        expenses = expense_model.get_expenses_by_category(category)
    else:
        expenses = list(db.expenses.find().sort('date', -1).limit(100))
    
    # Convert ObjectId to string
    for expense in expenses:
        expense['_id'] = str(expense['_id'])
    
    return jsonify(expenses), 200

@expenses_bp.route('/expenses/<expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    data = request.get_json()
    
    db = get_db()
    expense_model = Expense(db)
    
    result = expense_model.update_expense(expense_id, data)
    if result.matched_count == 0:
        return jsonify({'error': 'Expense not found'}), 404
    
    return jsonify({'message': 'Expense updated successfully'}), 200

@expenses_bp.route('/expenses/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    db = get_db()
    expense_model = Expense(db)
    
    result = expense_model.delete_expense(expense_id)
    if result.deleted_count == 0:
        return jsonify({'error': 'Expense not found'}), 404
    
    return jsonify({'message': 'Expense deleted successfully'}), 200

@expenses_bp.route('/expenses/summary', methods=['GET'])
@jwt_required()
def get_expense_summary():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'error': 'Start date and end date required'}), 400
    
    db = get_db()
    expense_model = Expense(db)
    
    summary = expense_model.get_expense_summary(start_date, end_date)
    total = expense_model.get_total_expenses(start_date, end_date)
    
    return jsonify({
        'summary': summary,
        'total': total
    }), 200