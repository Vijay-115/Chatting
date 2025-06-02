import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMessages, markMessagesRead, uploadFile, verifyMedia } from '../api';

const Chat = () => {
  const { id } = useParams(); // friend's userId
  const socket = useSocket();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const typingTimeout = useRef(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [password, setPassword] = useState('');
  const [decodedImage, setDecodedImage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await getMessages(id);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    if (id) fetchMessages();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (msg.from === id || msg.to === id) {
        setMessages((prev) => [...prev, msg]);

        if (msg.from === id && msg.to === user._id) {
          socket.emit('messageRead', { to: msg.from });

          setMessages((prevMsgs) =>
            prevMsgs.map((m) =>
              m._id === msg._id ? { ...m, read: true } : m
            )
          );
        }
      }
    };

    socket.on('receiveMessage', handleReceive);
    return () => socket.off('receiveMessage', handleReceive);
  }, [socket, id]);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ from }) => {
      if (from === id) {
        setTypingUsers((prev) =>
          prev.includes(from) ? prev : [...prev, from]
        );
      }
    };

    const handleStopTyping = ({ from }) => {
      setTypingUsers((prev) => prev.filter((uid) => uid !== from));
    };

    const handleRead = ({ from }) => {
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg.to === from && !msg.read ? { ...msg, read: true } : msg
        )
      );
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageRead', handleRead);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageRead', handleRead);
    };
  }, [socket, id]);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const markRead = async () => {
      try {
        await markMessagesRead({ fromUserId: id });

        if (socket && user?._id && id) {
          socket.emit('messageRead', { to: id });
        }
      } catch (err) {
        console.error('Mark read failed:', err);
      }
    };

    if (id) markRead();
  }, [id, socket, user]);

  useEffect(() => {
    if (!socket) return;

    const notify = (msg) => {
      if (Notification.permission === 'granted') {
        new Notification(`Message from ${msg.fromName || 'Unknown'}`, {
          body: msg.text || '📎 Media message',
        });
      }
    };

    socket.on('newMessage', notify);
    return () => socket.off('newMessage', notify);
  }, [socket]);

  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);

    if (!socket) return;

    socket.emit('typing', { to: id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { to: id });
    }, 1500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result; // data:image/png;base64,...

      try {
        const res = await uploadFile({
          data: base64Data,
          name: file.name,
        });

        const mediaUrl = res.data.filePath;
        console.log('Media URL:', mediaUrl);

        const msg = {
          to: id,
          from: user._id,
          media: mediaUrl,
        };

        socket.emit('sendMessage', msg);
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error('File upload error:', err);
      }
    };

    reader.readAsDataURL(file); // ⬅️ Converts to base64
  };

  const sendMessage = () => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    const msg = {
      to: id,
      from: user._id,
      text: trimmedText,
    };

    socket.emit('sendMessage', msg);
    setMessages((prev) => [...prev, msg]);
    setText('');
    socket.emit('stopTyping', { to: id });
    socket.emit('messageRead', { to: id });
  };

  const handleMediaClick = (mediaPath) => {
    setSelectedMedia(mediaPath);
    setPassword('');
    setShowImageModal(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await verifyMedia({
          password,
          data: selectedMedia,
        });
      console.log('handlePasswordSubmit',response);
      setDecodedImage(response.data.cleanedBase64);
    } catch (err) {
      console.error('Failed to fetch media', err);
      alert('Failed to decode image, '+err.response.data.error);
    }
  };


  return (
    <div>
      <h2 className='text-blue-500'>Chat</h2>

      <div style={{ height: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.from === user._id ? 'right' : 'left' }}>
            {msg.text && <p>{msg.text}</p>}
            {msg.media && (
              <div>
                <button onClick={() => handleMediaClick(msg.media)}>🔒 View Media</button>
              </div>
            )}
            <small>{msg.read ? '✔✔' : '✔'}</small>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={handleTyping}
        placeholder="Type a message..."
      />
      <input type="file" onChange={handleFileChange} />
      {typingUsers.includes(id) && <p><em>Typing...</em></p>}
      <button onClick={sendMessage}>Send</button>

      {showImageModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
        }}>
          {!decodedImage ? (
            <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
              <p>Enter password to view media:</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handlePasswordSubmit}>Submit</button>
              <button onClick={() => setShowImageModal(false)}>Cancel</button>
            </div>
          ) : (
            <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
              <img src={decodedImage} alt="Decoded" style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
              <br />
              <button onClick={() => {
                setShowImageModal(false);
                setDecodedImage(null);
              }}>Close</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Chat;