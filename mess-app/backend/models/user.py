from datetime import datetime
from flask import current_app
import bcrypt

class User:
    def __init__(self, db):
        self.collection = db.users

    def create_user(self, user_data):
        # Hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(user_data['password'].encode('utf-8'), salt)
        user_data['password'] = hashed
        user_data['created_at'] = datetime.utcnow()
        user_data['updated_at'] = datetime.utcnow()
        user_data['is_active'] = True
        user_data['role'] = user_data.get('role', 'member')
        
        return self.collection.insert_one(user_data)

    def find_by_email(self, email):
        return self.collection.find_one({'email': email})

    def find_by_id(self, user_id):
        from bson import ObjectId
        return self.collection.find_one({'_id': ObjectId(user_id)})

    def verify_password(self, user, password):
        return bcrypt.checkpw(password.encode('utf-8'), user['password'])

    def update_user(self, user_id, update_data):
        from bson import ObjectId
        update_data['updated_at'] = datetime.utcnow()
        return self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )

    def delete_user(self, user_id):
        from bson import ObjectId
        return self.collection.delete_one({'_id': ObjectId(user_id)})

    def get_all_members(self):
        return list(self.collection.find({}, {'password': 0}))

    def get_member_count(self):
        return self.collection.count_documents({'role': 'member'})