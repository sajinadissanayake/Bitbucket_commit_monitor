import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Code, GitBranch, Clock } from 'lucide-react';

const ContributorsDashboard = () => {
  const [contributors, setContributors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimize data fetching with useCallback
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

  // Memoize the date formatting function
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

  // Memoize grouped contributors to prevent recomputation
  const groupedContributors = useMemo(() => {
    return contributors.reduce((acc, contributor) => {
      const name = contributor.author.split('<')[0].trim();
      if (!acc[name]) {
        acc[name] = {
          name,
          avatar: name[0].toUpperCase(),
          projects: {}
        };
      }
      
      contributor.commits.forEach(commit => {
        if (!acc[name].projects[commit.projectName]) {
          acc[name].projects[commit.projectName] = [];
        }
        acc[name].projects[commit.projectName].push(commit);
      });
      
      // Sort commits by date for each project
      Object.values(acc[name].projects).forEach(commits => {
        commits.sort((a, b) => new Date(b.date) - new Date(a.date));
      });
      
      return acc;
    }, {});
  }, [contributors]);

  // Memoize filtered contributors
  const filteredContributors = useMemo(() => {
    return Object.values(groupedContributors)
      .filter(contributor => contributor.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(contributor => ({
        ...contributor,
        // Sort projects by most recent commit
        projects: Object.fromEntries(
          Object.entries(contributor.projects)
            .sort(([, aCommits], [, bCommits]) => 
              new Date(bCommits[0].date) - new Date(aCommits[0].date)
            )
        )
      }));
  }, [groupedContributors, searchQuery]);

  // Handle search input changes
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Skeleton Stats Section */}
          <div className="relative text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 rounded-3xl"></div>
            <div className="relative p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center items-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-xl p-6 flex items-center space-x-4 animate-pulse">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-blue-200 rounded"></div>
                    </div>
                    <div className="w-full">
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Skeleton Search Bar */}
          <div className="relative animate-pulse">
            <div className="h-14 bg-white rounded-xl shadow-lg"></div>
          </div>
          
          {/* Skeleton Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="h-12 bg-blue-50 rounded-t-xl"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border-t border-gray-100 h-20 animate-pulse flex">
                <div className="w-1/4 p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="w-1/4 p-4">
                  <div className="h-8 bg-gray-200 rounded-full w-3/4"></div>
                </div>
                <div className="w-1/4 p-4">
                  <div className="h-14 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="w-1/4 p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Centered Stats Section */}
        <div className="relative text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 rounded-xl md:rounded-3xl"></div>
          <div className="relative p-3 md:p-8 space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 justify-center items-center">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-3 md:p-6 flex items-center space-x-3 md:space-x-4 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                  <Users className="w-5 h-5 md:w-8 md:h-8 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Total Contributors</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{Object.keys(groupedContributors).length}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-3 md:p-6 flex items-center space-x-3 md:space-x-4 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-indigo-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                  <Code className="w-5 h-5 md:w-8 md:h-8 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Total Commits</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">
                    {contributors.reduce((sum, c) => sum + c.commits.length, 0)}
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-3 md:p-6 flex items-center space-x-3 md:space-x-4 transform hover:scale-105 transition-transform duration-300 sm:col-span-2 md:col-span-1">
                <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                  <GitBranch className="w-5 h-5 md:w-8 md:h-8 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Active Projects</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">
                    {new Set(contributors.flatMap(c => c.commits.map(commit => commit.projectName))).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-8 md:pl-10 pr-3 py-3 md:py-4 border border-gray-200 rounded-lg md:rounded-xl bg-white shadow-md md:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-300 text-sm md:text-base"
            placeholder="Search contributors..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
  
        {/* Table Section - Mobile optimized */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl overflow-hidden border border-gray-100">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">Contributor</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">Project</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">Most Recent Commit</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-600 w-1/4">Latest Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContributors.flatMap((contributor) => 
                  Object.entries(contributor.projects).map(([projectName, commits], projectIndex) => (
                    <tr 
                      key={`${contributor.name}-${projectName}`} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {projectIndex === 0 ? (
                        <td className="px-3 md:px-6 py-4" rowSpan={Object.keys(contributor.projects).length}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs md:text-sm font-bold">{contributor.avatar}</span>
                            </div>
                            <div className="font-medium text-sm md:text-base text-gray-900 truncate">{contributor.name}</div>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-3 md:px-6 py-4">
                        <div className="space-y-2">
                          <span className="px-2 md:px-4 py-1 md:py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs md:text-sm font-medium shadow-sm truncate inline-block max-w-full">
                            {projectName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="space-y-3">
                          {commits.slice(0, 1).map((commit) => (
                            <div 
                              key={commit.hash}
                              className="p-2 rounded-lg bg-blue-50 border-l-4 border-blue-500"
                            >
                              <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">{commit.message}</p>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                {formatDate(commit.date)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="text-xs md:text-sm">
                          <div className="font-medium text-gray-900">
                            {formatDate(commits[0].date)}
                          </div>
                          <div className="text-gray-500 mt-1">
                            Latest commit
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredContributors.flatMap((contributor) => 
              Object.entries(contributor.projects).map(([projectName, commits], projectIndex) => (
                <div 
                  key={`mobile-${contributor.name}-${projectName}`}
                  className="p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">{contributor.avatar}</span>
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate max-w-[150px]">{contributor.name}</div>
                    </div>
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-medium shadow-sm truncate max-w-[120px]">
                      {projectName}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {commits.slice(0, 1).map((commit) => (
                      <div 
                        key={`mobile-commit-${commit.hash}`}
                        className="p-2 rounded-lg bg-blue-50 border-l-4 border-blue-500"
                      >
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">{commit.message}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          {formatDate(commit.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs">
                    <div className="font-medium text-gray-900">
                      Last active: {formatDate(commits[0].date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ContributorsDashboard);
