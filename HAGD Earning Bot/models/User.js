// Firebase User Model - Wrapper for Firebase operations
const firebaseService = require('../services/firebase');

class User {
  constructor(data) {
    Object.assign(this, data);
  }

  // Save user to Firebase
  async save() {
    const savedUser = await firebaseService.save(this);
    Object.assign(this, savedUser);
    return this;
  }

  // Static methods to match Mongoose API
  static async findOne(query) {
    const userData = await firebaseService.findOne(query);
    return userData ? new User(userData) : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const userData = await firebaseService.findOneAndUpdate(query, update, options);
    return userData ? new User(userData) : null;
  }

  static async find(query = {}) {
    const usersData = await firebaseService.find(query);
    return usersData.map(userData => new User(userData));
  }

  static async countDocuments(query = {}) {
    return await firebaseService.countDocuments(query);
  }

  static async findOneAndDelete(query) {
    const userData = await firebaseService.findOneAndDelete(query);
    return userData ? new User(userData) : null;
  }

  // Create new user
  static async create(userData) {
    const newUserData = await firebaseService.create(userData);
    return new User(newUserData);
  }
}

module.exports = User;
