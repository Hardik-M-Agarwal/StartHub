const express = require('express');
const router = express.Router();
const {
  getConversation,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount
} = require('../controllers/chatController');

// Get conversation between two users
router.get('/conversation/:userId/:otherUserId', getConversation);

// Send a message
router.post('/send', sendMessage);

// Mark messages as read
router.post('/read', markMessagesAsRead);

// Get unread message count for a user
router.get('/unread/:userId', getUnreadCount);

module.exports = router;