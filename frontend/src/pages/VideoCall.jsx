import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const hasInitialized = useRef(false);
  const pendingCandidates = useRef([]);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Initializing...');
  const [participants, setParticipants] = useState(1);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeCall = async () => {
      try {
        setCallStatus('Accessing camera and microphone...');
        
        // Get user media first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        console.log('✅ Local stream obtained');
        
        // Initialize socket
        socketRef.current = io('http://localhost:5001', {
          transports: ['websocket'],
          reconnection: true
        });
        
        setCallStatus('Connecting to room...');
        
        socketRef.current.on('connect', () => {
          console.log('✅ Socket connected:', socketRef.current.id);
          // Join the room
          socketRef.current.emit('join-room', roomId, socketRef.current.id);
        });

        // When we receive info about existing users
        socketRef.current.on('users-in-room', async (existingUsers) => {
          console.log('📋 Existing users in room:', existingUsers);
          
          if (existingUsers.length > 0) {
            setCallStatus('Other user found - Creating connection...');
            setParticipants(existingUsers.length + 1);
            
            // We're the joiner, so we create the peer connection and offer
            await createPeerConnection(true);
          } else {
            setCallStatus('Waiting for others to join...');
          }
        });
        
        // When a new user connects
        socketRef.current.on('user-connected', async (data) => {
          console.log('👤 User connected:', data);
          setCallStatus('User joined - Establishing connection...');
          setParticipants(prev => prev + 1);
          
          // We're already here, so we wait for their offer
          if (!peerConnectionRef.current) {
            await createPeerConnection(false);
          }
        });
        
        // When we receive an offer
        socketRef.current.on('offer', async (data) => {
          console.log('📨 Received offer from:', data.sender);
          if (data.sender === socketRef.current.id) return;
          
          await handleOffer(data.offer, data.sender);
        });
        
        // When we receive an answer
        socketRef.current.on('answer', async (data) => {
          console.log('📨 Received answer from:', data.sender);
          if (data.sender === socketRef.current.id) return;
          
          await handleAnswer(data.answer);
        });
        
        // When we receive ICE candidates
        socketRef.current.on('ice-candidate', async (data) => {
          console.log('🧊 Received ICE candidate from:', data.sender);
          if (data.sender === socketRef.current.id) return;
          
          await handleIceCandidate(data.candidate);
        });
        
        // When a user disconnects
        socketRef.current.on('user-disconnected', () => {
          console.log('👋 User disconnected');
          setCallStatus('User left the call');
          setParticipants(1);
          setHasRemoteStream(false);
          
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          pendingCandidates.current = [];
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          setCallStatus('Connection failed');
        });

      } catch (error) {
        console.error('❌ Error initializing call:', error);
        setCallStatus(`Error: ${error.message}`);
        
        if (error.name === 'NotAllowedError') {
          alert('Camera/microphone access denied. Please allow permissions.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera/microphone found.');
        }
      }
    };

    const createPeerConnection = async (shouldCreateOffer) => {
      try {
        console.log('🔧 Creating peer connection, shouldCreateOffer:', shouldCreateOffer);
        
        // Close existing connection if any
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;
        
        // Add local stream tracks
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
        
        // Handle incoming tracks
        pc.ontrack = (event) => {
          console.log('✅ Received remote track:', event.track.kind);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setHasRemoteStream(true);
            setCallStatus('Connected!');
          }
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('🧊 Sending ICE candidate');
            socketRef.current.emit('ice-candidate', {
              roomId: roomId,
              candidate: event.candidate,
              sender: socketRef.current.id
            });
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log('🔄 Connection state:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setCallStatus('Connected!');
          } else if (pc.connectionState === 'disconnected') {
            setCallStatus('Connection lost');
          } else if (pc.connectionState === 'failed') {
            setCallStatus('Connection failed');
            pc.close();
            peerConnectionRef.current = null;
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        // If we should create the offer, do it
        if (shouldCreateOffer) {
          console.log('📤 Creating offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          socketRef.current.emit('offer', {
            roomId: roomId,
            offer: offer,
            sender: socketRef.current.id
          });
          
          console.log('✅ Offer created and sent');
        }
        
      } catch (error) {
        console.error('❌ Error creating peer connection:', error);
        setCallStatus('Failed to establish connection');
      }
    };
    
    const handleOffer = async (offer, senderId) => {
      try {
        console.log('📥 Handling offer from:', senderId);
        
        // Create peer connection if not exists
        if (!peerConnectionRef.current) {
          await createPeerConnection(false);
        }

        const pc = peerConnectionRef.current;
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('✅ Remote description set');
        
        // Process any pending candidates
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          await pc.addIceCandidate(candidate);
        }
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socketRef.current.emit('answer', {
          roomId: roomId,
          answer: answer,
          sender: socketRef.current.id
        });
        
        console.log('✅ Answer created and sent');
        
      } catch (error) {
        console.error('❌ Error handling offer:', error);
      }
    };
    
    const handleAnswer = async (answer) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        console.log('📥 Setting remote answer');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process any pending candidates
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          await pc.addIceCandidate(candidate);
        }
        
        console.log('✅ Remote answer set');
        
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    };
    
    const handleIceCandidate = async (candidate) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added');
        } else {
          // Queue candidates until remote description is set
          pendingCandidates.current.push(new RTCIceCandidate(candidate));
          console.log('📦 ICE candidate queued');
        }
        
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    };

    initializeCall();

    return () => {
      console.log('🧹 Cleaning up...');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
      socketRef.current.disconnect();
    }
    
    setTimeout(() => {
      window.close() || navigate('/');
    }, 500);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Call link copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Video Call</h1>
          <p className="text-sm text-gray-300">Room: {roomId?.substring(0, 8)}...</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{callStatus}</p>
          <p className="text-xs text-gray-400">Participants: {participants}</p>
        </div>
        <div className="text-sm">
          {hasRemoteStream ? '🟢 Connected' : '⚪ Waiting'}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800">
        {/* Local Video */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            Remote User
          </div>
          
          {!hasRemoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium">Waiting for participant...</p>
                <p className="text-sm text-gray-400 mt-2">{callStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
          } text-white transition-colors shadow-lg`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className="text-2xl">{isMuted ? '🔇' : '🎤'}</span>
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
          } text-white transition-colors shadow-lg`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          <span className="text-2xl">{isVideoOff ? '📹' : '🎥'}</span>
        </button>
        
        <button
          onClick={copyLink}
          className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg"
          title="Copy call link"
        >
          <span className="text-2xl">🔗</span>
        </button>
        
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg"
          title="End call"
        >
          <span className="text-2xl">📞</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;