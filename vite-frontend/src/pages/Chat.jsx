import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { getMessages, getUserById, markMessagesRead, uploadFile, verifyMedia } from '../api';
import { LuCheck } from "react-icons/lu";
import { LuCheckCheck } from "react-icons/lu";
import { IoArrowUndo } from "react-icons/io5";
import moment from 'moment';

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
  const bottomRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false); // 👈 should be boolean

  useEffect(()=>{
    console.log('Chat screen socket - ',socket);
  },[socket,id,user]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users) => {
      console.log("📡 Received online users:", users);
      setOnlineUsers(users);
    };

    // Attach listener *first*
    socket.on("onlineUsers", handleOnlineUsers);

    // Emit after connection
    const emitGetOnlineUsers = () => {
      console.log("📨 Emitting getOnlineUsers");
      socket.emit("getOnlineUsers");
    };

    if (socket.connected) {
      emitGetOnlineUsers();
    } else {
      socket.once("connect", emitGetOnlineUsers);
    }

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("connect", emitGetOnlineUsers); // Cleanup listener
    };
  }, [socket,id]);

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
    if (!socket || !id || !user?._id) return;

    const handleReceive = (msg) => {
      if ((msg.from === id && msg.to === user._id) || (msg.from === user._id && msg.to === id)) {
        setMessages((prev) => [...prev, msg]);

        // Emit read event only if the message is from the other user and to me
        if (msg.from === id && msg.to === user._id) {
          socket.emit('messageRead', { to: msg.from });

          setMessages((prevMsgs) =>
            prevMsgs.map((m) =>
              m.from === msg.from && m.to === msg.to && !m.read
                ? { ...m, read: true }
                : m
            )
          );
        }
      }
    };

    socket.on('receiveMessage', handleReceive);
    return () => socket.off('receiveMessage', handleReceive);
  }, [socket, id, user]);

  useEffect(() => {
    if (!socket || !id) return;
    
    if (user?._id) {
      socket.emit("join", user._id);
    }

    const handleTyping = ({ from }) => {
      if (from === id) {
        setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));
      }
    };

    const handleStopTyping = ({ from }) => {
      setTypingUsers((prev) => prev.filter((uid) => uid !== from));
    };

    const handleRead = ({ from }) => {
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg.from === user._id && msg.to === from
            ? { ...msg, read: true }
            : msg
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
  }, [socket, id, user]);

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
    if (!socket || !id) return;

    const notify = (msg) => {
      if (msg.from === id && Notification.permission === 'granted') {
        const senderName = msg.senderName || 'Unknown'; // Optional field for name
        new Notification(`Message from ${senderName}`, {
          body: msg.text || '📎 Media message',
        });
      }
    };

    socket.on('newMessage', notify);
    return () => socket.off('newMessage', notify);
  }, [socket, id]);


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
      createdAt: new Date().toISOString(), // ✅ Add createdAt timestamp
    };

    socket.emit('sendMessage', msg);
    setMessages((prev) => [...prev, msg]);
    setText('');
    socket.emit('stopTyping', { to: id });

    if (msg.from === id && msg.to === user._id) {
      socket.emit('messageRead', { to: msg.from });
    }
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fileInputRef = useRef(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // ⛔ Invalid Date fallback

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const getWeekStart = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };

    const isSameWeek = (d1, d2) => {
      const weekStart1 = getWeekStart(d1);
      const weekStart2 = getWeekStart(d2);
      return weekStart1.toDateString() === weekStart2.toDateString();
    };

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    if (isSameWeek(date, today)) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }

    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (toUser?._id && onlineUsers.length) {
      setIsOnline(onlineUsers.includes(toUser._id));
    }
    console.log('toUser - ',toUser);
    console.log('onlineUsers -',onlineUsers);
  }, [toUser, onlineUsers]);


  return (
    <div className='m-auto flex flex-col item-center h-screen'>
      <div className='m-auto min-w-[300px] w-full max-w-[80vw]'>
        <h2 className='text-2xl font-bold mb-5 text-center'>Chat</h2>
        <div className='bg-white pt-8 pl-8 pr-2 rounded-lg shadow-lg min-h-[80vh] '>
          <div className='pb-2.5 relative'>
            <h2 className='text-xl font-bold mb-1'>{toUser.username}</h2>
            <p className='text-sm font-normal'>{toUser.mobile	}</p>
            <p className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <Link className='absolute top-1 right-4 text-[18px]' to='/dashboard'><IoArrowUndo/></Link>
          </div>
          <div className='h-[73vh] overflow-y-auto pr-5'>
            {messages.map((msg, index) => {
              const msgDate = new Date(msg.createdAt);
              const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
              
              const showDateLabel =
                !prevMsgDate ||
                msgDate.toDateString() !== prevMsgDate.toDateString();

              return (
                <React.Fragment key={index}>
                  {showDateLabel && (
                    <div className="mx-auto text-xs sticky bg-black bg-opacity-5 w-max block py-1 px-3 rounded-full text-gray-700 my-2">
                      {formatDateLabel(msg.createdAt)} 
                    </div>
                  )}
                  <div className={`w-full flex ${msg.from === user._id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.from === user._id ? 'bg-sky-100' : 'bg-pink-100'} w-max p-2 px-5 rounded-[25px] mb-2 relative`}>
                      {msg.text && <p className='pr-16'>{msg.text}</p>}
                      {msg.media && (
                        <div className='pr-16'>
                          <button onClick={() => handleMediaClick(msg.media)}>🔒 View Media</button>
                        </div>
                      )}
                      <span className="text-[10px] absolute bottom-1 right-8 text-gray-500 mt-1 block"> {moment(msg.createdAt).format('h:mm A')} </span>
                      {msg.from === user._id && (
                        <small className='absolute bottom-1 right-3'>
                          {msg.read ? (
                            <span className="text-green-500 text-[16px]"><LuCheckCheck/></span>
                          ) : (
                            <span className="text-gray-400 text-[16px]"><LuCheck/></span>
                          )}
                        </small>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div ref={bottomRef} />
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
                    <div className='p-3 rounded-lg bg-white'>
                      <p className='text-md font-semibold mb-2'>Enter password to view media:</p>
                      <input
                        type="password"
                        value={password}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button className="mt-3 text-white bg-blue-500 shadow-lg shadow-blue-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-1" onClick={handlePasswordSubmit}>Submit</button>
                      <button className="mt-3 text-white bg-red-500 shadow-lg shadow-red-500/50 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 ml-1" onClick={() => setShowImageModal(false)}>Cancel</button>
                    </div>
                  ) : (
                    <div className='p-3 rounded-lg bg-white'>
                      <img src={decodedImage} alt="Decoded" style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
                      <button className="mt-3 text-white bg-red-500 shadow-lg shadow-red-500/50 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 block ml-auto" onClick={() => {
                        setShowImageModal(false);
                        setDecodedImage(null);
                        setSelectedMedia(null);
                        setPassword('');
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