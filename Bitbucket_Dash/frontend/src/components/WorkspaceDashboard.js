import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Code, GitBranch, Clock, FolderGit, Briefcase, Layout } from 'lucide-react';

// Memoized commit component to prevent unnecessary re-renders
const CommitItem = React.memo(({ commit, formatDate }) => (
  <div 
    key={commit.hash}
    className="p-3 rounded-lg border-l-4 transition-all duration-200 hover:scale-[1.01] bg-blue-50 border-blue-500 shadow-sm"
  >
    <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">{commit.message}</p>
    <div className="flex items-center mt-1.5 text-xs text-gray-500">
      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
      {formatDate(commit.date)}
    </div>
  </div>
));

// Mobile workspace card component
const MobileWorkspaceCard = React.memo(({ workspace, project, contributor, formatDate }) => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
    <div className="flex justify-between items-start">
      <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-xs font-medium shadow-sm truncate max-w-[180px]">
        <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="truncate">{workspace.workspaceName}</span>
      </span>
    </div>
    
    <div className="border-t border-gray-100 pt-2 mt-2">
      <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-medium shadow-sm truncate max-w-full mb-3">
        <FolderGit className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="truncate">{project.projectName}</span>
      </span>
      
      <div className="flex items-center space-x-2 mt-2">
        <div className="w-7 h-7 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
          <span className="text-white text-xs font-bold">{contributor.avatar}</span>
        </div>
        <div className="font-medium text-xs text-gray-900 truncate">{contributor.name}</div>
      </div>
    </div>
    
    <div className="border-t border-gray-100 pt-2">
      {contributor.commits.slice(0, 1).map((commit) => (
        <div 
          key={commit.hash}
          className="p-2 rounded-lg bg-blue-50 border-l-4 border-blue-500 shadow-sm"
        >
          <p className="text-xs font-medium text-gray-900 line-clamp-2">{commit.message}</p>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            {formatDate(commit.date)}
          </div>
        </div>
      ))}
    </div>
  </div>
));

