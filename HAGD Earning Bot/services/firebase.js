const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  "type": "service_account",
  "project_id": "wtf-bot-76db0",
  "private_key_id": "1e5e822791c3d9631cffc5ef786adae094ab7670",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCb7rHM1VfocQer\n5ivJ6dYCXSa8QyJ7iwa3JSnGQ7kZcNI/JBH/714wZQW/BC/KTGHtPusVosZSJCYq\nQkT6GAZwUxA1C3A1yb/u++kov/rEwipUgiJLBI9WU4d3/rBkAg8yBZlUI0dRdGJQ\nBs2EMAsg7sS3HmWIhw4xE9wLs2CsheQOe+PzsUu+gu28qJm9jzeeZ1xoz0Updi9Z\n57GeEBq6FCkhL2OWG5sX6/bDfEZGi4qcEDCD4S72CE5wDFA8x3R+8Vp5UmmLeYv4\npScfQTzVi/eMKA7ZGcnYfg5k8XIuIunaT0IzDQMvyXev9M6RTB+4lQonD9s/B1+z\nCJJ/+KYjAgMBAAECggEAQS7y3HGCogQ99LnvLCS39Z0DCEf4LjTbxcufPuYohl4H\nRaXKcHabpRdV45fYcnSjqw1WMGEvDj9WROwW8YUBjArtB3+UlKeVuE1OFl7KcV3J\nXDJaK4nocWnRg3PQQL4ro/l7MxTcR0yjnFh7qPp8bHPjf7kRMJVkdVeb8Lg3fWaD\nTClOQ18hw9n8OW0pYY8chhyFkoF521FrSoB+A2f2C/b3J+RVPyta9oBsYvBjUfcO\nw+6uEFTwu+8WyeadRXCdq6xt4bEpJHQObJiFS7o9ATG+IapsGi7kEfV5TmHv3rz6\niECUjxB0/6bP0iI+4JavFbI80G2ZDgwtjOXFLM4cgQKBgQDajPbXDvG+qZVM0NAy\nAnTfl+OqOXcD6jo3TG3eiBdPkpHqhJVi08uyS61R/KMhMVS8TkOdi25CxQd5+Pd5\nELr4l2qg9V4NIl5ZpV0sn63S2DOrEsUhxxaeJ0T+Z6Ae6kqYaDYXTTS4sPIwCrIn\njdaTC9suh4Db5+4H1eKo0FXgEQKBgQC2puRNsz9CmPLcW3rI/+kio32380ARbvjt\nI5sC2wI8jxw/vmVTvgIRq/TCH8zKAj3J5xvoiY77u31Ftdzk0H47kxuV6Xs7DffZ\nBhslG0u3epv+/uT751YgzrMR+M1Sz2fMoZOI3mWwuPcOTJ5Um0XbzL8RPELFOJ/o\nIb4YdXuW8wKBgFc7GHLyJg9BxLOqTM8JJ/juuRICabyISsAzo07E5vj9uXvve2i8\nvHrntcAZpErlU7rtShOhyVqhJcDLXItX4CjE1uxzwxxe8WW6mRvsiAa2ALlxfnli\n62YoqmMYnVJ5lViLj7txN2/YQHJocn9TH6gFfXBu6UHcqqc5+YQD06LhAoGAIDcJ\nV2cBBlcBprn/ywnP7csWNmaR60E+aFz6TyOfnlzDZ77GEmIV7VX94mtHbG2+xiib\n9ISmkmG8M5pi7nyTdyB4IhW/JWhOSZnZGc9ZqG/Yqb39VyyzNTAfx1CxriRks2Pg\nKKjJGMVW1c/PsS59wMm4/Wo6gJx/H6sr4xZ9iN8CgYBOlhZEw01vZS5fXu17KeR+\nqmQ67dndFthsADjmWFE2RzRezBuZtt45212QEHoubdjKK9t4skAF9kdtsok40Q4k\naL5/XznnOcjaFBkevszFgoS1IOf9rji1UI4+Ocb6ke6UQR35IaKPGwStWnklQnNj\nA3HH+AJHraW+MLTy2Cc3gA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wtf-bot-76db0.iam.gserviceaccount.com",
  "client_id": "115856527983135867909",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wtf-bot-76db0.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

class FirebaseUserService {
  constructor() {
    this.collection = db.collection('users');
  }

  // Generate unique referral code
  generateReferralCode() {
    return 'HAGD' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // Find user by telegram ID
  async findOne(query) {
    try {
      if (query.telegramId) {
        const snapshot = await this.collection.where('telegramId', '==', query.telegramId).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  // Create new user
  async create(userData) {
    try {
      const newUser = {
        ...userData,
        hagdBalance: 0,
        referralCode: this.generateReferralCode(),
        referredBy: null,
        referrals: [],
        totalReferralEarnings: 0,
        lastAdWatch: null,
        lastBonusClaim: null,
        withdrawals: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.collection.add(newUser);
      return { id: docRef.id, ...newUser };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async findOneAndUpdate(query, update, options = {}) {
    try {
      if (query.telegramId) {
        const snapshot = await this.collection.where('telegramId', '==', query.telegramId).get();
        if (snapshot.empty) {
          if (options.upsert) {
            return await this.create({ telegramId: query.telegramId, ...update.$set });
          }
          return null;
        }

        const doc = snapshot.docs[0];
        const currentData = doc.data();
        let updateData = {};
        
        // Handle $set operations
        if (update.$set) {
          updateData = { ...updateData, ...update.$set };
        }
        
        // Handle $push operations
        if (update.$push) {
          for (const [field, value] of Object.entries(update.$push)) {
            const currentArray = currentData[field] || [];
            updateData[field] = [...currentArray, value];
          }
        }
        
        // Handle $inc operations
        if (update.$inc) {
          for (const [field, value] of Object.entries(update.$inc)) {
            const currentValue = currentData[field] || 0;
            updateData[field] = currentValue + value;
          }
        }

        // Handle direct update (no operators)
        if (!update.$set && !update.$push && !update.$inc) {
          updateData = update;
        }

        await doc.ref.update(updateData);
        const updatedDoc = await doc.ref.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Save user (create or update)
  async save(userData) {
    try {
      if (userData.id) {
        // Update existing user
        const docRef = this.collection.doc(userData.id);
        const { id, ...dataToUpdate } = userData;
        await docRef.update(dataToUpdate);
        return userData;
      } else {
        // Create new user
        return await this.create(userData);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // Find all users (for admin purposes)
  async find(query = {}) {
    try {
      let queryRef = this.collection;
      
      // Apply filters if provided
      for (const [field, value] of Object.entries(query)) {
        queryRef = queryRef.where(field, '==', value);
      }

      const snapshot = await queryRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error finding users:', error);
      throw error;
    }
  }

  // Count users
  async countDocuments(query = {}) {
    try {
      const users = await this.find(query);
      return users.length;
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  // Delete user
  async findOneAndDelete(query) {
    try {
      if (query.telegramId) {
        const snapshot = await this.collection.where('telegramId', '==', query.telegramId).get();
        if (snapshot.empty) return null;
        
        const doc = snapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() };
        await doc.ref.delete();
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseUserService();
