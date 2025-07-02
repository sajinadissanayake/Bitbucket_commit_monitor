import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trash2, RefreshCw, Loader, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Manage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deletingGroups, setDeletingGroups] = useState([]);
  const [notification, setNotification] = useState(null); // {type: 'success' | 'error', message: string}
  const navigate = useNavigate();

  // Helper function to handle API responses and errors consistently
  const handleApiResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      } else {
        const errorText = await response.text();
        console.error("Non-JSON error response:", errorText);
        throw new Error(`Server error: ${response.status}`);
      }
    }
    
    // Only try to parse JSON if the content type is json
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }
    
    // Fallback to text for non-JSON responses
    return response.text();
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/groups`);
      const data = await handleApiResponse(response);
      setGroups(data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load groups: ${err.message}`);
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
    await fetchGroups();
      setNotification({
        type: 'success',
        message: 'Data refreshed successfully'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Failed to refresh data: ${err.message}`
      });
    } finally {
    setTimeout(() => setRefreshing(false), 800); // Add a small delay for animation effect
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredGroups = groups.filter((group) =>
    group.groupNumber.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.members && group.members.some((member) =>
      member.name && member.name.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // Helper function to validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  // Helper function to check if a student exists
  const checkStudentExists = async (studentId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/check-student/${studentId}`);
      const data = await handleApiResponse(response);
      return data.exists;
    } catch (error) {
      console.error(`Error checking if student ${studentId} exists:`, error);
      return false;
    }
  };

  // Helper function to delete a student with fallback
  const deleteStudent = async (member) => {
    console.log(`Attempting to delete student: ${member.name} (ID: ${member._id})`);
    
    // First try the regular endpoint
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/admin/students/${member._id}`;
      console.log('DELETE request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Response status for ${member.name}:`, response.status);
      
      if (response.ok) {
        const result = await handleApiResponse(response);
        console.log(`Delete response for ${member.name}:`, result);
        return { success: true, data: result };
      }
      
      // If the regular endpoint fails with 404, try the direct method
      if (response.status === 404) {
        console.log(`Regular delete failed for ${member.name}, trying direct method`);
        
        const directUrl = `${process.env.REACT_APP_API_BASE_URL}/api/admin/students-direct/${member._id}`;
        console.log('Direct DELETE request to:', directUrl);
        
        const directResponse = await fetch(directUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Direct response status for ${member.name}:`, directResponse.status);
        
        if (directResponse.ok) {
          const directResult = await handleApiResponse(directResponse);
          console.log(`Direct delete response for ${member.name}:`, directResult);
          return { success: true, data: directResult };
        }
        
        // If direct method also fails, throw an error
        const errorData = await handleApiResponse(directResponse);
        throw new Error(errorData.message || `Failed to delete student using direct method`);
      }
      
      // If it's not a 404, handle the error
      const errorData = await handleApiResponse(response);
      throw new Error(errorData.message || `Failed to delete student`);
    } catch (error) {
      console.error(`Error deleting ${member.name}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Handle delete with proper API call
  const handleDelete = async (groupId) => {
    const groupToDelete = groups.find(g => g.groupNumber === groupId);
    
    if (!groupToDelete || !groupToDelete.members) {
      setNotification({
        type: 'error',
        message: 'Group not found'
      });
      return;
    }
    
    // Debug: Log the group structure
    console.log('Group to delete:', JSON.stringify(groupToDelete, null, 2));
    
    // Validate member IDs before attempting deletion
    const invalidMembers = groupToDelete.members.filter(member => !member._id || !isValidObjectId(member._id));
    if (invalidMembers.length > 0) {
      const invalidNames = invalidMembers.map(m => m.name).join(', ');
      setNotification({
        type: 'error',
        message: `Cannot delete group: Invalid IDs for members: ${invalidNames}`
      });
      console.error('Invalid member IDs:', invalidMembers);
      return;
    }
    
    // Create a more detailed confirmation message
    const memberNames = groupToDelete.members.map(m => m.name).join(', ');
    const confirmMessage = `Are you sure you want to delete Group ${groupId}?\n\nThis will permanently delete ${groupToDelete.members.length} member(s): ${memberNames}\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Add this group to the deleting state
        setDeletingGroups(prev => [...prev, groupId]);
        
        // First, check if all students exist
        const existenceChecks = await Promise.all(
          groupToDelete.members.map(async (member) => {
            const exists = await checkStudentExists(member._id);
            return { member, exists };
          })
        );
        
        const nonExistentMembers = existenceChecks.filter(check => !check.exists);
        if (nonExistentMembers.length > 0) {
          const nonExistentNames = nonExistentMembers.map(check => check.member.name).join(', ');
          console.warn(`Some members don't exist in the database: ${nonExistentNames}`);
        }
        
        // Only try to delete members that exist
        const membersToDelete = existenceChecks
          .filter(check => check.exists)
          .map(check => check.member);
        
        if (membersToDelete.length === 0) {
          setNotification({
            type: 'error',
            message: `Failed to delete group ${groupId}. No valid members found in database.`
          });
          setDeletingGroups(prev => prev.filter(id => id !== groupId));
          return;
        }
        
        // Track successful and failed deletions
        const deletionResults = {
          successful: [],
          failed: []
        };
        
        // Delete each student in the group
        for (const member of membersToDelete) {
          const result = await deleteStudent(member);
          
          if (result.success) {
            deletionResults.successful.push(member.name);
          } else {
            deletionResults.failed.push({ name: member.name, error: result.error });
          }
        }
        
        console.log('Deletion results:', deletionResults);
        
        // If all deletions were successful
        if (deletionResults.failed.length === 0) {
          // Update the local state by removing the deleted group
          setGroups(prevGroups => prevGroups.filter(group => group.groupNumber !== groupId));
          
          setNotification({
            type: 'success',
            message: `Group ${groupId} was successfully deleted`
          });
        } 
        // If some deletions failed but some succeeded
        else if (deletionResults.successful.length > 0) {
          // Refresh the groups to get the current state
          await fetchGroups();
          
          setNotification({
            type: 'warning',
            message: `Partially deleted group ${groupId}. ${deletionResults.successful.length} members deleted, ${deletionResults.failed.length} failed.`
          });
        } 
        // If all deletions failed
        else {
          setNotification({
            type: 'error',
            message: `Failed to delete group ${groupId}. No members were deleted.`
          });
        }
      } catch (err) {
        console.error('Group deletion error:', err);
        
        // Show error notification
        setNotification({
          type: 'error',
          message: `Failed to delete group: ${err.message}`
        });
      } finally {
        // Remove this group from the deleting state
        setDeletingGroups(prev => prev.filter(id => id !== groupId));
      }
    }
  };

  // Helper function to test the MongoDB connection and Student model
  const testStudentModel = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/test-student-model`);
      const data = await handleApiResponse(response);
      console.log('Student model test results:', data);
      return data;
    } catch (error) {
      console.error('Error testing Student model:', error);
      return null;
    }
  };

  // Helper function to check database collections
  const checkDbCollections = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/db-collections`);
      const data = await handleApiResponse(response);
      console.log('Database collections:', data);
      return data;
    } catch (error) {
      console.error('Error checking database collections:', error);
      return null;
    }
  };

  // Combine the useEffects
  useEffect(() => {
    // Fetch groups
    fetchGroups();
    
    // Test the Student model
    testStudentModel().then(result => {
      if (result && result.connectionState !== 'connected') {
        setNotification({
          type: 'error',
          message: `MongoDB connection issue: ${result.connectionState}`
        });
      } else if (result && !result.collectionExists) {
        setNotification({
          type: 'error',
          message: 'Student collection does not exist in the database'
        });
      } else if (result && result.studentCount === 0) {
        setNotification({
          type: 'warning',
          message: 'No students found in the database'
        });
      }
    });
    
    // Check database collections
    checkDbCollections().then(result => {
      if (result && !result.studentModelCollection.exists) {
        console.warn(`Student collection issue: Expected '${result.studentModelCollection.expected}' but it doesn't exist`);
        
        // Find a collection with students
        const collectionWithStudents = Object.entries(result.collectionStats)
          .filter(([name, count]) => count > 0)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (collectionWithStudents) {
          console.log(`Found collection with students: ${collectionWithStudents[0]} (${collectionWithStudents[1]} documents)`);
    }
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-5 md:p-8">
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .shimmer {
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 8s infinite linear;
          opacity: 0.4;
        }

        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          display: block;
        }

        @keyframes slideInNotification {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .notification-enter {
          animation: slideInNotification 0.3s ease forwards;
        }

        .notification-exit {
          animation: fadeOut 0.3s ease forwards;
        }
      `}</style>

      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg notification-enter ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 
            notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
            'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
            {notification.type === 'success' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="text-yellow-500" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
          </div>
          <div className="ml-3 text-sm font-normal">{notification.message}</div>
          <button 
            type="button" 
            className={`ml-4 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 ${
              notification.type === 'success' ? 'bg-green-50 text-green-500 hover:bg-green-100' : 
              notification.type === 'warning' ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100' :
              'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
            onClick={() => setNotification(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-full mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/30">
        {/* Simplified Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-3 p-2 hover:bg-white/20 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Manage Groups</h1>
      </div>

            <div className="flex items-center">
              <button 
                onClick={refreshData}
                className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}
                disabled={refreshing}
                aria-label="Refresh data"
              >
                <RefreshCw size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="sm:w-5 sm:h-5 text-gray-400" />
            </div>
          <input 
            type="text" 
            placeholder="Filter by Group Number"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
            />
        </div>
      </div>

        {/* Table/List */}
      {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500 animate-pulse text-sm sm:text-base">Loading groups...</p>
          </div>
      ) : error ? (
          <div className="p-5 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{error}</h3>
            <p className="text-sm text-gray-500 mb-4">There was a problem loading the groups data.</p>
            <button 
              onClick={refreshData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop/Tablet Grid Layout - No horizontal scrolling */}
            <div className="hidden md:block p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredGroups.flatMap((group, groupIndex) =>
                  group.members && group.members.map((member, idx) => (
                    <div 
                      key={`${group.groupNumber}-${idx}`} 
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                      style={{
                        animation: `slideIn 0.3s ease forwards`,
                        animationDelay: `${(groupIndex * 0.05) + (idx * 0.03)}s`,
                        opacity: 0
                      }}
                    >
                      <div className="grid grid-cols-12 gap-0">
                        <div className="col-span-1 py-4 px-3 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <span className="font-bold text-xl">{group.groupNumber}</span>
                        </div>
                        <div className="col-span-4 p-4 flex items-center space-x-3">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-medium text-gray-900 truncate">{member.name}</div>
                            <div className="text-sm text-gray-500 truncate">{member.username}</div>
                          </div>
                        </div>
                        <div className="col-span-6 p-4 flex flex-col justify-center">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Workspace</span>
                          <span className="text-sm font-medium text-gray-700 break-all">{member.workspaceName}</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center border-l border-gray-100">
                          <button 
                            onClick={() => handleDelete(group.groupNumber)}
                            disabled={deletingGroups.includes(group.groupNumber)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-200"
                            aria-label="Delete"
                          >
                            {deletingGroups.includes(group.groupNumber) ? 
                              <Loader size={20} className="animate-spin" /> : 
                            <Trash2 size={20} />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mobile view - Card-based layout */}
            <div className="md:hidden space-y-4 p-3 sm:p-4">
              {filteredGroups.flatMap((group, groupIndex) =>
                group.members && group.members.map((member, idx) => (
                  <div 
                    key={`${group.groupNumber}-${idx}`} 
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                    style={{
                      animation: `slideIn 0.3s ease forwards`,
                      animationDelay: `${(groupIndex * 0.05) + (idx * 0.03)}s`,
                      opacity: 0
                    }}
                  >
                    <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                          {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                          <div className="text-xs text-gray-500 truncate">{member.username}</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm ml-2">
                        {group.groupNumber}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Workspace</span>
                        <span className="text-sm font-medium text-gray-700 block mt-1 break-all">{member.workspaceName}</span>
                      </div>
                      <div className="flex justify-end pt-2">
                    <button 
                          onClick={() => handleDelete(group.groupNumber)}
                          disabled={deletingGroups.includes(group.groupNumber)}
                          className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                          {deletingGroups.includes(group.groupNumber) ? 
                            <Loader size={14} className="sm:w-4 sm:h-4 animate-spin" /> : 
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          }
                          <span className="text-xs font-medium">{deletingGroups.includes(group.groupNumber) ? 'Deleting...' : 'Delete'}</span>
                    </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {filteredGroups.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
                    <Search size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No groups found</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or filter.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer with count information only */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex justify-center">
            <div className="text-xs text-gray-500">
              {filteredGroups.reduce((count, group) => count + (group.members?.length || 0), 0)} members in {filteredGroups.length} groups
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;