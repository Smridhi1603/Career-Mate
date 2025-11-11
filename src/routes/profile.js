const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

module.exports = (User, Customer) => {
  const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
  
  try {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating avatar directory:', err);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
      const ext = (file.mimetype && file.mimetype.split('/')[1]) || 'png';
      cb(null, `${req.session.userId || 'anon'}_${Date.now()}.${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (!/image\/(png|jpeg|jpg|gif|webp)/.test(file.mimetype || '')) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
  });

  router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await User.findByIdAndUpdate(req.session.userId, { avatarUrl }, { new: true });

      req.session.avatarUrl = avatarUrl;
      res.json({ avatarUrl });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  router.post('/update-email', requireAuth, async (req, res) => {
    try {
      const { newEmail, password } = req.body;
      
      if (!newEmail || !password) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      const existing = await User.findOne({ email: newEmail });
      if (existing && existing._id.toString() !== req.session.userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      user.email = newEmail;
      await user.save();
      await Customer.updateOne({ userId: req.session.userId }, { email: newEmail });

      res.json({ message: 'Email updated successfully' });
    } catch (error) {
      console.error('Email update error:', error);
      res.status(500).json({ message: 'Update failed' });
    }
  });

  router.post('/update-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ message: 'Update failed' });
    }
  });

  return router;
};
