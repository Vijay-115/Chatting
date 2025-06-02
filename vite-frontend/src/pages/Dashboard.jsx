import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { acceptRequest, getFriendRequests, getFriends, searchUsers, sendRequest } from '../api';

const Dashboard = () => {
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await getFriends();
      setFriends(res.data);
    } catch (error) {
      console.error('fetchFriends failed:', error);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await getFriendRequests();
      setRequests(data); // [{ _id, username, mobile }]
    };
    fetchRequests();
  }, []);

  const handleSearch = async () => {
    try {
      const res = await searchUsers(query);
      setResults(res.data);
    } catch (error) {
      console.error('handleSearch failed:', error);
    }
  };

  const handleSendRequest = async (id) => {
    try {
      await sendRequest({ receiverId: id });
      alert('Request sent');
    } catch (error) {
      console.error('handleSendRequest failed:', error);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await acceptRequest(id);
      alert('Request Accept');
    } catch (error) {
      console.error('handleSendRequest failed:', error);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={logout}>Logout</button>

      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by username or mobile" />
      <button onClick={handleSearch}>Search</button>

      { requests && (
        <>
          <h3>Request:</h3>
          <ul>
            {requests.map(user => (
              <li key={user._id}>
                {user.username} ({user.mobile}) <button onClick={() => handleAcceptRequest(user._id)}>Accept Request</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Results:</h3>
      <ul>
        {results.map(user => (
          <li key={user._id}>
            {user.username} ({user.mobile}) <button onClick={() => handleSendRequest(user._id)}>Send Request</button>
          </li>
        ))}
      </ul>

      <h3>Your Friends:</h3>
      <ul>
        {friends.map(f => (
          <li key={f._id}>{f.username} ({f.mobile})</li>
        ))}
      </ul>
    </div>
  );
};
export default Dashboard;