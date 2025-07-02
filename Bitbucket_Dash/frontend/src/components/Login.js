import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('bitbucketToken');
    const workspace = localStorage.getItem('bitbucketWorkspace');
    if (token && workspace) navigate('/dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors({ ...errors, [id]: null });
    setGeneralError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    setGeneralError('');
  
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username, 
          password: formData.password 
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('bitbucketWorkspace', data.workspace);
        localStorage.setItem('bitbucketToken', data.token);
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        navigate('/dashboard');
      } else {
        setGeneralError(data.error || data.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setGeneralError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <h2 className="text-3xl font-bold text-white text-center">Bitbucket Dashboard</h2>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {generalError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p>{generalError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
          </button>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Don't have an account?</p>
            <button type="button" onClick={() => navigate('/studentsignup')} className="text-blue-600 hover:underline">
              Sign up as Student
            </button>
          </div>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Are you an Admin?</p>
            <button type="button" onClick={() => navigate('/adminlogin')} className="text-indigo-600 hover:underline font-semibold">
              Login as Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
