const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  shareId: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String
  },
  isOtpVerified: {
    type: Boolean,
    default: false
  },
  isPasswordProtected: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  },
  permission: {
    type: String,
    enum: ['view', 'download', 'edit'],
    default: 'view'
  },
  accessToken: {
    type: String
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Populate file data when fetching share
shareSchema.pre('find', function() {
  this.populate('file', 'originalName size mimetype');
});

shareSchema.pre('findOne', function() {
  this.populate('file', 'originalName size mimetype');
});

module.exports = mongoose.model('Share', shareSchema);