const mongoose = require('mongoose');

const connectDatabases = () => {
  const userDbUri = process.env.MONGODB_URI_USERS || 'mongodb://127.0.0.1:27017/careermate_users';
  const customerDbUri = process.env.MONGODB_URI_CUSTOMERS || 'mongodb://127.0.0.1:27017/careermate_customers';

  const userConnection = mongoose.createConnection(userDbUri);
  const customerConnection = mongoose.createConnection(customerDbUri);

  userConnection.on('error', (err) => console.error('User DB Error:', err.message));
  userConnection.on('connected', () => console.log(' User DB Connected'));
  userConnection.on('disconnected', () => console.log(' User DB Disconnected'));

  customerConnection.on('error', (err) => console.error('Customer DB Error:', err.message));
  customerConnection.on('connected', () => console.log(' Customer DB Connected'));
  customerConnection.on('disconnected', () => console.log(' Customer DB Disconnected'));

  return { userConnection, customerConnection };
};

module.exports = connectDatabases;