const WorkspaceDashboard = () => {
  const [contributors, setContributors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimize fetch with useCallback
  const fetchContributors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/all-contributors?limit=1`);
      if (!response.ok) throw new Error('Failed to fetch contributors');
      const data = await response.json();
      setContributors(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load contributors data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributors();
  }, [fetchContributors]);

  // Memoize date formatting
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  // Memoize grouped workspaces data
  const groupedByWorkspaces = useMemo(() => {
    return contributors.reduce((acc, contributor) => {
      contributor.commits.forEach(commit => {
        const workspaceName = commit.workspaceName || 'Default Workspace';
        
        if (!acc[workspaceName]) {
          acc[workspaceName] = {
            workspaceName,
            projects: {}
          };
        }
        
        if (!acc[workspaceName].projects[commit.projectName]) {
          acc[workspaceName].projects[commit.projectName] = {
            projectName: commit.projectName,
            contributors: {}
          };
        }
        
        const name = contributor.author.split('<')[0].trim();
        if (!acc[workspaceName].projects[commit.projectName].contributors[name]) {
          acc[workspaceName].projects[commit.projectName].contributors[name] = {
            name,
            avatar: name[0].toUpperCase(),
            commits: []
          };
        }
        
        acc[workspaceName].projects[commit.projectName].contributors[name].commits.push(commit);
      });
      
      return acc;
    }, {});
  }, [contributors]);

  // Memoize filtered workspaces
  const filteredWorkspaces = useMemo(() => {
    return Object.values(groupedByWorkspaces)
      .filter(workspace => 
        workspace.workspaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(workspace.projects).some(project => 
          project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Object.values(project.contributors).some(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      );
  }, [groupedByWorkspaces, searchQuery]);

  // Memoize stats calculation
  const stats = useMemo(() => ({
    totalWorkspaces: filteredWorkspaces.length,
    totalProjects: filteredWorkspaces.reduce((acc, workspace) => 
      acc + Object.keys(workspace.projects).length, 0
    ),
    totalContributors: new Set(
      filteredWorkspaces.flatMap(workspace => 
        Object.values(workspace.projects).flatMap(project => 
          Object.values(project.contributors).map(c => c.name)
        )
      )
    ).size,
    totalCommits: filteredWorkspaces.reduce((acc, workspace) => 
      acc + Object.values(workspace.projects).reduce((sum, project) => 
        sum + Object.values(project.contributors)
          .reduce((commitSum, contributor) => commitSum + contributor.commits.length, 0)
        , 0)
      , 0)
  }), [filteredWorkspaces]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Skeleton Stats Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-lg md:rounded-xl p-4 bg-gray-100 h-24 md:h-32">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/4"></div>
              </div>
            ))}
          </div>

          {/* Skeleton Search Bar */}
          <div className="relative mt-4 md:mt-6">
            <div className="h-12 bg-gray-100 rounded-xl"></div>
          </div>
        </div>

        {/* Skeleton Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 space-y-3 animate-pulse">
              <div className="h-6 bg-gray-100 rounded-full w-1/2"></div>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="h-6 bg-gray-100 rounded-full w-3/4 mb-3"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-16 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-12 bg-gray-50 rounded-t-xl"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="border-t border-gray-100 animate-pulse">
              <div className="grid grid-cols-4 p-4">
                <div className="h-8 bg-gray-100 rounded-full w-3/4"></div>
                <div className="h-8 bg-gray-100 rounded-full w-3/4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-16 bg-gray-100 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 p-4 rounded-lg text-red-700 shadow-lg">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Stats Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg md:rounded-xl p-3 md:p-5 text-white transform transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs md:text-sm uppercase tracking-wider">Workspaces</p>
                  <p className="text-lg md:text-3xl font-bold mt-1">{stats.totalWorkspaces}</p>
                </div>
                <Layout className="h-7 w-7 md:h-12 md:w-12 text-emerald-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl p-3 md:p-5 text-white transform transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm uppercase tracking-wider">Total Projects</p>
                  <p className="text-lg md:text-3xl font-bold mt-1">{stats.totalProjects}</p>
                </div>
                <FolderGit className="h-7 w-7 md:h-12 md:w-12 text-blue-200 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl p-3 md:p-5 text-white transform transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs md:text-sm uppercase tracking-wider">Contributors</p>
                  <p className="text-lg md:text-3xl font-bold mt-1">{stats.totalContributors}</p>
                </div>
                <Users className="h-7 w-7 md:h-12 md:w-12 text-indigo-200 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg md:rounded-xl p-3 md:p-5 text-white transform transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs md:text-sm uppercase tracking-wider">Total Commits</p>
                  <p className="text-lg md:text-3xl font-bold mt-1">{stats.totalCommits}</p>
                </div>
                <GitBranch className="h-7 w-7 md:h-12 md:w-12 text-purple-200 opacity-80" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4 md:mt-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-8 md:pl-11 pr-3 py-2.5 md:py-3.5 border border-gray-200 rounded-lg md:rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
              placeholder="Search workspaces, projects, or contributors..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {filteredWorkspaces.flatMap(workspace => 
            Object.values(workspace.projects).flatMap(project => 
              Object.values(project.contributors).map((contributor, index) => (
                <MobileWorkspaceCard 
                  key={`mobile-${workspace.workspaceName}-${project.projectName}-${contributor.name}`} 
                  workspace={workspace}
                  project={project}
                  contributor={contributor} 
                  formatDate={formatDate}
                />
              ))
            )
          )}
        </div>

        {/* Desktop Table Section */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="sticky top-0 px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        <span>Workspace</span>
                      </div>
                    </th>
                    <th className="sticky top-0 px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <FolderGit className="h-4 w-4 text-gray-500" />
                        <span>Project</span>
                      </div>
                    </th>
                    <th className="sticky top-0 px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Contributors</span>
                      </div>
                    </th>
                    <th className="sticky top-0 px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <Code className="h-4 w-4 text-gray-500" />
                        <span>Most Recent Commit</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredWorkspaces.map(workspace => 
                    Object.values(workspace.projects).map((project, projectIndex) =>
                      Object.values(project.contributors).map((contributor, contributorIndex) => (
                        <tr 
                          key={`${workspace.workspaceName}-${project.projectName}-${contributor.name}`}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          {projectIndex === 0 && contributorIndex === 0 && (
                            <td className="px-3 md:px-6 py-4 pl-3 md:pl-8" rowSpan={Object.values(workspace.projects).reduce((acc, p) => acc + Object.keys(p.contributors).length, 0)}>
                              <span className="inline-flex items-center px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-xs md:text-sm font-medium shadow-sm truncate max-w-full">
                                <Briefcase className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
                                <span className="truncate">{workspace.workspaceName}</span>
                              </span>
                            </td>
                          )}
                          {contributorIndex === 0 && (
                            <td className="px-3 md:px-6 py-4" rowSpan={Object.keys(project.contributors).length}>
                              <span className="inline-flex items-center px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs md:text-sm font-medium truncate max-w-full">
                                <FolderGit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
                                <span className="truncate">{project.projectName}</span>
                              </span>
                            </td>
                          )}
                          <td className="px-3 md:px-6 py-4">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                                <span className="text-white text-xs md:text-sm font-bold">{contributor.avatar}</span>
                              </div>
                              <div className="font-medium text-xs md:text-base text-gray-900 truncate">{contributor.name}</div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="space-y-3">
                              {contributor.commits.slice(0, 1).map((commit) => (
                                <CommitItem key={commit.hash} commit={commit} formatDate={formatDate} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkspaceDashboard);
