const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  enrolledCourses: {
    type: [String],
    default: []
  },
  progress: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

const createCustomerModel = (connection) => connection.model('Customer', customerSchema);

module.exports = createCustomerModel;
