const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

const createReviewModel = (connection) => connection.model('Review', reviewSchema);

module.exports = createReviewModel;
