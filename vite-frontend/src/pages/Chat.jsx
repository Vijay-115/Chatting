import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { getMessages, getUserById, markMessagesRead, uploadFile, verifyMedia } from '../api';

const Chat = () => {
  const { id } = useParams(); // friend's userId
  const socket = useSocket();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [toUser, setToUser] = useState('');
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
        setMessages(res.data); // assuming res.data is an array of messages
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    const fetchUser = async () => {
      try {
        const res = await getUserById(id);
        setToUser(res.data); // assuming res.data is the user object
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    if (id) {
      fetchMessages();
      fetchUser();
    }
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

  const fileInputRef = useRef(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='m-auto flex flex-col item-center h-screen'>
      <div className='m-auto min-w-[300px] w-full max-w-[80vw]'>
        <h2 className='text-2xl font-bold mb-5 text-center'>Chat</h2>
        <div className='bg-white pt-8 pl-8 pr-2 rounded-lg shadow-lg min-h-[80vh] '>
          <div className='pb-2.5'>
            <h2 className='text-xl font-bold mb-1'>{toUser.username}</h2>
            <p className='text-sm font-normal'>{toUser.mobile	}</p>
          </div>
          <div className='h-[73vh] overflow-y-auto pr-5'>
            {messages.map((msg, index) => (
              <div
                className={`w-full flex ${msg.from === user._id ? 'justify-end' : 'justify-start'}`}
                key={index}
              >
                <div className='bg-sky-100 w-max p-2 px-5 rounded-[25px] mb-2 relative'>
                  {msg.text && <p className='pr-7'>{msg.text}</p>}
                  {msg.media && (
                    <div className='pr-7'>
                      <button onClick={() => handleMediaClick(msg.media)}>🔒 View Media</button>
                    </div>
                  )}
                  <small className='absolute bottom-1 right-3'>
                    {msg.read ? (
                      <span className="text-green-500">✔✔</span>
                    ) : (
                      <span className="text-gray-400">✔</span>
                    )}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <div className='typesec flex items-center pt-2 pb-4'>
              <div className='w-[65vw] flex items-center relative'>
                  <input
                    value={text}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  />
                  <div onClick={handleIconClick} className="cursor-pointer text-lg absolute right-3">
                    <MdOutlineAddPhotoAlternate />
                    <input
                      ref={fileInputRef}
                      id="uploadmedia"
                      className="hidden"
                      type="file"
                      onChange={handleFileChange}
                    />
                  </div>
              </div>
              <div className='w-auto ml-auto pr-5'>
                  <button className="text-white ml-auto bg-blue-500 shadow-lg shadow-blue-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={sendMessage}>Send</button>
              </div>
              {typingUsers.includes(id) && <p><em>Typing...</em></p>}
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
        </div>
      </div>
    </div>
  );
};

export default Chat;