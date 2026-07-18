from datetime import datetime
from bson import ObjectId

class Expense:
    def __init__(self, db):
        self.collection = db.expenses

    def create_expense(self, expense_data):
        expense_data['created_at'] = datetime.utcnow()
        expense_data['updated_at'] = datetime.utcnow()
        return self.collection.insert_one(expense_data)

    def get_expense_by_id(self, expense_id):
        return self.collection.find_one({'_id': ObjectId(expense_id)})

    def get_expenses_by_date(self, start_date, end_date):
        query = {'date': {'$gte': start_date, '$lte': end_date}}
        return list(self.collection.find(query).sort('date', -1))

    def get_expenses_by_category(self, category):
        return list(self.collection.find({'category': category}).sort('date', -1))

    def update_expense(self, expense_id, update_data):
        update_data['updated_at'] = datetime.utcnow()
        return self.collection.update_one(
            {'_id': ObjectId(expense_id)},
            {'$set': update_data}
        )

    def delete_expense(self, expense_id):
        return self.collection.delete_one({'_id': ObjectId(expense_id)})

    def get_expense_summary(self, start_date, end_date):
        pipeline = [
            {'$match': {'date': {'$gte': start_date, '$lte': end_date}}},
            {'$group': {
                '_id': '$category',
                'total_amount': {'$sum': '$amount'},
                'count': {'$sum': 1}
            }}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_total_expenses(self, start_date, end_date):
        pipeline = [
            {'$match': {'date': {'$gte': start_date, '$lte': end_date}}},
            {'$group': {
                '_id': None,
                'total': {'$sum': '$amount'}
            }}
        ]
        result = list(self.collection.aggregate(pipeline))
        return result[0]['total'] if result else 0