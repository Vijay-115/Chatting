import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { acceptRequest, getFriendRequests, getFriends, searchUsers, sendRequest } from '../api';
import { IoNotificationsOutline } from "react-icons/io5";
import { LuUserRoundPlus } from "react-icons/lu";
import { IoSearchSharp } from "react-icons/io5";
import { BiLogOut } from "react-icons/bi";
import ChatList from '../components/ChatList';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const [currentUser, setCurrentUser] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);

  const [showRequests, setShowRequests] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const requestRef = useRef();
  const notificationRef = useRef();

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
    if (user) {
      console.log('user - ', user);
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    console.log('currentUser changed - ', currentUser);
  }, [currentUser]);


  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await getFriendRequests();
      setRequests(data); // [{ _id, username, mobile }]
    };
    fetchRequests();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!requestRef.current?.contains(e.target)) setShowRequests(false);
      if (!notificationRef.current?.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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

  
  useEffect(() => {
    console.log('setResults changed - ', results);
    console.log('currentUser changed - ', currentUser);
  }, [results]);


  const handleSendRequest = async (id) => {
    try {
      await sendRequest({ receiverId: id });
      toast.success("Request Sent");
    } catch (error) {
      console.error('handleSendRequest failed:', error);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await acceptRequest(id);
      toast.success("Request Accept");
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
                  <div
                    className="w-10 mx-auto flex-initial relative"
                    ref={requestRef}
                    onMouseEnter={() => setShowRequests(true)}
                    onMouseLeave={() => setShowRequests(false)}
                  >
                    <div className="requestIcon">
                      <button
                        className="text-center block mx-auto text-2xl"
                        onClick={() => setShowRequests(!showRequests)}
                      >
                        <LuUserRoundPlus />
                      </button>
                      <span className="bg-red-700 block w-[18px] h-[18px] rounded-full text-[0.65em] leading-[1.7em] font-bold text-center text-white absolute top-[-15px] right-0">
                        {requests?.length || 0}
                      </span>
                    </div>

                    {showRequests && (
                      <div className="requestSec bg-white p-4 rounded-lg shadow-lg absolute top-[25px] right-[-65px] min-w-[200px] z-50">
                        <h3 className="font-semibold mb-2">Requests:</h3>
                        {requests?.length > 0 ? (
                          <>
                            <ul className="space-y-2">
                              {requests.map((user) => (
                                <li key={user._id} className="text-sm flex justify-between items-center">
                                  <span className='text-[13px]'>{user.username} ({user.mobile})</span>
                                  <button
                                    onClick={() => handleAcceptRequest(user._id)}
                                    className="ml-2 text-white bg-blue-500 shadow-lg shadow-blue-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-[11px] w-full sm:w-auto px-2 py-1.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                  >
                                    Accept
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No new requests</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className="w-10 mx-auto flex-initial relative"
                    ref={notificationRef}
                    onMouseEnter={() => setShowNotifications(true)}
                    onMouseLeave={() => setShowNotifications(false)}
                  >
                    <button
                      className="text-center block mx-auto text-2xl"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <IoNotificationsOutline />
                    </button>
                    <span className="bg-red-700 block w-[18px] h-[18px] rounded-full text-[0.65em] leading-[1.7em] font-bold text-center text-white absolute top-[-15px] right-0">
                      0
                    </span>

                    {showNotifications && (
                      <div className="bg-white p-4 rounded-lg shadow-lg absolute top-[25px] right-[-20px] min-w-[200px] z-50">
                        <h3 className="font-semibold mb-2">Notifications:</h3>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>No new notifications.</li>
                          {/* You can map notification data here */}
                        </ul>
                      </div>
                    )}
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