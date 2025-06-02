import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await registerUser({ username, mobile, password });
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <>
      <div className='m-auto flex flex-col item-center h-screen'>
          <div className='m-auto min-w-[300px] w-full max-w-sm'>
              <h3 className='text-2xl font-bold mb-5 text-center'>Register</h3>
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
                <div className="mb-3">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                  <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Mobile</label>
                  <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                  <input type="password" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="mt-3 text-white bg-blue-500 shadow-lg shadow-blue-500/50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Register</button>
              </form> 
          </div>
      </div>
    </>
  );
};
export default Register;