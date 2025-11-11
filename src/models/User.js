const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

const createUserModel = (connection) => connection.model('User', userSchema);

module.exports = createUserModel;
