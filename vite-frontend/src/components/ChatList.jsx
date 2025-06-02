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
    <div className='pt-8'>
      <h3 className='text-lg font-bold mb-2 text-left'>Chats:</h3>
      {friends.map((f, index) => (
        <Link key={f._id} to={`/chat/${f._id}`}>
          <div className={`p-3 rounded-md ${
            index % 2 === 0 ? 'bg-sky-100' : 'bg-sky-200'
          }`}>
            <strong>{f.username}</strong>
            <p className='text-[13px]'>{latestMessages[f._id]?.text || 'No messages yet'}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};
export default ChatList;