// Repositories.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BitbucketDashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Get workspace and token from localStorage
  const workspace = localStorage.getItem('bitbucketWorkspace');
  const accessToken = localStorage.getItem('bitbucketToken');

  useEffect(() => {
    // Redirect to workspaces page if no workspace or token is found
    if (!workspace || !accessToken) {
      navigate('/');
      return;
    }

    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Fetch repositories when component mounts
    fetchRepositories();
  }, [workspace, accessToken]);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    setRepositories([]);
    setCommits([]);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/projects?workspace=${workspace}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data.repositories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async (repoSlug) => {
    setLoading(true);
    setError(null);
    setCommits([]);
    setSelectedRepo(repoSlug);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/commits?workspace=${workspace}&repoSlug=${repoSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch commits');
      }

      const data = await response.json();
      setCommits(data.commits);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bitbucketWorkspace');
    localStorage.removeItem('bitbucketToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 flex flex-col md:flex-row justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white">
                Repositories of {workspace}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300 mt-4 md:mt-0"
            >
              Logout
            </button>
          </div>

          {userData && (
            <div className="bg-blue-50 p-4 md:p-6 border-b border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">User Profile</h3>
                  <p className="mt-1 font-semibold text-gray-900">{userData.username}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <p className="mt-1 font-semibold text-gray-900">{userData.role || 'Not specified'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Project</h3>
                  <p className="mt-1 font-semibold text-gray-900">{userData.projectName || 'Not specified'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDate(userData.projectStartDate)} to {formatDate(userData.projectEndDate)}
                  </p>
                </div>
              </div>
              
              {userData.teamMembers && userData.teamMembers.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Team Members</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {userData.teamMembers.map((member, index) => (
                      <div key={index} className="p-2 border rounded bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">
                              {member.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="p-6 flex justify-center">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {repositories.length > 0 && (
            <div className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow-md rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {repositories.map((repo) => (
                      <tr key={repo.slug} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{repo.name}</div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-500">{repo.description || 'No description'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(repo.updated_on).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => fetchCommits(repo.slug)}
                            className={`px-4 py-2 rounded-md transition duration-300 ${
                              selectedRepo === repo.slug && loading
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            disabled={selectedRepo === repo.slug && loading}
                          >
                            {selectedRepo === repo.slug && loading ? 'Loading...' : 'View Commits'}
                          </button>

                          <button
                            onClick={() => navigate(`/workspace/${workspace}/repo/${repo.slug}/contributions`)}
                            className="ml-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300"
                          >
                            View Contributions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {commits.length > 0 && (
            <div className="p-6 md:p-8">
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900">
                    Commits for {selectedRepo}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Total Commits: {commits.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Commit Hash</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {commits.map((commit) => (
                        <tr key={commit.hash} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {commit.hash.substring(0, 7)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{commit.message}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{commit.author}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(commit.date).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BitbucketDashboard;
