// User model representation.
// This file serves as both a structural blueprint for standard database schemas (e.g. MongoDB/Mongoose)
// and an in-memory utility constructor for Phase 1.

/*
// MongoDB / Mongoose Schema Blueprint:
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
*/

// Phase 1 In-Memory Blueprint:
class User {
  constructor({ id, name, email, password, avatarUrl }) {
    this.id = id || Math.random().toString(36).substring(2, 9);
    this.name = name;
    this.email = email;
    this.password = password; // Should be hashed prior to construction
    this.avatarUrl = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`;
    this.createdAt = new Date();
  }
}

module.exports = User;
