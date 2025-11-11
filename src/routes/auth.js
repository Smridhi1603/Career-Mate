const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (User, Customer) => {
  const ensureCustomer = async (user) => {
    if (!user) return null;
    let customer = await Customer.findOne({ userId: user._id });
    if (!customer) {
      customer = await Customer.create({
        userId: user._id,
        username: user.username,
        email: user.email,
        enrolledCourses: []
      });
    }
    return customer;
  };

  router.post('/signup', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        username,
        email,
        password: await bcrypt.hash(password, 10)
      });

      await ensureCustomer(user);
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.avatarUrl = user.avatarUrl || '';

      res.json({ message: 'Signup successful', user: { username, email } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      await ensureCustomer(user);
      req.session.userId = user._id;
      req.session.username = user.username;

      res.json({ message: 'Login successful', user: { username: user.username, email } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });

  router.get('/me', async (req, res) => {
    if (!req.session.userId) {
      return res.json({ loggedIn: false });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.json({ loggedIn: false });
      }

      res.json({
        loggedIn: true,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.json({ loggedIn: false });
    }
  });

  return router;
};
