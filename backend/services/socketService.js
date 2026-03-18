const Message = require('../models/Message');
const User = require('../models/User');

// Store online users and room tracking
const onlineUsers = new Map();
const userRooms = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔗 User connected:', socket.id);

    // User joins the chat
    socket.on('user_join', async (userData) => {
      try {
        const { userId, userName, userRole } = userData;
        
        if (!userId) {
          console.error('❌ Missing userId in user_join');
          return;
        }

        // Store user socket connection
        onlineUsers.set(userId, {
          socketId: socket.id,
          userId,
          userName: userName || `User-${userId}`,
          userRole: userRole || 'user',
          joinedAt: new Date()
        });

        socket.userId = userId;
        
        // Join user to their personal room
        socket.join(`user_${userId}`);
        
        console.log(`👤 User ${userName || userId} (${userId}) joined chat`);
        
        // Broadcast updated online users list
        const usersArray = Array.from(onlineUsers.values());
        io.emit('online_users_update', { onlineUsers: usersArray });
      } catch (error) {
        console.error('Error in user_join:', error);
      }
    });

    // ==================== WEBRTC SOCKET EVENTS ====================

    // WebRTC room joining
    socket.on('join-room', (roomId, userId) => {
      try {
        console.log(`🎥 User ${userId} joining room: ${roomId}`);
        
        // Leave previous room if any
        const previousRoom = userRooms.get(socket.id);
        if (previousRoom && previousRoom !== roomId) {
          socket.leave(previousRoom);
          socket.to(previousRoom).emit('user-disconnected', {
            userId: userId,
            socketId: socket.id
          });
          console.log(`⬅️ User ${userId} left previous room: ${previousRoom}`);
        }

        // Join new room
        socket.join(roomId);
        userRooms.set(socket.id, roomId);
        
        // Get current room members
        const room = io.sockets.adapter.rooms.get(roomId);
        const roomUsers = room ? Array.from(room).filter(id => id !== socket.id) : [];
        
        console.log(`📊 Room ${roomId} has ${roomUsers.length} other users`);
        
        // Notify the new user about existing users
        socket.emit('users-in-room', roomUsers);
        
        // Notify other users about the new user
        if (roomUsers.length > 0) {
          socket.to(roomId).emit('user-connected', {
            userId: userId,
            socketId: socket.id
          });
        }

      } catch (error) {
        console.error('Error in join-room:', error);
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      try {
        const { offer, sender, roomId, target } = data;
        
        if (!roomId || !offer) {
          console.error('❌ Missing roomId or offer in offer event');
          return;
        }

        console.log(`📤 Forwarding offer to room: ${roomId} from ${sender}`);
        
        // Forward to all other users in the room
        socket.to(roomId).emit('offer', {
          offer: offer,
          sender: sender,
          roomId: roomId
        });

      } catch (error) {
        console.error('Error in offer event:', error);
      }
    });

    socket.on('answer', (data) => {
      try {
        const { answer, sender, roomId } = data;
        
        if (!roomId || !answer) {
          console.error('❌ Missing roomId or answer in answer event');
          return;
        }

        console.log(`📥 Forwarding answer to room: ${roomId} from ${sender}`);
        
        // Forward to all other users in the room
        socket.to(roomId).emit('answer', {
          answer: answer,
          sender: sender,
          roomId: roomId
        });

      } catch (error) {
        console.error('Error in answer event:', error);
      }
    });

    socket.on('ice-candidate', (data) => {
      try {
        const { candidate, sender, roomId } = data;
        
        if (!roomId || !candidate) {
          console.error('❌ Missing roomId or candidate in ice-candidate event');
          return;
        }

        console.log(`🧊 Forwarding ICE candidate to room: ${roomId} from ${sender}`);
        
        // Forward to all other users in the room
        socket.to(roomId).emit('ice-candidate', {
          candidate: candidate,
          sender: sender,
          roomId: roomId
        });

      } catch (error) {
        console.error('Error in ice-candidate event:', error);
      }
    });

    // Leave WebRTC room
    socket.on('leave-room', (roomId) => {
      try {
        console.log(`🎥 User leaving room: ${roomId}`);
        socket.leave(roomId);
        userRooms.delete(socket.id);
        socket.to(roomId).emit('user-disconnected', {
          userId: socket.userId,
          socketId: socket.id
        });
      } catch (error) {
        console.error('Error in leave-room:', error);
      }
    });

    // Get conversation (existing code)
    socket.on('get_conversation', async (data) => {
      try {
        const { otherUserId, limit = 50 } = data;
        
        if (!socket.userId || !otherUserId) {
          socket.emit('error', { message: 'User ID and other user ID are required' });
          return;
        }

        const messages = await Message.find({
          $or: [
            { senderId: socket.userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: socket.userId }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('senderId', 'name email role')
        .populate('receiverId', 'name email role');

        const sortedMessages = messages.reverse();

        socket.emit('conversation_data', {
          messages: sortedMessages,
          otherUserId
        });
      } catch (error) {
        console.error('Error in get_conversation:', error);
        socket.emit('error', { message: 'Failed to load conversation' });
      }
    });

    // Send message (existing code)
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        
        if (!socket.userId || !receiverId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        const message = new Message({
          senderId: socket.userId,
          receiverId,
          content: content.trim()
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name email role')
          .populate('receiverId', 'name email role');

        const messageData = {
          _id: populatedMessage._id,
          senderId: populatedMessage.senderId._id,
          senderName: populatedMessage.senderId.name,
          receiverId: populatedMessage.receiverId._id,
          receiverName: populatedMessage.receiverId.name,
          content: populatedMessage.content,
          createdAt: populatedMessage.createdAt,
          isRead: populatedMessage.isRead
        };

        socket.emit('message_sent', { message: messageData });

        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('receive_message', {
            message: messageData
          });
        }

        console.log(`📨 Message sent from ${messageData.senderName} to ${messageData.receiverName}`);
      } catch (error) {
        console.error('Error in send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators (existing code)
    socket.on('typing_start', (data) => {
      try {
        const { receiverId } = data;
        const senderUser = onlineUsers.get(socket.userId);
        
        if (senderUser && receiverId) {
          const receiverSocket = onlineUsers.get(receiverId);
          if (receiverSocket) {
            io.to(receiverSocket.socketId).emit('user_typing', {
              senderId: socket.userId,
              senderName: senderUser.userName
            });
          }
        }
      } catch (error) {
        console.error('Error in typing_start:', error);
      }
    });

    socket.on('typing_stop', (data) => {
      try {
        const { receiverId } = data;
        
        if (receiverId) {
          const receiverSocket = onlineUsers.get(receiverId);
          if (receiverSocket) {
            io.to(receiverSocket.socketId).emit('user_stop_typing', {
              senderId: socket.userId
            });
          }
        }
      } catch (error) {
        console.error('Error in typing_stop:', error);
      }
    });

    // Mark messages as read (existing code)
    socket.on('mark_messages_read', async (data) => {
      try {
        const { senderId } = data;
        
        if (!socket.userId || !senderId) return;

        await Message.updateMany(
          {
            senderId: senderId,
            receiverId: socket.userId,
            isRead: false
          },
          {
            $set: {
              isRead: true,
              readAt: new Date()
            }
          }
        );

        const senderSocket = onlineUsers.get(senderId);
        if (senderSocket) {
          const readerUser = onlineUsers.get(socket.userId);
          io.to(senderSocket.socketId).emit('messages_read', {
            readerId: socket.userId,
            readerName: readerUser ? readerUser.userName : 'Unknown'
          });
        }
      } catch (error) {
        console.error('Error in mark_messages_read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        // Leave all WebRTC rooms
        if (userRooms.has(socket.id)) {
          const roomId = userRooms.get(socket.id);
          socket.to(roomId).emit('user-disconnected', {
            userId: socket.userId,
            socketId: socket.id
          });
          userRooms.delete(socket.id);
        }

        // Remove from online users
        if (socket.userId) {
          onlineUsers.delete(socket.userId);
          const usersArray = Array.from(onlineUsers.values());
          io.emit('online_users_update', { onlineUsers: usersArray });
          console.log(`👋 User ${socket.userId} disconnected`);
        }
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
  });
};

module.exports = { initializeSocket };