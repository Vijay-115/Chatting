import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getFriends, getLatestMessages } from '../api';
import { LuCheck, LuCheckCheck } from "react-icons/lu";
import { useSocket } from '../context/SocketContext';
import { RiRadioButtonLine } from "react-icons/ri";

const ChatList = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [latestMessages, setLatestMessages] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, messagesRes] = await Promise.all([
          getFriends(),
          getLatestMessages()
        ]);
        setFriends(friendsRes.data);
        setLatestMessages(messagesRes.data);
      } catch (err) {
        console.error("Failed to fetch friends or messages", err);
      }
    };

    fetchData();

    if (user?._id) {
      socket.emit("join", user._id);
    }
    
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

    socket.on("newMessage", (message) => {
      const key = message.from === user._id ? message.to : message.from;
      setLatestMessages(prev => ({
        ...prev,
        [key]: message
      }));
    });

    socket.on("messageRead", ({ chatId }) => {
      console.log("messageRead received for:", chatId);

      setLatestMessages(prev => {
        const msg = prev[chatId];
        if (!msg || msg.from !== user._id) return prev;
        return {
          ...prev,
          [chatId]: { ...msg, read: true }
        };
      });
    });

    socket.on("typing", ({ from }) => {
      setTypingStatus(prev => ({
        ...prev,
        [from]: true
      }));
    });

    socket.on("stopTyping", ({ from }) => {
      setTypingStatus(prev => ({
        ...prev,
        [from]: false
      }));
    });

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("connect", emitGetOnlineUsers); // Cleanup listener
      socket.off("newMessage");
      socket.off("messageRead");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [user, socket]);

  
  useEffect(() => {
    if (!socket) return;
    socket.on('onlineUsers', (users) => {
      console.log('📡 Received online users:', users);
      setOnlineUsers(users);
    });

    socket.on('userOnline', (userId) => {
      console.log(`📶 User came online: ${userId}`);
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    socket.on('userOffline', (userId) => {
      console.log(`📴 User went offline: ${userId}`);
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, []);

  const handleOpenChat = (userId) => {
    if (!socket) return;

    if (!socket.connected) {
      socket.once('connect', () => {
        navigate(`/chat/${userId}`);
      });
    } else {
      navigate(`/chat/${userId}`);
    }
  };

  return (
    <div className='pt-8'>
      <h3 className='text-lg font-bold mb-2 text-left'>Chats:</h3>
      {friends.map((f, index) => {
        const latest = latestMessages[f._id];
        const isTyping = typingStatus[f._id];
        const isOnline = onlineUsers.includes(f._id);
        return (
          // <Link key={f._id} to={`/chat/${f._id}`}>
            <div onClick={() => handleOpenChat(f._id) } className={`p-3 rounded-md ${index % 2 === 0 ? 'bg-sky-100' : 'bg-sky-200'} mb-2`}>
              <div className='flex gap-1 items-center'>
                <strong>{f.username}</strong>
                <span className={`text-sm ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                  <RiRadioButtonLine />
                </span>
              </div>
              <p className='text-[13px] w-max relative'>
                {isTyping ? (
                  <em className="text-sm text-gray-600">Typing...</em>
                ) : (
                  <>
                    {latest?.from === user._id ? (
                      <>
                      {latest?.text || 'No messages yet'}
                      <div className='absolute bottom-0.5 -right-6'>
                        {latest.read ? (
                          <span className="text-green-500 text-[16px]"><LuCheckCheck /></span>
                        ) : (
                          <span className="text-gray-400 text-[16px]"><LuCheck /></span>
                        )}
                      </div>
                      </>
                    ) :
                    (
                      latest.read ? (
                        latest?.text || 'No messages yet'
                      ) : (
                        <span className="font-bold">{latest?.text || 'No messages yet'}</span>
                      )
                      
                    )
                  }
                  </>
                )}
              </p>
            </div>
          // </Link>
        );
      })}
    </div>
  );
};

export default ChatList;