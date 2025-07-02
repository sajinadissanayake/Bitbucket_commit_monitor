// Workspaces.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/routes/Students`);
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        const data = await response.json();
        setWorkspaces(data.tokens);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleWorkspaceClick = (workspace) => {
    // Store workspace data in localStorage
    localStorage.setItem('bitbucketWorkspace', workspace.workspaceName);
    localStorage.setItem('bitbucketToken', workspace.token);
    // Navigate to repositories page
    navigate('/repositories');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">
              Available Workspaces
            </h1>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {workspaces.length > 0 ? (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow-md rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Workspace Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workspaces.map((workspace) => (
                      <tr 
                        key={workspace._id} 
                        onClick={() => handleWorkspaceClick(workspace)}
                        className="hover:bg-gray-50 cursor-pointer transition duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {workspace.workspaceName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {workspace.studentNumber}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No workspaces available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Workspaces;