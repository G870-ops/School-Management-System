import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { getSocketUrl } from '../config/apiConfig';
import axiosInstance from '../api/axiosInstance';
import { Send, MessageSquare, Radio, RefreshCw, AlertCircle, Cloud } from 'lucide-react';

let socketInstance = null;
const getSocket = () => {
  const targetUrl = getSocketUrl();
  if (!socketInstance || socketInstance.io?.uri !== targetUrl) {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    socketInstance = io(targetUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      timeout: 8000,
    });
  }
  return socketInstance;
};

const CHANNELS = [
  { id: 'school-wide-broadcast', name: '📢 School-Wide Broadcast', desc: 'Official general notices and alerts', roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'admin-teacher-chat', name: '👔 Admin to Teacher Lounge', desc: 'Faculty coordination and announcements', roles: ['admin', 'teacher'] },
  { id: 'teacher-student-chat', name: '📚 Teacher to Student Desk', desc: 'Academic discussions, homework queries', roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'parent-communication', name: '👨‍👩‍👧 Parent Communication', desc: 'Parent inquiries and school updates', roles: ['admin', 'teacher', 'parent'] },
];

const ChatRoom = ({ defaultRoomId = 'school-wide-broadcast', roomId }) => {
  const initialRoom = roomId || defaultRoomId;
  const { user } = useContext(AuthContext);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef(null);

  const visibleChannels = CHANNELS.filter((channel) => channel.roles.includes(user?.role));
  const currentRoom = visibleChannels.some((channel) => channel.id === selectedRoom)
    ? selectedRoom
    : visibleChannels[0]?.id || '';

  // 1. Socket.io Connection Management (Real-Time WebSocket)
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const socket = getSocket();

    if (!token) {
      socket.disconnect();
      setIsSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      setIsSocketConnected(true);
      setConnectionError('');
      setIsRetrying(false);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleConnectError = (err) => {
      setIsSocketConnected(false);
      setIsRetrying(false);
      // If error is an explicit auth issue, show it; otherwise silently fallback to Cloud Sync (HTTP REST)
      if (err?.message && err.message.toLowerCase().includes('auth')) {
        setConnectionError(err.message);
      } else {
        // Transparent fallback to HTTP cloud sync on serverless environments like Vercel
        setConnectionError('');
      }
    };

    socket.auth = { token };
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('connect_error', handleConnectError);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      setIsSocketConnected(true);
      setConnectionError('');
    } else {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    connectSocket();
  }, [connectSocket, user?._id]);

  // 2. Fetch Initial Messages and Set Up Cloud-Sync Polling Fallback
  useEffect(() => {
    if (!currentRoom) return undefined;
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        setIsCloudSyncing(true);
        const res = await axiosInstance.get(`/chat/messages/${encodeURIComponent(currentRoom)}`);
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
          setConnectionError('');
        }
      } catch (err) {
        if (isMounted && err.response?.status === 401) {
          setConnectionError('Session expired. Please sign in again.');
        }
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    };

    fetchHistory();

    // If WebSocket is not connected (e.g., serverless Vercel cloud deployment), sync via HTTP polling every 3.5s
    let syncInterval = null;
    if (!isSocketConnected) {
      syncInterval = setInterval(async () => {
        try {
          const res = await axiosInstance.get(`/chat/messages/${encodeURIComponent(currentRoom)}`);
          if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
            setMessages((prev) => {
              const existingIds = new Set(
                prev.map((m) => m._id || `${m.senderId}-${m.timestamp}-${m.message}`)
              );
              const newItems = res.data.data.filter(
                (m) => !existingIds.has(m._id || `${m.senderId}-${m.timestamp}-${m.message}`)
              );
              if (newItems.length === 0) return prev;
              return [...prev, ...newItems];
            });
          }
        } catch (_) {}
      }, 3500);
    }

    return () => {
      isMounted = false;
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [currentRoom, isSocketConnected]);

  // 3. Listen for Real-Time Socket.io Room Messages
  useEffect(() => {
    if (!currentRoom) return undefined;
    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('join_room', currentRoom, (result) => {
        if (result?.success) {
          setConnectionError('');
        }
      });
    };

    const handleIncomingMessage = (data) => {
      if (data && data.roomId === currentRoom) {
        setMessages((prev) => {
          // Avoid duplicate messages if optimistic add or polling already caught it
          const exists = prev.some(
            (m) => (data._id && m._id === data._id) || (m.timestamp === data.timestamp && m.message === data.message && String(m.senderId) === String(data.senderId))
          );
          if (exists) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on('connect', joinRoom);
    socket.on('receive_message', handleIncomingMessage);
    if (socket.connected) joinRoom();

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', handleIncomingMessage);
    };
  }, [currentRoom, user?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRetry = () => {
    setIsRetrying(true);
    setConnectionError('');
    const socket = getSocket();
    socket.disconnect();
    connectSocket();
  };

  // 4. Send Message Handler (Dual Engine: WebSocket with REST API Fallback)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !user) return;
    setMessageInput('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      roomId: currentRoom,
      senderId: user._id,
      sender: user.name,
      senderRole: user.role,
      message: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically update the UI instantly
    setMessages((prev) => [...prev, optimisticMessage]);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', { roomId: currentRoom, message: trimmed }, async (result) => {
        if (!result?.success) {
          // If socket delivery fails, smoothly fallback to REST API
          try {
            const res = await axiosInstance.post('/chat/send', { roomId: currentRoom, message: trimmed });
            if (res.data?.success && res.data.data) {
              setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data.data : m)));
            }
          } catch (restErr) {
            setConnectionError(restErr.response?.data?.message || 'Message could not be sent.');
          }
        }
      });
    } else {
      // Cloud serverless environment (Vercel) -> send via secure HTTP endpoint
      try {
        const res = await axiosInstance.post('/chat/send', { roomId: currentRoom, message: trimmed });
        if (res.data?.success && res.data.data) {
          setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data.data : m)));
        }
      } catch (err) {
        setConnectionError(err.response?.data?.message || 'Failed to send message. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
      {/* Channel Selector Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Real-Time School Communication</h3>
              {isSocketConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live (WebSocket)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Cloud className="w-3 h-3 text-indigo-500" />
                  Cloud Sync (Live)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isSocketConnected
                ? 'Instant Socket.io encrypted room messaging'
                : 'High-speed cloud synchronized room messaging'}
            </p>
          </div>
        </div>

        {/* Channel Dropdown / Pills */}
        <div className="flex items-center space-x-2">
          <select
            value={currentRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              setMessages([]);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {visibleChannels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {connectionError && (
        <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{connectionError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer shrink-0 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
            <p className="text-xs font-medium text-slate-500">Connected to {CHANNELS.find((c) => c.id === currentRoom)?.name}</p>
            <p className="text-[11px] text-slate-400 mt-1">Send a message to start live broadcasting</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = String(msg.senderId) === String(user?._id);
            return (
              <div key={msg._id || index} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-slate-700">{msg.sender}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      msg.senderRole === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : msg.senderRole === 'teacher'
                        ? 'bg-emerald-100 text-emerald-700'
                        : msg.senderRole === 'parent'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {msg.senderRole}
                  </span>
                </div>
                <div
                  className={`max-w-[78%] p-3.5 rounded-2xl text-sm shadow-xs ${
                    isSelf
                      ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          placeholder={`Message in #${CHANNELS.find((c) => c.id === currentRoom)?.name.split(' ')[1] || 'channel'}...`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          maxLength={2000}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;