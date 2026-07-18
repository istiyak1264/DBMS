from datetime import datetime
from bson import ObjectId

class Meal:
    def __init__(self, db):
        self.collection = db.meals

    def create_meal(self, meal_data):
        meal_data['created_at'] = datetime.utcnow()
        meal_data['updated_at'] = datetime.utcnow()
        return self.collection.insert_one(meal_data)

    def get_meal_by_id(self, meal_id):
        return self.collection.find_one({'_id': ObjectId(meal_id)})

    def get_meals_by_member(self, member_id, start_date=None, end_date=None):
        query = {'member_id': member_id}
        if start_date and end_date:
            query['date'] = {'$gte': start_date, '$lte': end_date}
        return list(self.collection.find(query).sort('date', -1))

    def get_meals_by_date(self, date):
        return list(self.collection.find({'date': date}))

    def update_meal(self, meal_id, update_data):
        update_data['updated_at'] = datetime.utcnow()
        return self.collection.update_one(
            {'_id': ObjectId(meal_id)},
            {'$set': update_data}
        )

    def delete_meal(self, meal_id):
        return self.collection.delete_one({'_id': ObjectId(meal_id)})

    def get_meal_summary(self, start_date, end_date):
        pipeline = [
            {'$match': {'date': {'$gte': start_date, '$lte': end_date}}},
            {'$group': {
                '_id': '$member_id',
                'total_meals': {'$sum': '$meal_count'},
                'total_cost': {'$sum': '$cost'}
            }},
            {'$lookup': {
                'from': 'users',
                'localField': '_id',
                'foreignField': '_id',
                'as': 'member'
            }},
            {'$unwind': '$member'}
        ]
        return list(self.collection.aggregate(pipeline))