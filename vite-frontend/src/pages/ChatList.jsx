import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getFriends, getLatestMessages } from '../api';


const ChatList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [latestMessages, setLatestMessages] = useState({});
  
  useEffect(() => {
    const fetchFriends = async () => {
      const res = await getFriends();
      setFriends(res.data);
    };

    const fetchLatestMessages = async () => {
      const res = await getLatestMessages();
      setLatestMessages(res.data);
    };

    fetchFriends();
    fetchLatestMessages();
  }, [user]);

    useEffect(() => {
      console.log('friends',friends);
      console.log('latestMessages',latestMessages);
    }, [latestMessages]);

  return (
    <div>
      <h2>Chats</h2>
      {friends.map((f) => (
        <Link key={f._id} to={`/chat/${f._id}`}>
          <div style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
            <strong>{f.username}</strong>
            <p>{latestMessages[f._id]?.text || 'No messages yet'}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};
export default ChatList;