const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tier: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  storageLimit: {
    type: Number,
    default: 1073741824 // 1GB in bytes (default for free tier)
  },
  folders: {
    type: [String],
    default: ['root']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);