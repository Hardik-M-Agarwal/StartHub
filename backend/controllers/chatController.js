const Message = require('../models/Message');
const User = require('../models/User');

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('senderId', 'name email role')
    .populate('receiverId', 'name email role');

    // Reverse to show oldest first
    const sortedMessages = messages.reverse();

    res.json({
      success: true,
      data: {
        messages: sortedMessages,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID, receiver ID, and content are required'
      });
    }

    const message = new Message({
      senderId,
      receiverId,
      content: content.trim()
    });

    await message.save();

    // Populate the message with user details
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role');

    res.json({
      success: true,
      data: {
        message: populatedMessage
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount
};