import React, { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { getSocketUrl } from '../config/apiConfig';
import { Send, MessageSquare, Radio } from 'lucide-react';

const socket = io(getSocketUrl(), { autoConnect: false });

const CHANNELS = [
  { id: 'school-wide-broadcast', name: '📢 School-Wide Broadcast', desc: 'Official general notices and alerts', roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'admin-teacher-chat', name: '👔 Admin to Teacher Lounge', desc: 'Faculty coordination and announcements', roles: ['admin', 'teacher'] },
  { id: 'teacher-student-chat', name: '📚 Teacher to Student Desk', desc: 'Academic discussions, homework queries', roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'parent-communication', name: '👨‍👩‍👧 Parent Communication', desc: 'Parent inquiries and school updates', roles: ['admin', 'teacher', 'parent'] },
];

const ChatRoom = ({ defaultRoomId = 'school-wide-broadcast' }) => {
  const { user } = useContext(AuthContext);
  const [selectedRoom, setSelectedRoom] = useState(defaultRoomId);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const messagesEndRef = useRef(null);
  const visibleChannels = CHANNELS.filter((channel) => channel.roles.includes(user?.role));
  const currentRoom = visibleChannels.some((channel) => channel.id === selectedRoom)
    ? selectedRoom
    : visibleChannels[0]?.id || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      socket.disconnect();
      return undefined;
    }

    const handleConnect = () => setConnectionError('');
    const handleConnectError = () => setConnectionError('Chat connection failed. Please sign in again or try later.');
    socket.auth = { token };
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [user?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentRoom) return undefined;
    const joinRoom = () => {
      socket.emit('join_room', currentRoom, (result) => {
        if (!result?.success) setConnectionError(result?.message || 'Unable to join this chat channel.');
      });
    };

    const handleIncomingMessage = (data) => {
      if (data && data.roomId === currentRoom) {
        setMessages((prev) => [...prev, data]);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    socket.emit('send_message', { roomId: currentRoom, message: messageInput.trim() }, (result) => {
      if (!result?.success) setConnectionError(result?.message || 'Message could not be sent.');
    });
    setMessageInput('');
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
            <h3 className="font-bold text-slate-800 text-sm">Real-Time School Communication</h3>
            <p className="text-xs text-slate-500">Instant Socket.io encrypted room messaging</p>
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
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {visibleChannels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {connectionError && <p role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{connectionError}</p>}

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
            const isSelf = msg.senderId === user?._id;
            return (
              <div key={index} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
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
          placeholder={`Message in #${CHANNELS.find((c) => c.id === currentRoom)?.name.split(' ')[1]}...`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          maxLength={2000}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;