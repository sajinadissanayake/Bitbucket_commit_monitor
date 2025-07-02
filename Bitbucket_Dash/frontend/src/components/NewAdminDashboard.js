import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewAdminDashboard.css'; // We'll create this CSS file next

// Add scroll effect for header with performance optimization
const useScrollEffect = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    let scrollTimer;
    const body = document.body;
    
    const handleScroll = () => {
      // Add scrolling class to body during scroll for performance
      if (!body.classList.contains('scrolling')) {
        body.classList.add('scrolling');
      }
      
      // Clear previous timer
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      // Set a timer to remove the scrolling class after scrolling stops
      scrollTimer = setTimeout(() => {
        body.classList.remove('scrolling');
      }, 150);
      
      // Update header state
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [scrolled]);
  
  return scrolled;
};

// Memoized project row component for better performance
const ProjectRow = memo(({ project, index, selectedProject, handleProjectSelect, navigateToAnalytics, getRoleColor, getTechStackColor, formatDate, developerCommits, fetchDeveloperCommits, refreshProjectDetails, getStatusClass }) => {
  return (
    <React.Fragment>
      <tr 
        className="hover:bg-gray-50 transition-colors duration-150" 
        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
      >
        <td className="px-4 py-4 whitespace-normal text-sm">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 rounded-md ${getTechStackColor(project.techStack || 'default')} flex items-center justify-center text-white font-bold shadow-md`}>
              {project.techStack ? project.techStack.substring(0, 2) : 'PRJ'}
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <span className={`status-indicator ${getStatusClass(project)}`} 
                      data-tooltip={getStatusClass(project) === 'status-active' ? 'Active' : 
                                  getStatusClass(project) === 'status-pending' ? 'Pending' : 
                                  getStatusClass(project) === 'status-completed' ? 'Completed' : 'Due Soon'}></span>
                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{project.projectName || `Project ${project.groupNumber}`}</div>
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[200px]">Workspace: {project.workspaceName}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-4 text-sm">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTechStackColor(project.techStack || 'default')} text-white shadow-sm`}>
            {project.techStack || 'Unknown'}
          </span>
        </td>
        <td className="px-3 py-4 text-sm responsive-hidden">
          {(project.startDate && project.endDate && 
            project.startDate !== 'null' && project.endDate !== 'null' && 
            project.startDate !== undefined && project.endDate !== undefined) ? (
            <div className="timeline-highlight rounded-lg p-2">
              <div className="text-xs text-gray-900 font-medium">
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </div>
              <div className="text-xs text-gray-500">
                {(() => {
                  try {
                    const start = new Date(project.startDate);
                    const end = new Date(project.endDate);
                    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    return isNaN(daysDiff) ? 'Invalid dates' : `${daysDiff} days`;
                  } catch (e) {
                    console.error('Error calculating days difference:', e);
                    return 'Error calculating duration';
                  }
                })()}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                {(() => {
                  try {
                    const start = new Date(project.startDate).getTime();
                    const end = new Date(project.endDate).getTime();
                    const now = new Date().getTime();
                    
                    if (isNaN(start) || isNaN(end)) {
                      throw new Error('Invalid date format');
                    }
                    
                    const total = end - start;
                    const progress = now - start;
                    const percentage = Math.max(0, Math.min(100, (progress / total) * 100));
                    
                    let statusColor = 'bg-green-500';
                    let statusText = 'On Track';
                    
                    if (percentage >= 100) {
                      statusColor = 'bg-gray-500';
                      statusText = 'Completed';
                    } else if (percentage >= 80) {
                      statusColor = 'bg-red-500';
                      statusText = 'Due Soon';
                    } else if (percentage >= 50) {
                      statusColor = 'bg-yellow-500';
                      statusText = 'In Progress';
                    }
                    
                    return (
                      <>
                        <div 
                          className={`h-1.5 ${statusColor}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <div className={`w-2 h-2 rounded-full ${statusColor} mr-1`}></div>
                          {statusText}
                        </div>
                      </>
                    );
                  } catch (e) {
                    console.error('Error rendering progress bar:', e);
                    return (
                      <div className="text-xs text-red-500 mt-1">
                        Error calculating progress
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">Timeline not specified</div>
          )}
        </td>
        <td className="px-3 py-4 text-sm text-gray-500">
          {project.groupNumber}
        </td>
        <td className="px-3 py-4 text-right text-sm font-medium">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                // Get fresh project details when clicking view
                refreshProjectDetails(project.groupNumber);
                handleProjectSelect(project.id || project.groupNumber);
              }}
              className={`view-button-active px-3 py-1.5 rounded-md transition-colors duration-150 flex items-center ${
                selectedProject === (project.id || project.groupNumber) 
                  ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                  : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="whitespace-nowrap">
                {selectedProject === (project.id || project.groupNumber) ? 'Hide' : 'View'}
              </span>
            </button>
            {project.workspaceName && (
              <button
                onClick={() => {
                  // Create a cached key for this workspace
                  const cacheKey = `repos_${project.workspaceName}`;
                  // Check if we have cached repos
                  const cachedRepos = sessionStorage.getItem(cacheKey);
                  
                  if (cachedRepos) {
                    const repos = JSON.parse(cachedRepos);
                    if (repos.length > 0) {
                      navigateToAnalytics(project.workspaceName, repos[0].slug);
                    }
                  } else {
                    // Fetch repos if not cached
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/workspace-projects/${project.workspaceName}`)
                      .then(res => res.json())
                      .then(repos => {
                        // Cache the results
                        sessionStorage.setItem(cacheKey, JSON.stringify(repos));
                        if (repos.length > 0) {
                          navigateToAnalytics(project.workspaceName, repos[0].slug);
                        }
                      })
                      .catch(err => console.error('Error fetching repositories:', err));
                  }
                }}
                className="btn-secondary flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="whitespace-nowrap">Analytics</span>
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {selectedProject === (project.id || project.groupNumber) && (
        <tr>
          <td colSpan="5" className="px-6 py-4 bg-gray-50 animate-fade-in" id={`project-details-${project.id || project.groupNumber}`}>
            <div className="border rounded-lg shadow-sm bg-white overflow-hidden glass-card">
              {/* Project details header */}
              <div className="px-4 py-4 sm:px-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Project Details
                  </h3>
                  {project.startDate && project.endDate && (
                    <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </div>
                  )}
                </div>
                
                {/* Project timeline if available */}
                {project.startDate && project.endDate && (
                  <div className="mt-3 bg-white p-3 rounded-md shadow-sm timeline-highlight">
                    <div className="text-sm font-medium text-gray-900 mb-1">Project Timeline</div>
                    <div className="flex items-center mb-2">
                      <div className="text-xs text-gray-600 w-1/4">Start: {formatDate(project.startDate)}</div>
                      <div className="w-2/4">
                        <div className="w-full bg-gray-200 rounded-full h-2 relative">
                          {(() => {
                            const start = new Date(project.startDate).getTime();
                            const end = new Date(project.endDate).getTime();
                            const now = new Date().getTime();
                            const total = end - start;
                            const progress = now - start;
                            const percentage = Math.max(0, Math.min(100, (progress / total) * 100));
                            
                            let statusColor = 'bg-green-500';
                            
                            if (percentage >= 100) {
                              statusColor = 'bg-gray-500';
                            } else if (percentage >= 80) {
                              statusColor = 'bg-red-500';
                            } else if (percentage >= 50) {
                              statusColor = 'bg-yellow-500';
                            }
                            
                            // Add "today" marker
                            return (
                              <>
                                <div className={`h-2 rounded-full ${statusColor}`} style={{ width: `${percentage}%` }}></div>
                                <div className="absolute top-0 bottom-0 w-0.5 bg-blue-600" style={{ left: `${percentage}%` }}></div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 w-1/4 text-right">End: {formatDate(project.endDate)}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                )}
              </div>
              
              {/* Team Members section */}
              <div className="px-4 py-3 sm:px-6 border-b bg-gray-50">
                <h3 className="text-md leading-6 font-medium text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team Members ({project.teamMembers?.length || 0})
                </h3>
              </div>
              
              <div className="bg-white">
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 responsive-grid">
                    {project.teamMembers.map((member, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 team-member-highlight glass-card" style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}>
                        <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                              <span className="text-sm font-medium text-white">
                                {member.name ? member.name.substring(0, 2).toUpperCase() : 'TM'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">
                                {member.isOwner ? 'Project Owner' : 'Team Member'}
                                {member.email && <span className="ml-1">• {member.email}</span>}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role || 'Developer')} shadow-sm`}>
                            {member.role || 'Developer'}
                          </span>
                        </div>
                        
                        {/* Show commits for developers - lazily loaded */}
                        {(member.role === 'Developer' || member.role === 'PM' || member.isOwner) && project.workspaceName && (
                          <div className="p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-gray-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Latest Commit
                              </span>
                              {!developerCommits[member.name] && (
                                <button
                                  onClick={() => fetchDeveloperCommits(project.workspaceName, member.name)}
                                  className="btn-secondary text-xs flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Load Commit
                                </button>
                              )}
                            </div>
                            
                            {developerCommits[member.name] === 'loading' ? (
                              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded flex items-center justify-center shimmer">
                                <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading commits...</span>
                              </div>
                            ) : developerCommits[member.name] ? (
                              developerCommits[member.name].length > 0 ? (
                                <div className="animate-fade-in">
                                  {/* Special message for Kavindu Liyanage to show mapping to Kavindu80 */}
                                  {member.name.toLowerCase().includes('kavindu') && 
                                  member.name.toLowerCase().includes('liyanage') && (
                                    <div className="text-xs text-blue-600 italic mb-2 bg-blue-50 p-1 rounded">
                                      Automatically mapped "{member.name}" to Bitbucket user "Kavindu80"
                                    </div>
                                  )}
                                  
                                  {/* Show only the latest commit with clear details */}
                                  {(() => {
                                    const latestCommit = developerCommits[member.name][0]; // Get only the first (latest) commit
                                    if (!latestCommit) return null;
                                    
                                    // Format date nicely
                                    const commitDate = new Date(latestCommit.date);
                                    const formattedDate = commitDate.toLocaleDateString();
                                    const formattedTime = commitDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                    
                                    return (
                                      <div className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="border-b bg-indigo-50 px-3 py-2 flex justify-between items-center">
                                          <div className="flex items-center">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-mono rounded px-2 py-1 font-bold">
                                              {latestCommit.hash.substring(0, 7)}
                                            </span>
                                          </div>
                                          <div className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formattedDate}, {formattedTime}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white">
                                          <p className="text-sm font-medium text-gray-800 whitespace-normal break-words">
                                            {latestCommit.message}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded animate-fade-in">
                                  No commits found for {member.name}
                                </div>
                              )
                            ) : (
                              <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Click to load recent commits</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>No team members available for this project.</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

// Memoized mobile project card component for better performance on small screens
const MobileProjectCard = memo(({ project, index, selectedProject, handleProjectSelect, navigateToAnalytics, getRoleColor, getTechStackColor, formatDate, getStatusClass, refreshProjectDetails, developerCommits, fetchDeveloperCommits }) => {
  return (
    <div className="mobile-card animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
      <div className="mobile-card-header">
        <div className="mobile-card-title">
          <span className={`status-indicator ${getStatusClass(project)}`}></span>
          <span className="truncate max-w-[180px]">{project.projectName || `Project ${project.groupNumber}`}</span>
        </div>
        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getTechStackColor(project.techStack || 'default')} text-white shadow-sm`}>
          {project.techStack || 'Unknown'}
        </span>
      </div>
      
      <div className="mobile-card-body">
        <div className="mobile-card-section">
          <div className="mobile-card-label">Workspace</div>
          <div className="mobile-card-value truncate">{project.workspaceName}</div>
        </div>
        
        <div className="mobile-card-section">
          <div className="mobile-card-label">Group</div>
          <div className="mobile-card-value">{project.groupNumber}</div>
        </div>
        
        {(project.startDate && project.endDate && 
          project.startDate !== 'null' && project.endDate !== 'null' && 
          project.startDate !== undefined && project.endDate !== undefined) && (
          <div className="mobile-card-section">
            <div className="mobile-card-label">Timeline</div>
            <div className="mobile-card-value text-xs">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
              {(() => {
                try {
                  const start = new Date(project.startDate).getTime();
                  const end = new Date(project.endDate).getTime();
                  const now = new Date().getTime();
                  
                  if (isNaN(start) || isNaN(end)) {
                    throw new Error('Invalid date format');
                  }
                  
                  const total = end - start;
                  const progress = now - start;
                  const percentage = Math.max(0, Math.min(100, (progress / total) * 100));
                  
                  let statusColor = 'bg-green-500';
                  
                  if (percentage >= 100) {
                    statusColor = 'bg-gray-500';
                  } else if (percentage >= 80) {
                    statusColor = 'bg-red-500';
                  } else if (percentage >= 50) {
                    statusColor = 'bg-yellow-500';
                  }
                  
                  return (
                    <div 
                      className={`h-1.5 ${statusColor}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        )}
        
        <div className="mobile-card-section">
          <div className="mobile-card-label">Team Members</div>
          <div className="mobile-card-value">
            <div className="flex -space-x-1 overflow-hidden mt-1">
              {project.teamMembers && project.teamMembers.slice(0, 5).map((member, idx) => (
                <div 
                  key={idx} 
                  className="inline-block h-6 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md border border-white"
                  title={member.name}
                >
                  <span className="text-xs font-medium text-white">
                    {member.name ? member.name.substring(0, 1).toUpperCase() : '?'}
                  </span>
                </div>
              ))}
              {project.teamMembers && project.teamMembers.length > 5 && (
                <div className="inline-block h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center shadow-sm border border-white">
                  <span className="text-xs font-medium text-gray-600">
                    +{project.teamMembers.length - 5}
                  </span>
                </div>
              )}
              {(!project.teamMembers || project.teamMembers.length === 0) && (
                <span className="text-xs text-gray-500 italic">No team members</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mobile-card-footer">
        <button
          onClick={() => {
            refreshProjectDetails(project.groupNumber);
            handleProjectSelect(project.id || project.groupNumber);
          }}
          className={`view-button-active px-3 py-1.5 rounded-md transition-colors duration-150 flex items-center ${
            selectedProject === (project.id || project.groupNumber) 
              ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
              : 'text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>
            {selectedProject === (project.id || project.groupNumber) ? 'Hide' : 'View'}
          </span>
        </button>
        
        {project.workspaceName && (
          <button
            onClick={() => {
              const cacheKey = `repos_${project.workspaceName}`;
              const cachedRepos = sessionStorage.getItem(cacheKey);
              
              if (cachedRepos) {
                const repos = JSON.parse(cachedRepos);
                if (repos.length > 0) {
                  navigateToAnalytics(project.workspaceName, repos[0].slug);
                }
              } else {
                fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/workspace-projects/${project.workspaceName}`)
                  .then(res => res.json())
                  .then(repos => {
                    sessionStorage.setItem(cacheKey, JSON.stringify(repos));
                    if (repos.length > 0) {
                      navigateToAnalytics(project.workspaceName, repos[0].slug);
                    }
                  })
                  .catch(err => console.error('Error fetching repositories:', err));
              }
            }}
            className="btn-secondary flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analytics</span>
          </button>
        )}
      </div>
      
      {/* Mobile Project Details when expanded */}
      {selectedProject === (project.id || project.groupNumber) && (
        <div className="p-4 bg-gray-50 animate-fade-in border-t border-gray-200">
          {/* Project details header */}
          <div className="mb-3">
            <h3 className="text-sm leading-6 font-medium text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Team Members
            </h3>
          </div>
          
          {/* Team members grid */}
          {project.teamMembers && project.teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 mobile-team-table">
              {project.teamMembers.map((member, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md mr-3">
                        <span className="text-sm font-medium text-white">
                          {member.name ? member.name.substring(0, 1).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">
                          {member.isOwner ? 'Project Owner' : 'Team Member'}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role || 'Developer')} shadow-sm`}>
                      {member.role || 'Developer'}
                    </span>
                  </div>
                  
                  {/* Show commits for developers in mobile view - added here */}
                  {(member.role === 'Developer' || member.role === 'PM' || member.isOwner) && project.workspaceName && (
                    <div className="mt-2 pt-2 border-t border-gray-100 mobile-commit-section">
                      <div className="flex justify-between items-center mb-2 mobile-commit-header">
                        <span className="text-xs font-medium text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Latest Commit
                        </span>
                        {!developerCommits[member.name] && (
                          <button
                            onClick={() => fetchDeveloperCommits(project.workspaceName, member.name)}
                            className="btn-secondary text-xs flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Load Commit
                          </button>
                        )}
                      </div>
                      
                      {developerCommits[member.name] === 'loading' ? (
                        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded flex items-center justify-center shimmer mobile-commit-content">
                          <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading commits...</span>
                        </div>
                      ) : developerCommits[member.name] ? (
                        developerCommits[member.name].length > 0 ? (
                          <div className="animate-fade-in">
                            {/* Special message for Kavindu Liyanage to show mapping to Kavindu80 */}
                            {member.name.toLowerCase().includes('kavindu') && 
                            member.name.toLowerCase().includes('liyanage') && (
                              <div className="text-xs text-blue-600 italic mb-2 bg-blue-50 p-1 rounded">
                                Automatically mapped "{member.name}" to Bitbucket user "Kavindu80"
                              </div>
                            )}
                            
                            {/* Show only the latest commit with clear details */}
                            {(() => {
                              const latestCommit = developerCommits[member.name][0]; // Get only the first (latest) commit
                              if (!latestCommit) return null;
                              
                              // Format date nicely
                              const commitDate = new Date(latestCommit.date);
                              const formattedDate = commitDate.toLocaleDateString();
                              const formattedTime = commitDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                              
                              return (
                                <div className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="border-b bg-indigo-50 px-3 py-2 flex justify-between items-center">
                                    <div className="flex items-center">
                                      <span className="bg-indigo-100 text-indigo-800 text-xs font-mono rounded px-2 py-1 font-bold">
                                        {latestCommit.hash.substring(0, 7)}
                                      </span>
                                    </div>
                                    <div className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formattedDate}, {formattedTime}
                                    </div>
                                  </div>
                                  <div className="p-3 bg-white">
                                    <p className="text-sm font-medium text-gray-800 whitespace-normal break-words mobile-commit-message">
                                      {latestCommit.message}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded animate-fade-in mobile-commit-content">
                            No commits found for {member.name}
                          </div>
                        )
                      ) : (
                        <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded flex items-center justify-center space-x-2 mobile-commit-content">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Click to load recent commits</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 bg-gray-50 py-4 rounded">
              No team members available
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Load analytics section only when active
const AnalyticsSection = memo(({ projects, navigateToManage, getTechStackColor, getRoleColor }) => {
  // Calculate statistics for the dashboard
  const calculateStats = () => {
    const stats = {
      totalProjects: projects.length,
      activeProjects: 0,
      completedProjects: 0,
      upcomingProjects: 0,
      techStacks: new Set(),
      totalTeamMembers: 0,
      roleDistribution: {},
      projectsByMonth: {},
      recentActivity: []
    };
    
    const now = new Date();
    
    projects.forEach(project => {
      // Count tech stacks
      if (project.techStack) {
        stats.techStacks.add(project.techStack);
      }
      
      // Count team members
      const teamMemberCount = project.teamMembers?.length || 0;
      stats.totalTeamMembers += teamMemberCount;
      
      // Track role distribution
      if (project.teamMembers) {
        project.teamMembers.forEach(member => {
          const role = member.role || 'Unspecified';
          stats.roleDistribution[role] = (stats.roleDistribution[role] || 0) + 1;
        });
      }
      
      // Project status
      if (project.startDate && project.endDate) {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        
        // Group by month
        const monthYear = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        stats.projectsByMonth[monthYear] = (stats.projectsByMonth[monthYear] || 0) + 1;
        
        if (endDate < now) {
          stats.completedProjects++;
        } else if (startDate > now) {
          stats.upcomingProjects++;
        } else {
          stats.activeProjects++;
        }
      } else {
        // Default to active if no dates
        stats.activeProjects++;
      }
      
      // Add to recent activity
      if (project.workspaceName) {
        stats.recentActivity.push({
          type: 'project_created',
          name: project.projectName || `Project ${project.groupNumber}`,
          date: project.startDate || new Date().toISOString(),
          tech: project.techStack || 'Unknown',
          id: project.id || project.groupNumber
        });
      }
    });
    
    // Sort recent activity by date (newest first)
    stats.recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    stats.recentActivity = stats.recentActivity.slice(0, 5); // Keep only 5 most recent
    
    return stats;
  };
  
  const stats = calculateStats();
  
  // Calculate percentages for the donut chart
  const calculateTechPercentages = () => {
    const techCounts = {};
    let total = 0;
    
    projects.forEach(project => {
      if (project.techStack) {
        techCounts[project.techStack] = (techCounts[project.techStack] || 0) + 1;
        total++;
      }
    });
    
    // Convert to array of objects with percentages
    return Object.entries(techCounts)
      .map(([tech, count]) => ({
        tech,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  };
  
  const techDistribution = calculateTechPercentages();
  
  return (
    <div className="animate-fade-in">
      {projects.length === 0 ? (
        <div className="bg-white shadow-lg rounded-lg p-8 text-center animate-fade-in glass-card">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse-slow"></div>
            <svg className="absolute inset-0 w-24 h-24 text-indigo-500 mx-auto animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 className="mt-6 text-xl font-medium text-gray-900">No projects available</h3>
          <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
            There are no projects to display. Add students with project details to see analytics.
          </p>
          <div className="mt-6">
            <button
              onClick={navigateToManage}
              className="btn-primary inline-flex items-center px-6 py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Manage Students
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="bg-white shadow-lg rounded-lg p-6 glass-card premium-card-shadow">
            <h2 className="text-xl font-bold mb-6 flex items-center premium-title">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              System Analytics Dashboard
            </h2>
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Projects */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-5 text-white relative overflow-hidden card-hover-effect metric-card">
                <div className="absolute top-0 right-0 -mt-4 -mr-16 opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold">Total Projects</h3>
                  <p className="text-4xl font-bold mt-2 stat-counter">{stats.totalProjects}</p>
                  <div className="mt-4 text-indigo-100 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>{stats.activeProjects} active projects</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
              </div>
              
              {/* Tech Stacks */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-5 text-white relative overflow-hidden card-hover-effect metric-card">
                <div className="absolute top-0 right-0 -mt-4 -mr-16 opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold">Technology Stacks</h3>
                  <p className="text-4xl font-bold mt-2 stat-counter">{stats.techStacks.size}</p>
                  <div className="mt-4 text-blue-100 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Diverse technologies</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
              </div>
              
              {/* Team Members */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg p-5 text-white relative overflow-hidden card-hover-effect metric-card">
                <div className="absolute top-0 right-0 -mt-4 -mr-16 opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <p className="text-4xl font-bold mt-2 stat-counter">{stats.totalTeamMembers}</p>
                  <div className="mt-4 text-green-100 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Active contributors</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
              </div>
              
              {/* Project Status */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-5 text-white relative overflow-hidden card-hover-effect metric-card">
                <div className="absolute top-0 right-0 -mt-4 -mr-16 opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold">Project Status</h3>
                  <p className="text-4xl font-bold mt-2 stat-counter">{stats.activeProjects}</p>
                  <div className="mt-4 text-amber-100 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Active now</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
              </div>
            </div>
          </div>
          
          {/* Technology Distribution and Project Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Technology Distribution */}
            <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 lg:col-span-2 glass-card chart-container premium-card-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center premium-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Technology Distribution
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {techDistribution.map((tech, index) => (
                  <div 
                    key={tech.tech} 
                    className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 hover:shadow-md transition-all duration-200 animate-fade-in accent-card" 
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTechStackColor(tech.tech)} text-white`}>
                        {tech.percentage}%
                      </span>
                      <span className="text-xs text-gray-500">{tech.count} projects</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{tech.tech}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3 data-bar">
                      <div 
                        className={`h-2 rounded-full ${getTechStackColor(tech.tech)} data-bar-fill`} 
                        style={{ width: `${tech.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Project Status */}
            <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 glass-card premium-card-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center premium-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Project Status Overview
              </h3>
              <div className="space-y-3 md:space-y-4">
                {/* Active Projects */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 md:p-4 border border-green-200 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="status-indicator status-active" data-tooltip="Active"></span>
                      <h4 className="text-sm font-medium text-green-800">Active Projects</h4>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {stats.activeProjects}
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2.5 mt-3 data-bar">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full data-bar-fill" 
                      style={{ width: `${(stats.activeProjects / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-700 mt-2 flex justify-end">
                    {Math.round((stats.activeProjects / stats.totalProjects) * 100)}% of total
                  </div>
                </div>
                
                {/* Completed Projects */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 md:p-4 border border-blue-200 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="status-indicator status-completed" data-tooltip="Completed"></span>
                      <h4 className="text-sm font-medium text-blue-800">Completed Projects</h4>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {stats.completedProjects}
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2.5 mt-3 data-bar">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full data-bar-fill" 
                      style={{ width: `${(stats.completedProjects / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-blue-700 mt-2 flex justify-end">
                    {Math.round((stats.completedProjects / stats.totalProjects) * 100)}% of total
                  </div>
                </div>
                
                {/* Upcoming Projects */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 md:p-4 border border-purple-200 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="status-indicator status-pending" data-tooltip="Upcoming"></span>
                      <h4 className="text-sm font-medium text-purple-800">Upcoming Projects</h4>
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {stats.upcomingProjects}
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2.5 mt-3 data-bar">
                    <div 
                      className="bg-purple-500 h-2.5 rounded-full data-bar-fill" 
                      style={{ width: `${(stats.upcomingProjects / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-purple-700 mt-2 flex justify-end">
                    {Math.round((stats.upcomingProjects / stats.totalProjects) * 100)}% of total
                  </div>
                </div>
              </div>
              
              {/* Role Distribution */}
              <div className="mt-5 md:mt-6 bg-white p-3 md:p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Team Role Distribution
                </h4>
                <div className="space-y-2 md:space-y-3">
                  {Object.entries(stats.roleDistribution).map(([role, count], index) => (
                    <div key={role} className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <span className={`w-3 h-3 rounded-full ${getRoleColor(role).replace('bg-', 'bg-').replace('-100', '-500').replace('text-', 'bg-')} mr-2 flex-shrink-0`}></span>
                      <span className="text-xs text-gray-600 font-medium w-20 md:w-24 flex-shrink-0">{role}</span>
                      <div className="flex-grow mx-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getRoleColor(role).replace('bg-', 'bg-').replace('-100', '-500').replace('text-', 'bg-')} data-bar-fill`}
                            style={{ width: `${(count / stats.totalTeamMembers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-700 mr-2">{count}</span>
                        <span className="text-xs text-gray-500">({Math.round((count / stats.totalTeamMembers) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Optimized loading spinner component
const LoadingSpinner = memo(() => (
  <div className="flex flex-col justify-center items-center h-40 sm:h-64">
    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
      <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <div className="absolute top-3 left-3 right-3 bottom-3 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
      <div className="absolute top-6 left-6 right-6 bottom-6 rounded-full border-4 border-t-indigo-300 border-r-transparent border-b-transparent border-l-transparent animate-spin animation-delay-300"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 animate-pulse-slow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
    <span className="mt-4 text-base sm:text-lg font-medium text-indigo-600 animate-pulse-slow">Loading dashboard...</span>
  </div>
));

// Enhanced error message display component
const ErrorMessage = memo(({ error }) => {
  return (
    <div className="bg-red-50 p-4 rounded-md shadow animate-fade-in mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <div className="flex-shrink-0 flex justify-center mb-4 sm:mb-0">
          <svg className="h-12 w-12 sm:h-10 sm:w-10 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-0 sm:ml-4 text-center sm:text-left">
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-2">Please check your connection and try again.</p>
        </div>
      </div>
    </div>
  );
});

const NewAdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [developerCommits, setDeveloperCommits] = useState({});
  const [activeTab, setActiveTab] = useState('projects');
  const [groups, setGroups] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);
  const [loadMore, setLoadMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const projectsPerPage = 10; // Number of projects to load initially
  const navigate = useNavigate();
  const isScrolled = useScrollEffect();
  
  // Add a mobile detection state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Use session storage for caching data
  const getCachedData = (key) => {
    try {
      const cachedData = sessionStorage.getItem(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.error('Error retrieving cached data:', err);
    }
    return null;
  };
  
  const setCachedData = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Error caching data:', err);
    }
  };

  // Filter projects based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(projects);
    } else {
      const filtered = projects.filter(project => 
        (project.projectName && project.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.groupNumber && project.groupNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.techStack && project.techStack.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.teamMembers && project.teamMembers.some(member => 
          member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setSearchResults(filtered);
    }
  }, [searchTerm, projects]);

  // Show more projects when requested
  const handleShowMore = useCallback(() => {
    // Load more projects but maintain the current visible ones
    const newVisibleProjects = searchResults.slice(0, visibleProjects.length + projectsPerPage);
    setVisibleProjects(newVisibleProjects);
    setLoadMore(newVisibleProjects.length < searchResults.length);
  }, [searchResults, visibleProjects.length, projectsPerPage]);

  // Update visible projects when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      // If we have a selected project, make sure it stays in the visible list
      if (selectedProject) {
        const selectedProjectObj = searchResults.find(p => (p.id || p.groupNumber) === selectedProject);
        if (selectedProjectObj) {
          // Make sure the selected project is included in visible projects
          const initialProjects = searchResults.slice(0, projectsPerPage);
          if (!initialProjects.some(p => (p.id || p.groupNumber) === selectedProject)) {
            // Find the index of the selected project
            const selectedIndex = searchResults.findIndex(p => (p.id || p.groupNumber) === selectedProject);
            if (selectedIndex >= 0) {
              // Include projects up to and including the selected project
              setVisibleProjects(searchResults.slice(0, Math.max(projectsPerPage, selectedIndex + 1)));
              setLoadMore(Math.max(projectsPerPage, selectedIndex + 1) < searchResults.length);
              return;
            }
          }
        }
      }
      
      // Default behavior if no selected project or it's already in the initial set
      setVisibleProjects(searchResults.slice(0, Math.min(projectsPerPage, searchResults.length)));
      setLoadMore(searchResults.length > projectsPerPage);
    } else {
      setVisibleProjects([]);
      setLoadMore(false);
    }
  }, [searchResults, projectsPerPage, selectedProject]);

  // For debugging: log groups when they change
  useEffect(() => {
    if (groups.length > 0) {
      console.log(`Loaded ${groups.length} groups from API`);
    }
  }, [groups]);

  // Optimized fetch groups function
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Always clear cache to ensure fresh data
    sessionStorage.removeItem('dashboard_groups');
    sessionStorage.removeItem('dashboard_projects');
    
    try {
      // First do a direct API call to get a student record for debugging
      const singleStudentResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/students`);
      if (singleStudentResponse.ok) {
        const studentData = await singleStudentResponse.json();
        if (studentData.success && studentData.data && studentData.data.length > 0) {
          const sampleStudent = studentData.data[0];
          console.log("Sample student direct from DB:", sampleStudent);
          console.log("Sample student dates:", {
            startDate: sampleStudent.projectStartDate,
            startDateType: typeof sampleStudent.projectStartDate,
            endDate: sampleStudent.projectEndDate,
            endDateType: typeof sampleStudent.projectEndDate
          });
        }
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/groups`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      console.log("Groups data received:", data); // Debug output
      
      setGroups(data);
      setCachedData('dashboard_groups', data);

      // Transform groups data to project format for display
      const projectsData = [];
      
      // Process each group and extract project information
      if (data && data.length > 0) {
        for (const group of data) {
          // Only process if group has members
          if (group.members && group.members.length > 0) {
            // For each group, find the first member to get their workspace
            const firstMember = group.members[0];
            
            // Extract technology stack from group number (e.g., "MERN 1" -> "MERN")
            const techStack = group.groupNumber.split(' ')[0];
            
            // Get project details directly from the group data
            let projectStartDate = null;
            let projectEndDate = null;
            
            // Extract dates from projectDetails
            if (group.projectDetails) {
              projectStartDate = group.projectDetails.projectStartDate;
              projectEndDate = group.projectDetails.projectEndDate;
              
              // Log the dates for debugging
              console.log(`Group ${group.groupNumber} dates:`, {
                startDate: projectStartDate,
                endDate: projectEndDate
              });
            } else {
              console.log(`Group ${group.groupNumber} has no project details`);
            }
            
            const projectName = group.projectDetails?.projectName || `${group.groupNumber} Project`;
            
            // Gather all team members from all students in the group
            const allTeamMembers = [];
            const processedNames = new Set(); // Track names to avoid duplicates
            
            // First, add all registered students
            group.members.forEach(student => {
              if (!processedNames.has(student.name)) {
                // Add the student as a team member
                allTeamMembers.push({
                  name: student.name,
                  role: student.role || 'Developer',
                  email: student.email,
                  isOwner: student === firstMember, // First member is considered the owner
                  studentId: student._id
                });
                processedNames.add(student.name);
              }
              
              // Then add their additional team members if any
              if (student.teamMembers && student.teamMembers.length > 0) {
                student.teamMembers.forEach(member => {
                  if (!processedNames.has(member.name)) {
                    allTeamMembers.push({
                      name: member.name,
                      role: member.role || 'Developer',
                      isOwner: false
                    });
                    processedNames.add(member.name);
                  }
                });
              }
            });
            
            // Create project object with all the data
            const projectData = {
              id: group.groupNumber,
              projectName: projectName,
              startDate: projectStartDate,
              endDate: projectEndDate,
              techStack: techStack,
              workspaceName: firstMember.workspaceName,
              token: firstMember.token,
              teamMembers: allTeamMembers,
              groupNumber: group.groupNumber
            };
            
            console.log("Project dates:", {
              group: group.groupNumber,
              startDate: projectData.startDate,
              endDate: projectData.endDate,
              members: projectData.teamMembers.length
            });
            
            projectsData.push(projectData);
          }
        }
      }
      
      console.log("Final projects data:", projectsData.length); // Debug output
      
      setProjects(projectsData);
      setCachedData('dashboard_projects', projectsData);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError('Failed to load projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if admin is logged in
    const adminInfo = localStorage.getItem('adminInfo');
    if (!adminInfo) {
      navigate('/adminlogin');
      return;
    }

    // Clear any cached data to ensure fresh load
    sessionStorage.removeItem('dashboard_groups');
    sessionStorage.removeItem('dashboard_projects');

    // Fetch data
    fetchGroups();
    
    // Cleanup animation classes when component unmounts
    return () => {
      document.querySelectorAll('.animate-fade-in, .animate-slide-in').forEach(el => {
        el.classList.remove('animate-fade-in', 'animate-slide-in');
      });
    };
  }, [navigate, fetchGroups]);

  const handleProjectSelect = useCallback((projectId) => {
    // If clicking on the same project that's already selected, close it
    if (selectedProject === projectId) {
      setSelectedProject(null);
    } else {
      // Otherwise, select the new project
      setSelectedProject(projectId);
      
      // Find the selected project in the search results
      const selectedProjectObj = searchResults.find(p => (p.id || p.groupNumber) === projectId);
      if (selectedProjectObj) {
        // Make sure the selected project is in the visible projects list
        if (!visibleProjects.some(p => (p.id || p.groupNumber) === projectId)) {
          // Find the index of the selected project in search results
          const selectedIndex = searchResults.findIndex(p => (p.id || p.groupNumber) === projectId);
          if (selectedIndex >= 0) {
            // Update visible projects to include the selected project
            setVisibleProjects(searchResults.slice(0, Math.max(visibleProjects.length, selectedIndex + 1)));
          }
        }
      }
      
      // Scroll to the selected project after a short delay to allow rendering
      setTimeout(() => {
        const element = document.getElementById(`project-details-${projectId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    // Clear existing commits data when toggling
    if (selectedProject === projectId) {
      setDeveloperCommits({});
    }
  }, [selectedProject, searchResults, visibleProjects]);

  // Function to fetch repository contributors and update mappings
  const fetchRepositoryContributors = useCallback(async (workspaceName, repoSlug) => {
    try {
      console.log(`Fetching contributors for ${workspaceName}/${repoSlug}`);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/repository-contributors/${workspaceName}/${repoSlug}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch repository contributors');
      }
      
      const data = await response.json();
      console.log(`Found ${data.contributors.length} contributors and ${data.teamMembers.length} team members`);
      
      // Store the mappings in session storage for reuse
      const mappingsKey = `contributor_mappings_${workspaceName}_${repoSlug}`;
      setCachedData(mappingsKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching repository contributors:', error);
      return null;
    }
  }, [setCachedData]);

  // Enhanced function to fetch developer commits with automatic name mapping
  const fetchDeveloperCommitsWithMapping = useCallback(async (workspaceName, developer) => {
    if (developerCommits[developer]) return; // Skip if already loaded
    
    // First, set a loading state for this developer
    setDeveloperCommits(prev => ({
      ...prev,
      [developer]: 'loading'
    }));
    
    // Check cache first
    const cacheKey = `commits_${workspaceName}_${developer}`;
    const cachedCommits = getCachedData(cacheKey);
    
    if (cachedCommits) {
      setDeveloperCommits(prev => ({
        ...prev,
        [developer]: cachedCommits
      }));
      return;
    }
    
    try {
      console.log(`Fetching commits for ${developer} in workspace ${workspaceName}`);
      
      // Find the first repository for this workspace
      const reposCacheKey = `repos_${workspaceName}`;
      let repositories = getCachedData(reposCacheKey);
      
      if (!repositories) {
        console.log(`No cached repos for ${workspaceName}, fetching now`);
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/workspace-projects/${workspaceName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        repositories = await response.json();
        setCachedData(reposCacheKey, repositories);
      }
      
      if (repositories.length === 0) {
        console.log(`No repositories found for ${workspaceName}`);
        return setDeveloperCommits(prev => ({
          ...prev,
          [developer]: []
        }));
      }
      
      // Use the first repository
      const repoSlug = repositories[0].slug;
      console.log(`Using repository: ${repoSlug} for developer: ${developer}`);
      
      // First check if we already have contributor mappings
      const mappingsKey = `contributor_mappings_${workspaceName}_${repoSlug}`;
      let mappings = getCachedData(mappingsKey);
      
      if (!mappings) {
        // If not, fetch the contributor mappings first
        mappings = await fetchRepositoryContributors(workspaceName, repoSlug);
      }
      
      // Now fetch commits for this developer with potential Bitbucket username
      const commitsResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/developer-commits/${workspaceName}/${repoSlug}/${encodeURIComponent(developer)}`
      );
      
      if (!commitsResponse.ok) {
        throw new Error('Failed to fetch developer commits');
      }
      
      const commitsData = await commitsResponse.json();
      console.log(`Received ${commitsData.length} commits for ${developer}`);
      
      // Cache the commits data
      setCachedData(cacheKey, commitsData);
      
      // Update state with the fetched commits
      setDeveloperCommits(prev => ({
        ...prev,
        [developer]: commitsData
      }));
    } catch (err) {
      console.error('Error fetching developer commits:', err);
      setDeveloperCommits(prev => ({
        ...prev,
        [developer]: []
      }));
    }
  }, [developerCommits, getCachedData, setCachedData, fetchRepositoryContributors]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminInfo');
    // Clear session storage cache on logout
    sessionStorage.clear();
    navigate('/adminlogin');
  }, [navigate]);

  const navigateToAnalytics = useCallback((workspaceName, repoSlug) => {
    navigate(`/admin/analytics/${workspaceName}/${repoSlug}`);
  }, [navigate]);

  const navigateToOldDashboard = useCallback(() => {
    navigate('/admin/dashboard');
  }, [navigate]);

  const navigateToManage = useCallback(() => {
    navigate('/admin/manage');
  }, [navigate]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Try to create a date from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      // Format the date nicely
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err, dateString);
      return 'Error';
    }
  }, []);

  // Function to get a color based on role
  const getRoleColor = useCallback((role) => {
    switch (role) {
      case 'PM': return 'bg-purple-100 text-purple-800';
      case 'QA': return 'bg-green-100 text-green-800';
      case 'Developer': return 'bg-blue-100 text-blue-800';
      case 'DevOps': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Function to get a color based on technology stack
  const getTechStackColor = useCallback((stack) => {
    switch (stack) {
      case 'MERN': return 'bg-blue-500';
      case 'JAVA': return 'bg-red-500';
      case 'C#': return 'bg-purple-500';
      case 'PYTHON': return 'bg-yellow-500';
      case 'PHP': return 'bg-indigo-500';
      case 'Flutter': return 'bg-cyan-500';
      case 'DevOps': return 'bg-orange-500';
      case 'default': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, []);
  
  // Function to get status class based on project timeline
  const getStatusClass = useCallback((project) => {
    if (!project.startDate || !project.endDate) return 'status-pending';
    
    try {
      const start = new Date(project.startDate).getTime();
      const end = new Date(project.endDate).getTime();
      const now = new Date().getTime();
      
      if (isNaN(start) || isNaN(end)) {
        return 'status-pending';
      }
      
      if (now > end) {
        return 'status-completed';
      } else if (now < start) {
        return 'status-pending';
      } else {
        const total = end - start;
        const progress = now - start;
        const percentage = Math.max(0, Math.min(100, (progress / total) * 100));
        
        if (percentage >= 80) {
          return 'status-error';
        } else {
          return 'status-active';
        }
      }
    } catch (e) {
      return 'status-pending';
    }
  }, []);

  // Function to refresh project details from the API
  const refreshProjectDetails = useCallback(async (groupNumber) => {
    try {
      // Clear any cached commit data for this group
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('commits_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      // Reset the commits state for this group
      setDeveloperCommits({});
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/project-details/${groupNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project details for group ${groupNumber}`);
      }
      
      const projectData = await response.json();
      console.log("Refreshed project details:", projectData);
      
      // Update the projects array with this new data
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.groupNumber === groupNumber) {
            return {
              ...project,
              projectName: projectData.projectName,
              startDate: projectData.projectStartDate,
              endDate: projectData.projectEndDate,
              teamMembers: projectData.teamMembers
            };
          }
          return project;
        })
      );
    } catch (err) {
      console.error(`Error refreshing project details for group ${groupNumber}:`, err);
    }
  }, []);

  return (
    <div className="dashboard-bg min-h-screen gpu-accelerated">
      {/* Enhanced Header */}
      <header className={`dashboard-header transition-all duration-300 ease-in-out ${isScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-2.5 rounded-xl shadow-lg animate-subtle-float">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold premium-title">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Analytics & Project Management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={navigateToOldDashboard}
                className="btn-secondary flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="hidden sm:inline">Classic View</span>
              </button>
              <button
                onClick={navigateToManage}
                className="btn-secondary flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline">Manage Students</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-primary flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content responsive-padding">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Tabs */}
          <div className="mb-8 relative">
            <nav className="flex space-x-2 bg-gray-50/80 p-1.5 rounded-lg shadow-sm backdrop-blur-sm overflow-x-auto tab-container">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 sm:px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 dashboard-tab flex-shrink-0 ${
                  activeTab === 'projects'
                    ? 'bg-white text-indigo-600 shadow-md z-10 active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Projects</span>
                <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 sm:px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 dashboard-tab flex-shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-white text-indigo-600 shadow-md z-10 active'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </button>
            </nav>
          </div>
          
          {/* Search Bar - Enhanced */}
          {!loading && !error && activeTab === 'projects' && projects.length > 0 && (
            <div className="mb-6 animate-fade-in search-container">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-12 pr-10 py-3 w-full rounded-xl search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="search-icon left-4">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button 
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchTerm('')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-white/90 rounded-lg p-2 shadow-sm backdrop-blur-sm flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Found:</span>
                    <span className="text-xs font-medium text-indigo-600">{searchResults.length}</span>
                  </div>
                  
                  <button 
                    className="bg-white/90 p-2 rounded-lg shadow-sm backdrop-blur-sm hover:bg-white transition-all" 
                    title="Refresh data"
                    onClick={fetchGroups}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {searchTerm && searchResults.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl text-yellow-700 text-sm flex items-center glass-card">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No projects match your search criteria
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white shadow-xl rounded-xl p-4 sm:p-8 text-center animate-fade-in glass-card premium-card-shadow">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white shadow-xl rounded-xl p-4 sm:p-8 animate-fade-in glass-card premium-card-shadow">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse-slow"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-20 w-20 sm:h-24 sm:w-24 text-red-500 p-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-center premium-title">Error Loading Data</h3>
                <p className="mt-2 text-sm text-gray-500 text-center premium-subtitle max-w-lg mx-auto mb-4">{error}</p>
                
                <ErrorMessage error="There was an error connecting to the server. This could be due to network issues or the server might be temporarily unavailable." />
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={fetchGroups}
                    className="btn-primary inline-flex items-center px-6 py-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Projects Content */}
          {!loading && !error && activeTab === 'projects' && projects.length > 0 && (
            <div className="bg-white shadow-xl rounded-xl overflow-hidden animate-slide-in glass-card">
              <div className="w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Project Management
                  </h3>
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-indigo-600">{visibleProjects.length}</span> of <span className="font-medium text-indigo-600">{searchResults.length}</span> projects
                  </div>
                </div>
                
                {/* Desktop table view */}
                {!isMobile && (
                  <table className="min-w-full divide-y divide-gray-200 table-fixed analytics-table">
                    <thead className="bg-gray-50/90 backdrop-blur-sm">
                      <tr>
                        <th scope="col" className="w-1/4 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Project
                          </div>
                        </th>
                        <th scope="col" className="w-1/6 px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Tech Stack
                          </div>
                        </th>
                        <th scope="col" className="w-1/6 px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider responsive-hidden">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Timeline
                          </div>
                        </th>
                        <th scope="col" className="w-1/6 px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Group
                          </div>
                        </th>
                        <th scope="col" className="w-1/4 px-3 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-end">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visibleProjects.map((project, index) => (
                        <ProjectRow
                          key={project.id || project.groupNumber}
                          project={project}
                          index={index}
                          selectedProject={selectedProject}
                          handleProjectSelect={handleProjectSelect}
                          navigateToAnalytics={navigateToAnalytics}
                          getRoleColor={getRoleColor}
                          getTechStackColor={getTechStackColor}
                          formatDate={formatDate}
                          developerCommits={developerCommits}
                          fetchDeveloperCommits={fetchDeveloperCommitsWithMapping}
                          refreshProjectDetails={refreshProjectDetails}
                          getStatusClass={getStatusClass}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
                
                {/* Mobile card view */}
                {isMobile && (
                  <div className="p-2 mobile-card-view">
                    {visibleProjects.map((project, index) => (
                      <MobileProjectCard
                        key={project.id || project.groupNumber}
                        project={project}
                        index={index}
                        selectedProject={selectedProject}
                        handleProjectSelect={handleProjectSelect}
                        navigateToAnalytics={navigateToAnalytics}
                        getRoleColor={getRoleColor}
                        getTechStackColor={getTechStackColor}
                        formatDate={formatDate}
                        getStatusClass={getStatusClass}
                        refreshProjectDetails={refreshProjectDetails}
                        developerCommits={developerCommits}
                        fetchDeveloperCommits={fetchDeveloperCommitsWithMapping}
                      />
                    ))}
                  </div>
                )}
                
                {loadMore && (
                  <div className="flex justify-center py-5 bg-gray-50/70 border-t">
                    <button 
                      onClick={handleShowMore}
                      className="btn-primary flex items-center px-6 py-2.5 rounded-xl group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>Load More Projects</span>
                      <span className="ml-2 bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {searchResults.length - visibleProjects.length} more
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Projects State */}
          {!loading && !error && projects.length === 0 && activeTab === 'projects' && (
            <div className="bg-white shadow-xl rounded-xl p-8 text-center animate-fade-in glass-card premium-card-shadow">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mx-auto">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse-slow"></div>
                  <svg className="absolute inset-0 w-28 h-28 text-indigo-500 mx-auto animate-subtle-float p-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                
                <h3 className="mt-6 text-2xl font-medium premium-title">No Projects Available</h3>
                <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto premium-subtitle">
                  Your dashboard is ready but there are no projects to display. Add students with project details to start tracking progress and analytics.
                </p>
                <div className="mt-8">
                  <button
                    onClick={navigateToManage}
                    className="btn-primary inline-flex items-center px-6 py-3 rounded-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {!loading && !error && activeTab === 'analytics' && (
            <AnalyticsSection 
              projects={projects} 
              navigateToManage={navigateToManage} 
              getTechStackColor={getTechStackColor} 
              getRoleColor={getRoleColor} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default NewAdminDashboard; 