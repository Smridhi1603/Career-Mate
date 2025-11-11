const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

const createCertificateModel = (connection) => connection.model('Certificate', certificateSchema);

module.exports = createCertificateModel;
