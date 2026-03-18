import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { 
  Send, 
  Search, 
  MessageCircle, 
  MoreVertical,
  User,
  Home,
  Video,
  Phone
} from 'lucide-react';
import axios from 'axios';
import FundRequestForm from '../components/FundRequestForm';
import FundRequestMessage from '../components/FundRequestMessage';

const Chat = () => {
  const { startup_id, investor_id, admin_id } = useParams();
  const navigate = useNavigate();
  const { socket, onlineUsers, isConnected } = useSocket();
  
  // Hardcoded API URL
  const API_URL = 'http://localhost:5001/api';
  
  const currentUser = React.useMemo(() => {
    if (startup_id) return { id: startup_id, role: 'startup', name: `Startup ${startup_id}` };
    if (investor_id) return { id: investor_id, role: 'investor', name: `Investor ${investor_id}` };
    if (admin_id) return { id: admin_id, role: 'admin', name: `Admin ${admin_id}` };
    return null;
  }, [startup_id, investor_id, admin_id]);
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [callStatus, setCallStatus] = useState('');
  const [activeCalls, setActiveCalls] = useState({});
  const [showFundRequestForm, setShowFundRequestForm] = useState(false);
  const [fundRequests, setFundRequests] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentUser && socket && isConnected) {
      console.log('👤 Joining chat as user:', currentUser);
      socket.emit('user_join', {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role
      });
    }
  }, [currentUser, socket, isConnected]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('🔄 Starting to fetch users...');
        setLoading(true);
        
        console.log('📡 Making API request to:', `${API_URL}/users/chat/users`);
        
        const response = await axios.get(`${API_URL}/users/chat/users`);
        
        console.log('✅ API Response received:', response.data);
        
        if (response.data.success) {
          const filteredUsers = response.data.data.users.filter(
            user => user.userId !== currentUser.id
          );
          console.log('📊 Filtered users data:', filteredUsers);
          setUsers(filteredUsers);
          
          // Initialize unread counts
          const initialUnreadCounts = {};
          filteredUsers.forEach(user => {
            initialUnreadCounts[user.userId] = 0;
          });
          setUnreadCounts(initialUnreadCounts);
        } else {
          console.error('❌ API returned error:', response.data.message);
          setUsers([]);
        }
      } catch (error) {
        console.error('💥 Error fetching users:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      console.log('👤 Current user detected, fetching users...', currentUser);
      fetchUsers();
    } else {
      console.log('❌ No user found in URL params');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket not available');
      return;
    }

    console.log('🔌 Setting up socket event listeners...');

    const handleReceiveMessage = (data) => {
      console.log('📨 Received new message:', data);
      
      // Check if message contains a video call link
      if (data.message.content && data.message.content.includes('/call/')) {
        // Extract room ID from the message
        const roomIdMatch = data.message.content.match(/\/call\/([a-zA-Z0-9-_]+)/);
        if (roomIdMatch) {
          const roomId = roomIdMatch[1];
          console.log('📹 Video call link detected in message, roomId:', roomId);
          
          // Store the room ID for easy access
          data.message.roomId = roomId;
        }
      }

      // Load fund request data if this is a fund request message
      if (data.message.messageType === 'fund_request' && data.message.fundRequestId) {
        console.log('💰 Fund request message received:', data.message.fundRequestId);
        // Fetch the full fund request details
        axios.get(`${API_URL}/fund-requests/${data.message.fundRequestId}`)
          .then(res => {
            if (res.data.success) {
              setFundRequests(prev => ({
                ...prev,
                [res.data.data._id]: res.data.data
              }));
              console.log('✅ Fund request loaded:', res.data.data._id);
            }
          })
          .catch(err => console.error('❌ Error loading fund request:', err));
      }
      
      if (selectedUser && (
        data.message.senderId === selectedUser.userId || 
        data.message.receiverId === selectedUser.userId
      )) {
        setMessages(prev => [...prev, data.message]);
        
        // Mark as read if it's from the selected user
        if (data.message.senderId === selectedUser.userId) {
          socket.emit('mark_messages_read', { senderId: selectedUser.userId });
        }
      } else {
        // Update unread count for this user
        if (data.message.senderId && data.message.senderId !== currentUser.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.message.senderId]: (prev[data.message.senderId] || 0) + 1
          }));
        }
      }
    };

    const handleMessageSent = (data) => {
      console.log('✅ Message sent confirmation:', data);
      setMessages(prev => [...prev, data.message]);
    };

    const handleConversationData = (data) => {
      console.log('💬 Conversation data received:', data);
      setMessages(data.messages || []);

      // Load all fund requests from the conversation
      if (data.messages) {
        data.messages.forEach(msg => {
          if (msg.messageType === 'fund_request' && msg.fundRequestId) {
            axios.get(`${API_URL}/fund-requests/${msg.fundRequestId}`)
              .then(res => {
                if (res.data.success) {
                  setFundRequests(prev => ({
                    ...prev,
                    [res.data.data._id]: res.data.data
                  }));
                }
              })
              .catch(err => console.error('❌ Error loading fund request:', err));
          }
        });
      }
    };

    const handleUserTyping = (data) => {
      console.log('⌨️ User typing:', data);
      if (selectedUser && data.senderId === selectedUser.userId) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.senderId === data.senderId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserStopTyping = (data) => {
      console.log('⏹️ User stopped typing:', data);
      setTypingUsers(prev => prev.filter(u => u.senderId !== data.senderId));
    };

    const handleMessagesRead = (data) => {
      console.log('📖 Messages read by:', data.readerName);
      // Reset unread count when messages are read
      if (data.readerId === currentUser.id && selectedUser) {
        setUnreadCounts(prev => ({
          ...prev,
          [selectedUser.userId]: 0
        }));
      }
    };

    const handleOnlineUsersUpdate = (data) => {
      console.log('🌐 Online users updated:', data.onlineUsers);
    };

    // Register event listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('conversation_data', handleConversationData);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('online_users_update', handleOnlineUsersUpdate);

    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('conversation_data', handleConversationData);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('online_users_update', handleOnlineUsersUpdate);
    };
  }, [socket, selectedUser, currentUser]);

  useEffect(() => {
    if (selectedUser && socket) {
      console.log('👥 Loading conversation with user:', selectedUser);
      socket.emit('get_conversation', {
        otherUserId: selectedUser.userId
      });
      
      // Mark messages as read when selecting a user
      socket.emit('mark_messages_read', { senderId: selectedUser.userId });
      
      // Reset unread count for this user
      setUnreadCounts(prev => ({
        ...prev,
        [selectedUser.userId]: 0
      }));
    }
  }, [selectedUser, socket, currentUser]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) {
      console.log('❌ Cannot send message - missing requirements');
      return;
    }

    console.log('📤 Sending message:', {
      to: selectedUser.name,
      content: newMessage.trim(),
      receiverId: selectedUser.userId
    });

    socket.emit('send_message', {
      receiverId: selectedUser.userId,
      content: newMessage.trim()
    });

    setNewMessage('');
    setIsTyping(false);
    
    if (socket) {
      socket.emit('typing_stop', { receiverId: selectedUser.userId });
    }
  }, [newMessage, selectedUser, socket]);

  const handleTyping = useCallback((e) => {
    setNewMessage(e.target.value);

    if (!selectedUser || !socket) return;

    if (!isTyping) {
      setIsTyping(true);
      console.log('⌨️ Starting typing indicator for:', selectedUser.name);
      socket.emit('typing_start', { receiverId: selectedUser.userId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      console.log('⏹️ Stopping typing indicator for:', selectedUser.name);
      socket.emit('typing_stop', { receiverId: selectedUser.userId });
    }, 1000);
  }, [selectedUser, socket, isTyping]);

  const handleUserSelect = useCallback((selectedUserData) => {
    console.log('🎯 User selected:', selectedUserData);
    setSelectedUser(selectedUserData);
    setMessages([]);
    setTypingUsers([]);
    
    if (socket) {
      console.log('📖 Marking messages as read for:', selectedUserData.name);
      socket.emit('mark_messages_read', { senderId: selectedUserData.userId });
    }
  }, [socket]);

  const updateCallStatus = useCallback((roomId, status) => {
    setActiveCalls(prev => ({
      ...prev,
      [roomId]: status
    }));
  }, []);

  const handleVideoCall = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      setCallStatus('Starting video call...');
      
      // Generate a unique room ID
      const roomId = `${currentUser.id}_${selectedUser.userId}_${Date.now()}`;
      
      // Open video call in new window
      const callUrl = `${window.location.origin}/call/${roomId}`;
      const callWindow = window.open(callUrl, '_blank', 'width=1200,height=800,scrollbars=no,resizable=yes');
      
      if (callWindow) {
        // Update call status to active
        updateCallStatus(roomId, 'active');
        setCallStatus('Video call started');
        setTimeout(() => setCallStatus(''), 3000);
        
        // Listen for window close to update status
        const checkWindowClosed = setInterval(() => {
          if (callWindow.closed) {
            clearInterval(checkWindowClosed);
            updateCallStatus(roomId, 'ended');
          }
        }, 1000);
        
        // Send a chat message about the call
        if (socket) {
          socket.emit('send_message', {
            receiverId: selectedUser.userId,
            content: `📹 I started a video call. Click here to join: ${callUrl}`
          });
        }
      } else {
        setCallStatus('Failed to open call window - check popup blocker');
        setTimeout(() => setCallStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      setCallStatus('Error starting call');
      setTimeout(() => setCallStatus(''), 3000);
    }
  }, [selectedUser, currentUser, socket, updateCallStatus]);

  const handleJoinVideoCall = useCallback((roomId) => {
    if (!roomId) return;
    
    try {
      setCallStatus('Joining video call...');
      const callUrl = `${window.location.origin}/call/${roomId}`;
      const callWindow = window.open(callUrl, '_blank', 'width=1200,height=800,scrollbars=no,resizable=yes');
      
      if (callWindow) {
        // Update call status to active
        updateCallStatus(roomId, 'active');
        setCallStatus('Joining call...');
        setTimeout(() => setCallStatus(''), 3000);
        
        // Listen for window close to update status
        const checkWindowClosed = setInterval(() => {
          if (callWindow.closed) {
            clearInterval(checkWindowClosed);
            updateCallStatus(roomId, 'ended');
          }
        }, 1000);
      } else {
        setCallStatus('Failed to open call window');
        setTimeout(() => setCallStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error joining video call:', error);
      setCallStatus('Error joining call');
      setTimeout(() => setCallStatus(''), 3000);
    }
  }, [updateCallStatus]);

  const handleVoiceCall = useCallback(() => {
    if (!selectedUser) return;
    
    setCallStatus('Voice calls not implemented yet');
    setTimeout(() => setCallStatus(''), 3000);
    
    // Send a message about voice call (placeholder)
    if (socket) {
      socket.emit('send_message', {
        receiverId: selectedUser.userId,
        content: `📞 I tried to start a voice call (feature coming soon)`
      });
    }
  }, [selectedUser, socket]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleFundRequest = useCallback(() => {
    // Only startups can send fund requests
    if (currentUser.role !== 'startup') {
      alert('Only startups can send fund requests');
      return;
    }

    // Can only send to investors
    if (selectedUser && selectedUser.role !== 'investor') {
      alert('Fund requests can only be sent to investors');
      return;
    }

    if (!selectedUser) {
      alert('Please select an investor first');
      return;
    }
    setShowFundRequestForm(true);
  }, [selectedUser, currentUser]);

  const handleFundRequestSubmit = useCallback(async (requestData) => {
    if (!selectedUser || !currentUser) return;

    try {
      // Step 1: Create fund request in backend
      const fundRequestRes = await axios.post(`${API_URL}/fund-requests`, {
        startupId: currentUser.id,
        investorId: selectedUser.userId,
        currentUserId: currentUser.id,
        amount: requestData.amount,
        fundingType: requestData.fundingType,
        equityPercentage: requestData.equityPercentage || null,
        interestRate: requestData.interestRate || null,
        loanTenure: requestData.loanTenure || '',
        description: requestData.description,
        useOfFunds: requestData.useOfFunds,
        companyName: requestData.companyName,
        domain: requestData.domain,
        yearOfEstablishment: requestData.yearOfEstablishment,
        teamSize: requestData.teamSize,
        previousFunding: requestData.previousFunding || 0,
        fundingTimeline: requestData.fundingTimeline,
        milestone: requestData.milestone || ''
      });

      if (!fundRequestRes.data.success) {
        throw new Error(fundRequestRes.data.message || 'Failed to create fund request');
      }

      const fundRequest = fundRequestRes.data.data;
      console.log('✅ Step 1: Fund request created:', fundRequest._id);

      // Step 2: Send fund request as a message
      const messageRes = await axios.post(`${API_URL}/fund-requests/message/send`, {
        fundRequestId: fundRequest._id,
        senderId: currentUser.id,
        receiverId: selectedUser.userId
      });

      if (!messageRes.data.success) {
        throw new Error(messageRes.data.message || 'Failed to send fund request message');
      }

      console.log('✅ Step 2: Fund request message sent:', messageRes.data.data.message._id);

      // Store fund request for reference
      setFundRequests(prev => ({
        ...prev,
        [fundRequest._id]: fundRequest
      }));

      // Step 3: Send message via socket (non-blocking)
      if (socket) {
        socket.emit('send_message', {
          receiverId: selectedUser.userId,
          content: `Fund Request: ${requestData.fundingType.toUpperCase()} | Amount: ₹${requestData.amount.toLocaleString('en-IN')} for ${requestData.companyName}`,
          messageType: 'fund_request',
          fundRequestId: fundRequest._id
        });
        console.log('✅ Step 3: Socket message emitted');
      }

      // Clear form and close modal only on success
      setShowFundRequestForm(false);
      console.log('✅ Fund request sent successfully:', fundRequest._id);
      
      // Show success message
      alert('Fund request sent successfully!');
    } catch (error) {
      // Re-throw error for FundRequestForm to catch and display
      console.error('❌ Error sending fund request:', error?.response?.data?.message || error?.message || error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to send fund request');
    }
  }, [selectedUser, currentUser, socket, API_URL]);

  const handleApproveFundRequest = useCallback(async (fundRequestId) => {
    // Only investors can approve
    if (currentUser.role !== 'investor') {
      alert('Only investors can approve fund requests');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/fund-requests/${fundRequestId}/approve`,
        { currentUserId: currentUser.id }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to approve fund request');
      }

      // Update fund request in state
      setFundRequests(prev => ({
        ...prev,
        [fundRequestId]: response.data.data
      }));

      // Notify startup via socket
      if (socket && selectedUser) {
        socket.emit('send_message', {
          receiverId: selectedUser.userId,
          content: `✅ Your fund request has been APPROVED! You can now proceed to payment.`,
          messageType: 'text'
        });
      }

      alert('Fund request approved successfully!');
      console.log('✅ Fund request approved:', fundRequestId);
    } catch (error) {
      console.error('❌ Error approving fund request:', error?.response?.data?.message || error?.message || error);
      alert(error?.response?.data?.message || error?.message || 'Failed to approve fund request');
    }
  }, [API_URL, socket, selectedUser, currentUser]);

  const handleRejectFundRequest = useCallback(async (fundRequestId, reason) => {
    // Only investors can reject
    if (currentUser.role !== 'investor') {
      alert('Only investors can reject fund requests');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/fund-requests/${fundRequestId}/reject`,
        { rejectionReason: reason, currentUserId: currentUser.id }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reject fund request');
      }

      // Update fund request in state
      setFundRequests(prev => ({
        ...prev,
        [fundRequestId]: response.data.data
      }));

      // Notify startup via socket
      if (socket && selectedUser) {
        socket.emit('send_message', {
          receiverId: selectedUser.userId,
          content: `❌ Your fund request has been REJECTED. Reason: ${reason || 'No reason provided'}`,
          messageType: 'text'
        });
      }

      alert('Fund request rejected successfully!');
      console.log('✅ Fund request rejected:', fundRequestId);
    } catch (error) {
      console.error('❌ Error rejecting fund request:', error?.response?.data?.message || error?.message || error);
      alert(error?.response?.data?.message || error?.message || 'Failed to reject fund request');
    }
  }, [API_URL, socket, selectedUser, currentUser]);

  const handleFundRequestPayment = useCallback(async (fundRequest) => {
    // Only investors can process payment
    if (currentUser.role !== 'investor') {
      alert('Only investors can process fund transfers');
      return;
    }

    if (processingPayment) return;
    setProcessingPayment(true);

    try {
      // Step 1: Create Razorpay order
      // Generate a short receipt (max 40 chars for Razorpay)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const shortId = fundRequest._id.toString().slice(-8); // Last 8 chars of ID
      const receipt = `fund_${shortId}_${timestamp}`.slice(0, 40); // Ensure max 40 chars
      
      const orderRes = await axios.post(`${API_URL}/payments/order`, {
        amount: fundRequest.amount * 100, // Convert to paise
        currency: 'INR',
        receipt: receipt
      });

      if (!orderRes.data.success && !orderRes.data.id) {
        throw new Error('Failed to create payment order');
      }

      const order = orderRes.data.data ? orderRes.data.data : orderRes.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: 'rzp_test_WwmlF1M46ivOUV', // Replace with env variable
        amount: order.amount,
        currency: order.currency,
        name: 'Fund Transfer',
        description: `Investor Funding: ${fundRequest.fundingType.toUpperCase()} - ₹${fundRequest.amount}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Step 3: Validate payment
            const validateRes = await axios.post(
              `${API_URL}/fund-requests/${fundRequest._id}/payment`,
              {
                fundRequestId: fundRequest._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                currentUserId: currentUser.id
              }
            );

            if (validateRes.data.success) {
              // Update fund request in state
              setFundRequests(prev => ({
                ...prev,
                [fundRequest._id]: validateRes.data.data
              }));

              // Notify startup via socket
              if (socket && selectedUser) {
                socket.emit('send_message', {
                  receiverId: selectedUser.userId,
                  content: `💰 PAYMENT SUCCESSFUL! Fund transfer completed.\n📋 Details:\n• Type: ${fundRequest.fundingType.toUpperCase()}\n• Amount: ₹${fundRequest.amount.toLocaleString('en-IN')}\n• Payment ID: ${response.razorpay_payment_id}\n• Status: APPROVED & FUNDED`,
                  messageType: 'text'
                });
              }

              alert('✅ Payment successful! Fund request completed.');
              console.log('✅ Fund request payment completed:', fundRequest._id);
            } else {
              throw new Error('Payment validation failed');
            }
          } catch (error) {
            console.error('❌ Payment validation error:', error?.response?.data?.message || error?.message || error);
            alert(error?.response?.data?.message || '❌ Payment validation failed. Please contact support.');
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('❌ Payment failed. Please try again.');
      });
      rzp.open();
    } catch (error) {
      console.error('❌ Error initiating payment:', error?.response?.data?.message || error?.message || error);
      alert(error?.response?.data?.message || error?.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  }, [API_URL, socket, selectedUser, currentUser, processingPayment]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUserOnline = useCallback((userId) => {
    const isOnline = onlineUsers.some(onlineUser => 
      onlineUser.userId === userId || onlineUser.userId?.toString() === userId
    );
    return isOnline;
  }, [onlineUsers]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  }, []);

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return '';
    }
  }, []);

  const getRoleColor = useCallback((role) => {
    const colors = {
      investor: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-red-100 text-red-800 border-red-200',
      startup: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getRoleBadge = useCallback((role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  }, []);

  const isOwnMessage = useCallback((message) => {
    const currentUserId = currentUser?.id;
    return message.senderId === currentUserId || 
           message.senderId?._id === currentUserId ||
           message.senderId?._id?.toString() === currentUserId;
  }, [currentUser]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((message, index) => {
      const messageDate = formatDate(message.createdAt);
      
      if (messageDate !== currentDate) {
        groups.push({
          type: 'date',
          content: messageDate,
          key: `date-${messageDate}`
        });
        currentDate = messageDate;
      }
      
      groups.push({
        type: 'message',
        content: message,
        key: message._id || `msg-${index}`
      });
    });
    
    return groups;
  }, [messages, formatDate]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid User</h3>
          <p className="text-gray-500 mb-4">Please navigate through the proper chat routes</p>
          <button
            onClick={handleGoHome}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Call Status Banner */}
      {callStatus && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {callStatus}
        </div>
      )}
      
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold">{currentUser.name}</h2>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs opacity-75">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleGoHome}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Go Home"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No users found</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredUsers.map((userItem) => (
              <div
                key={userItem.userId}
                onClick={() => handleUserSelect(userItem)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                  selectedUser?.userId === userItem.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    {isUserOnline(userItem.userId) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {userItem.name}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor(userItem.role)}`}>
                        {getRoleBadge(userItem.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{userItem.email}</p>
                    {userItem.domain && (
                      <p className="text-xs text-gray-400 mt-1">Domain: {userItem.domain}</p>
                    )}
                  </div>
                </div>
                
                {/* Unread message indicator */}
                {unreadCounts[userItem.userId] > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {unreadCounts[userItem.userId]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    {isUserOnline(selectedUser.userId) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedUser.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor(selectedUser.role)}`}>
                        {getRoleBadge(selectedUser.role)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {isUserOnline(selectedUser.userId) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleVoiceCall}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                    title="Voice Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleVideoCall}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {groupedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map((item) => {
                  if (item.type === 'date') {
                    return (
                      <div key={item.key} className="flex justify-center">
                        <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {item.content}
                        </div>
                      </div>
                    );
                  }
                  
                  const message = item.content;
                  const ownMessage = isOwnMessage(message);

                  // Handle fund request messages
                  if (message.messageType === 'fund_request' && message.fundRequestId) {
                    const fundRequest = fundRequests[message.fundRequestId];
                    if (fundRequest) {
                      return (
                        <div key={item.key} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-xs lg:max-w-md">
                            <FundRequestMessage
                              fundRequest={fundRequest}
                              currentUser={currentUser}
                              onApprove={handleApproveFundRequest}
                              onReject={handleRejectFundRequest}
                              onPayment={handleFundRequestPayment}
                            />
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  // Check if message contains video call link
                  const hasVideoCall = message.content && message.content.includes('/call/');
                  const roomIdMatch = message.content.match(/\/call\/([a-zA-Z0-9-_]+)/);
                  const roomId = roomIdMatch ? roomIdMatch[1] : null;
                  
                  return (
                    <div
                      key={item.key}
                      className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          ownMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <div className="flex flex-col">
                          <p className="text-sm">{message.content}</p>
                          {hasVideoCall && roomId && !ownMessage && (
                            <button
                              onClick={() => handleJoinVideoCall(roomId)}
                              className={`mt-2 px-3 py-1 rounded-lg text-sm flex items-center justify-center space-x-1 transition-colors ${
                                activeCalls[roomId] === 'ended' 
                                  ? 'bg-gray-500 text-white cursor-not-allowed' 
                                  : activeCalls[roomId] === 'active'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              disabled={activeCalls[roomId] === 'ended'}
                            >
                              <Video className="w-4 h-4" />
                              <span>
                                {activeCalls[roomId] === 'ended' 
                                  ? 'Call Ended' 
                                  : activeCalls[roomId] === 'active'
                                  ? 'Join Active Call'
                                  : 'Join Video Call'
                                }
                              </span>
                            </button>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${
                          ownMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-2xl rounded-bl-none">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm ml-2">
                        {typingUsers.map(u => u.senderName).join(', ')} 
                        {typingUsers.length === 1 ? ' is' : ' are'} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={!selectedUser}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !selectedUser}
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleFundRequest}
                  disabled={!selectedUser || currentUser.role !== 'startup'}
                  className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title={currentUser.role !== 'startup' ? 'Only startups can send fund requests' : 'Send fund request'}
                >
                  💰
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Chat</h3>
              <p className="text-gray-500 max-w-md">
                Select a user from the sidebar to start chatting. 
                You can video call, voice call, or send messages to other users.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <div className="text-center">
                  <Video className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Video Call</p>
                </div>
                <div className="text-center">
                  <Phone className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Voice Call</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chat</p>
                </div>
              </div>
              {loading && (
                <p className="text-sm text-blue-500 mt-4">Loading users from database...</p>
              )}
              {!isConnected && (
                <p className="text-sm text-red-500 mt-4">Connecting to chat server...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fund Request Form Modal */}
      {showFundRequestForm && (
        <FundRequestForm
          onSubmit={handleFundRequestSubmit}
          onClose={() => setShowFundRequestForm(false)}
          selectedUser={selectedUser}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Chat;