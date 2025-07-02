import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Reset any previous error messages

    try {
      // Use backticks for string interpolation
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Wait for the response to be parsed as JSON
      const data = await response.json();

      if (response.ok) {
        // If successful, store admin info and redirect to dashboard
        localStorage.setItem('adminInfo', JSON.stringify({ username: data.admin.username }));
        navigate('/admin/new-dashboard');
      } else {
        // Show error message if login fails
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6">
          <h2 className="text-3xl font-bold text-white text-center">Admin Login</h2>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center space-x-2"
          >
            <span>Login</span>
          </button>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Don't have an account?</p>
            <button
              type="button"
              onClick={() => navigate('/adminsignup')}
              className="text-indigo-600 hover:underline"
            >
              Sign up as Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
