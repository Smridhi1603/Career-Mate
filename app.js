require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');   // <-- add this line
const path = require('path');
const connectDatabases = require('./config/database');
const createUserModel = require('./src/models/User');
const createCustomerModel = require('./src/models/Customer');
const createReviewModel = require('./src/models/Review');
const createCertificateModel = require('./src/models/Certificate');

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Use MongoDB-backed session store instead of MemoryStore
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-mate-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI_USERS, // can be any of your Mongo URIs
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Database connections
const { userConnection, customerConnection } = connectDatabases();

const User = createUserModel(userConnection);
const Customer = createCustomerModel(customerConnection);
const Review = createReviewModel(customerConnection);
const Certificate = createCertificateModel(customerConnection);

// Routes
const authRoutes = require('./src/routes/auth')(User, Customer);
const profileRoutes = require('./src/routes/profile')(User, Customer);
const coursesRoutes = require('./src/routes/courses')(Customer, Review, Certificate);
const aiRoutes = require('./src/routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/progress', coursesRoutes);
app.use('/api/reviews', coursesRoutes);
app.use('/api/quiz', coursesRoutes);
app.use('/api/certificates', coursesRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CareerMate Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
