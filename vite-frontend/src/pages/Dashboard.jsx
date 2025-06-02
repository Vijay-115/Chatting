import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { acceptRequest, getFriendRequests, getFriends, searchUsers, sendRequest } from '../api';
import { IoNotificationsOutline } from "react-icons/io5";
import { LuUserRoundPlus } from "react-icons/lu";
import { IoSearchSharp } from "react-icons/io5";
import { BiLogOut } from "react-icons/bi";
import ChatList from '../components/ChatList';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const [currentUser, setCurrentUser] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  // const [friends, setFriends] = useState([]);

  // useEffect(() => {
  //   fetchFriends();
  // }, []);

  // const fetchFriends = async () => {
  //   try {
  //     const res = await getFriends();
  //     setFriends(res.data);
  //   } catch (error) {
  //     console.error('fetchFriends failed:', error);
  //   }
  // };

  useEffect(() => {
    if(user){
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await getFriendRequests();
      setRequests(data); // [{ _id, username, mobile }]
    };
    fetchRequests();
  }, []);

  const handleSearchChange = async (e) => {
    setQuery(e.target.value);
  }

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
    <>
      <div className='m-auto flex flex-col item-center h-screen'>
        <div className='m-auto min-w-[300px] w-full max-w-[80vw]'>
            <h3 className='text-2xl font-bold mb-5 text-left'>Dashboard</h3>
            <div className='bg-white p-8 rounded-lg shadow-lg min-h-[80vh] '>
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                <div class="md:max-w-[65vw] md:flex-initial w-full md:mr-auto mb-6 md:mb-0 ">   
                    <label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input
                        type="text"
                        onChange={handleSearchChange} // ✅ No arrow function needed here
                        className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Search Mockups, Logos..."
                        value={query}
                      />

                        <div onClick={()=> handleSearch(query)} class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</div>
                    </div>
                </div>
                <div className='iconsec w-[200px] flex mx-auto'>                    
                  <div className='w-10 mx-auto flex-initial'>
                      <button className='text-center block mx-auto text-2xl' onClick={logout}><BiLogOut/></button>
                  </div>
                  <div className='w-10 mx-auto flex-initial relative'>
                      <div className='requestIcon'> 
                          <button className='text-center block mx-auto text-2xl'  onClick={logout}><LuUserRoundPlus/></button>
                          <span className='bg-red-700 block w-[18px] h-[18px] rounded-[50%] text-[0.65em] leading-[1.7em] font-bold text-center text-white absolute top-[-15px] right-0'>5</span>
                      </div>
                      <div className='requestSec bg-white p-8 rounded-lg shadow-lg absolute top-[35px] right-[-40px]'>                                     
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
                      </div>
                  </div>
                  <div className='w-10 mx-auto flex-initial relative'>
                      <button className='text-center block mx-auto text-2xl'  onClick={logout}><IoNotificationsOutline/></button>
                      <span className='bg-red-700 block w-[18px] h-[18px] rounded-[50%] text-[0.65em] leading-[1.7em] font-bold text-center text-white absolute top-[-15px] right-0'>10</span>
                  </div>
                </div>
              </div>
                      
              {/* <div>
                <h3>Your Friends:</h3>
                <ul>
                  {friends.map(f => (
                    <li key={f._id}>{f.username} ({f.mobile})</li>
                  ))}
                </ul>
              </div> */}
              {
                results.length > 0 ? (
                <div className='pt-8'>
                  <h3 className='text-lg font-bold mb-2 text-left'>Results:</h3>
                  <ul>
                    {results.map((user, index) => {
                      const isFriend = currentUser.friends.includes(user._id);
                      const isRequestSent = currentUser.sentRequests.includes(user._id);
                      return (
                        <li
                          key={user._id}
                          className={`flex gap-3 text-[17px] items-center p-3 rounded-md ${
                            index % 2 === 0 ? 'bg-sky-100' : 'bg-sky-200'
                          }`}
                        >
                          {user.username} ({user.mobile})

                          <div className="ml-auto">
                            {isFriend ? (
                              <span className='flex items-center gap-1 text-white bg-green-500 shadow-lg shadow-green-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'>Already Friend</span>
                            ) : isRequestSent ? (
                              <span className='flex items-center gap-1 text-white bg-yellow-500 shadow-lg shadow-yellow-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1 text-center dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800'>Request Sent Already</span>
                            ) : (
                              <button
                                className='flex items-center gap-1 text-white bg-blue-500 shadow-lg shadow-blue-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                                onClick={() => handleSendRequest(user._id)}
                              >
                                <LuUserRoundPlus /> Send Request
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    className='flex items-center gap-1 mt-6 justify-center text-white bg-red-500 shadow-lg shadow-red-500/50 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-3 py-1 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800'
                    onClick={() => {
                      setQuery('');
                      setResults([]); // Use empty array instead of empty string
                    }}
                  >
                    Close Search
                  </button>
                </div>    
                ) : (
                  <ChatList/>
                )
              }
            </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;