import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ContributorsDashboard from './ContributorsDashboard';
import ProjectDashboard from './ProjectDashboard';
import WorkspaceDashboard from './WorkspaceDashboard';
import Manage from './Admin/Manage';

// CSS animations for premium look
const styles = {
  '@keyframes fadeIn': {
    '0%': { opacity: 0, transform: 'translateY(10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.6 }
  },
  '@keyframes bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-5px)' }
  },
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' }
  }
};

const AdminDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [projects, setProjects] = useState({});
  const [commits, setCommits] = useState({});
  const [allCommits, setAllCommits] = useState({});
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [dashboardView, setDashboardView] = useState('groups');
  const [projectView, setprojectView] = useState('projects');
  // New state for switching between views
  const navigate = useNavigate();


  //search 
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredGroups = groups.filter((group) =>
    group.groupNumber.toString().toLowerCase().includes(searchQuery) ||
    group.members.some((member) =>
      member.name.toLowerCase().includes(searchQuery)
    )
  );

  //search end


  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    setSelectedProject(null);
    setActiveView(null);
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load groups');
      setLoading(false);
    }
  };



  // Keep all your existing functions
  const fetchProjects = async (groupNumber, workspaceName, token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/workspace-projects/${workspaceName}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects((prev) => ({ ...prev, [groupNumber]: data }));
      setSelectedProject(null);
      setActiveView(null);
    } catch (err) {
      setError(`Failed to load projects for group ${groupNumber} check the token or workspace name`);
    }
  };

  const fetchLastCommits = async (workspaceName, repoSlug) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/commits/${workspaceName}/${repoSlug}?limit=1`);
      if (!response.ok) throw new Error('Failed to fetch commits');
      console.log(repoSlug);
      const data = await response.json();
      setCommits((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
    } catch (err) {
      setError('Failed to load commits');
    }
  };

  const fetchAllCommits = async (workspaceName, repoSlug) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/all-commits/${workspaceName}/${repoSlug}`);
      if (!response.ok) throw new Error('Failed to fetch all commits');
      const data = await response.json();
      setAllCommits((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
    } catch (err) {
      setError('Failed to load all commits');
    }
  };

  const fetchContributions = async (workspaceName, repoSlug) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/contributions/${workspaceName}/${repoSlug}`);
      if (!response.ok) throw new Error('Failed to fetch contributions');
      const data = await response.json();
      setContributions((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
    } catch (err) {
      setError('Failed to load contributions');
    }
  };

  const handleGroupSelect = (groupNumber) => {
    setSelectedGroup(selectedGroup === groupNumber ? null : groupNumber);
    setSelectedProject(null);
    setActiveView(null);
  };

  const handleProjectSelect = (projectKey, action, workspaceName, repoSlug) => {
    setSelectedProject(projectKey);
    setActiveView(action);
    if (action === 'commits') {
      fetchLastCommits(workspaceName, repoSlug);
    } else if (action === 'allCommits') {
      fetchAllCommits(workspaceName, repoSlug);
    } else if (action === 'contributions') {
      fetchContributions(workspaceName, repoSlug);
    }
  
  };
  // New component to render all commits
  const AllCommitsView = ({ commits }) => {
    if (!commits) return null;

    // Extract just the name part from author string (remove email)
    const formatAuthor = (authorString) => {
      if (!authorString) return 'Unknown';
      // Extract name from "Name <email@example.com>" format
      const match = authorString.match(/^([^<]+)/);
      return match ? match[1].trim() : authorString;
    };

    return (
      <div className="mt-6 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md sm:shadow-xl transition-all duration-300">
        <h4 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 border-b border-gray-200 pb-4">
          Repository Timeline
        </h4>
        
        {/* Mobile view - cards */}
        <div className="sm:hidden space-y-4">
          {commits.map((commit) => (
            <div key={commit.hash} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {commit.hash.substring(0, 7)}
                </span>
                <div className="text-xs text-gray-500">
                  {new Date(commit.date).toLocaleDateString()}
                </div>
              </div>
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm text-gray-800 mb-2">{commit.message}</p>
                <div className="flex items-center mt-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-gray-600">
                      {formatAuthor(commit.author).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-700">{formatAuthor(commit.author)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop view - table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commits.map((commit) => (
                <tr key={commit.hash} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {commit.hash.substring(0, 7)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-800 font-medium truncate max-w-[300px]">{commit.message}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {formatAuthor(commit.author).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-700">{formatAuthor(commit.author)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">
                      <div className="font-medium">{new Date(commit.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{new Date(commit.date).toLocaleTimeString()}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ContributionStats = ({ data, repoKey }) => {
    // Always initialize hooks at the top level
    const [chartWidth, setChartWidth] = useState(800);
    const chartContainerRef = useRef(null);
    
    useEffect(() => {
      const updateChartWidth = () => {
        if (chartContainerRef.current) {
          setChartWidth(chartContainerRef.current.offsetWidth - 30); // Subtract padding
        }
      };

      // Initial width
      updateChartWidth();

      // Update on resize
      window.addEventListener('resize', updateChartWidth);
      return () => window.removeEventListener('resize', updateChartWidth);
    }, []);
    
    if (!data) return null;

    const statCards = [
      { title: "Total Commits", value: data.totalCommits, color: "from-blue-500 to-blue-600" },
      { title: "Today's Commits", value: data.todayCommits, color: "from-green-500 to-green-600" },
      { title: "Last Week", value: data.lastWeekCommits, color: "from-purple-500 to-purple-600" },
      { title: "Last Month", value: data.lastMonthCommits, color: "from-red-500 to-red-600" }
    ];

    return (
      <div className="mt-6 sm:mt-8 p-4 sm:p-8 bg-white rounded-xl shadow-lg sm:shadow-xl">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8 text-gray-800">Repository Analytics</h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-12">
          {statCards.map((stat, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg">
              <div className={`p-4 sm:p-6 bg-gradient-to-r ${stat.color} text-white transform transition-transform duration-300 hover:scale-105`}>
                <p className="text-xs sm:text-sm font-medium opacity-80">{stat.title}</p>
                <p className="text-xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="space-y-6 sm:space-y-12">
          <div className="bg-gray-50 p-3 sm:p-6 rounded-xl">
            <h4 className="text-md sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Contributions by Author</h4>
            <div className="h-60 sm:h-80" ref={chartContainerRef}>
              <BarChart
                width={chartWidth}
                height={window.innerWidth < 640 ? 200 : 300}
                data={Object.entries(data.authorStats).map(([author, stats]) => ({
                  author: author.split('<')[0].trim().substring(0, 10), // Truncate long names on mobile
                  commits: stats.totalCommits,
                  percentage: parseFloat(stats.percentage),
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="author" angle={window.innerWidth < 640 ? -45 : 0} textAnchor={window.innerWidth < 640 ? "end" : "middle"} height={60} />
                <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="commits" fill="#6366f1" name="Total Commits" radius={[4, 4, 0, 0]} />
                {/* <Bar yAxisId="right" dataKey="percentage" fill="#22c55e" name="Percentage %" radius={[4, 4, 0, 0]} /> */}
              </BarChart>
            </div>
          </div>

          <div className="bg-gray-50 p-3 sm:p-6 rounded-xl">
            <h4 className="text-md sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Commit Activity Timeline</h4>
            <div className="h-60 sm:h-80">
              <LineChart
                width={chartWidth}
                height={window.innerWidth < 640 ? 200 : 300}
                data={data.timelineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" angle={window.innerWidth < 640 ? -45 : 0} textAnchor={window.innerWidth < 640 ? "end" : "middle"} height={60} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  name="Total Commits"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {/* Show only total on mobile, individual authors on desktop */}
                {window.innerWidth >= 640 && Object.keys(data.authorStats).map((author, index) => (
                  <Line
                    key={author}
                    type="monotone"
                    dataKey={author}
                    stroke={`hsl(${index * 137.5}, 70%, 50%)`}
                    name={author.split('<')[0].trim()}
                    strokeWidth={1.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjects = (group, projects) => (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4 text-gray-800">Projects</h3>
      
      {/* Mobile Projects View */}
      <div className="sm:hidden">
        <div className="space-y-4">
          {projects.map((project) => {
            const projectKey = `${group.members[0].workspaceName}/${project.slug}`;
            return (
              <div key={project.uuid} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h4 className="font-medium text-gray-800 truncate">{project.name}</h4>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => handleProjectSelect(
                      projectKey,
                      'commits',
                      group.members[0].workspaceName,
                      project.slug
                    )}
                    className={`w-full px-3 py-2 rounded text-white text-sm shadow ${selectedProject === projectKey && activeView === 'commits'
                      ? 'bg-green-600'
                      : 'bg-green-500'
                      }`}
                  >
                    View Last Commits
                  </button>
                  <button
                    onClick={() => handleProjectSelect(
                      projectKey,
                      'allCommits',
                      group.members[0].workspaceName,
                      project.slug
                    )}
                    className={`w-full px-3 py-2 rounded text-white text-sm shadow ${selectedProject === projectKey && activeView === 'allCommits'
                      ? 'bg-purple-600'
                      : 'bg-purple-500'
                      }`}
                  >
                    View All Commits
                  </button>
                  <button
                    onClick={() => handleProjectSelect(
                      projectKey,
                      'contributions',
                      group.members[0].workspaceName,
                      project.slug
                    )}
                    className={`w-full px-3 py-2 rounded text-white text-sm shadow ${selectedProject === projectKey && activeView === 'contributions'
                      ? 'bg-blue-600'
                      : 'bg-blue-500'
                      }`}
                  >
                    View Contributions
                  </button>
                  <button
                    onClick={() => navigate(`/admin/analytics/${group.members[0].workspaceName}/${project.slug}`)}
                    className={`w-full px-3 py-2 rounded text-white text-sm shadow ${selectedProject === projectKey && activeView === 'analytics'
                        ? 'bg-blue-600'
                        : 'bg-blue-500'
                      }`}
                  >
                    Analytics
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Desktop Projects Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => {
              const projectKey = `${group.members[0].workspaceName}/${project.slug}`;
              return (
                <tr key={project.uuid} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleProjectSelect(
                        projectKey,
                        'commits',
                        group.members[0].workspaceName,
                        project.slug
                      )}
                      className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-green-400 ${selectedProject === projectKey && activeView === 'commits'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                      View Last Commits
                    </button>
                    <button
                      onClick={() => handleProjectSelect(
                        projectKey,
                        'allCommits',
                        group.members[0].workspaceName,
                        project.slug
                      )}
                      className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${selectedProject === projectKey && activeView === 'allCommits'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-purple-500 hover:bg-purple-600'
                        }`}
                    >
                      View All Commits
                    </button>
                    <button
                      onClick={() => handleProjectSelect(
                        projectKey,
                        'contributions',
                        group.members[0].workspaceName,
                        project.slug
                      )}
                      className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${selectedProject === projectKey && activeView === 'contributions'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                      View Contributions
                    </button>
                    <button
                      onClick={() => navigate(`/admin/analytics/${group.members[0].workspaceName}/${project.slug}`)}
                      className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${selectedProject === projectKey && activeView === 'analytics'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                      Analytics
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Render views based on activeView */}
      {selectedProject && activeView === 'commits' && commits[selectedProject] && (
        <div className="mt-4 p-4 sm:p-6 bg-gray-100 rounded-lg shadow">
          <h4 className="text-md font-medium mb-2 text-gray-700">Most Recent Commit</h4>
          
          {/* Mobile commit view */}
          <div className="sm:hidden">
            {commits[selectedProject].length > 0 && (() => {
              const commit = commits[selectedProject][0];
              
              // Extract just the name part from author string (remove email)
              const formatAuthor = (authorString) => {
                if (!authorString) return 'Unknown';
                // Extract name from "Name <email@example.com>" format
                const match = authorString.match(/^([^<]+)/);
                return match ? match[1].trim() : authorString;
              };
              
              return (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {formatAuthor(commit.author).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{formatAuthor(commit.author)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(commit.date).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-800">{commit.message}</p>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Desktop commit table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-md shadow-md">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Show only the first (most recent) commit */}
                {commits[selectedProject].length > 0 && (() => {
                  const commit = commits[selectedProject][0];
                  
                  // Extract just the name part from author string (remove email)
                  const formatAuthor = (authorString) => {
                    if (!authorString) return 'Unknown';
                    // Extract name from "Name <email@example.com>" format
                    const match = authorString.match(/^([^<]+)/);
                    return match ? match[1].trim() : authorString;
                  };
                  
                  return (
                  <tr key={commit.hash} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{commit.message}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {formatAuthor(commit.author).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-gray-700">{formatAuthor(commit.author)}</span>
                        </div>
                      </td>
                    <td className="px-6 py-4 text-gray-800">{new Date(commit.date).toLocaleDateString()}</td>
                  </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedProject && activeView === 'allCommits' && allCommits[selectedProject] && (
        <AllCommitsView commits={allCommits[selectedProject]} />
      )}

      {selectedProject && activeView === 'contributions' && contributions[selectedProject] && (
        <ContributionStats
          data={contributions[selectedProject]}
          repoKey={selectedProject}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100 rounded-full opacity-20 blur-3xl transform -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-100 rounded-full opacity-20 blur-3xl transform translate-x-1/4 translate-y-1/4"></div>
        <div className="absolute top-1/2 left-1/2 w-1/3 h-1/3 bg-purple-100 rounded-full opacity-20 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>
      
      {/* Inject animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
          
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          .animate-bounce {
            animation: bounce 2s infinite;
          }
          
          .animate-shimmer {
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }

          /* Hover animation for cards */
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          /* Grid pattern background */
          .bg-grid-pattern {
            background-image: 
              linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden border border-white/50">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-200/30 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-200/30 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-3xl"></div>

          {/* Dashboard Title */}
          <div className="relative mb-6 w-full text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Admin Dashboard
              </span>
            </h1>
            <div className="mt-2 flex items-center justify-center text-sm font-medium text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            </div>
          </div>

        {/* Navigation Tabs */}
        <div className="bg-white/70 backdrop-blur-md p-2 rounded-full shadow-lg mb-10 flex flex-wrap justify-center gap-1 sm:gap-2 border border-white/80 mx-auto max-w-3xl">
            <button
              onClick={() => setDashboardView('groups')}
            className={`relative overflow-hidden px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
              dashboardView === 'groups'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-white text-gray-700 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 ${dashboardView === 'groups' ? 'animate-shimmer' : ''}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="relative">Groups</span>
            </button>
            <button
              onClick={() => setDashboardView('contributors')}
            className={`relative overflow-hidden px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
              dashboardView === 'contributors'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-white text-gray-700 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 ${dashboardView === 'contributors' ? 'animate-shimmer' : ''}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="relative">Peoples</span>
            </button>
            <button
              onClick={() => setDashboardView('projects')}
            className={`relative overflow-hidden px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
              dashboardView === 'projects'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-white text-gray-700 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 ${dashboardView === 'projects' ? 'animate-shimmer' : ''}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="relative">Projects</span>
            </button>
            <button
              onClick={() => setDashboardView('workspaces')}
            className={`relative overflow-hidden px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
              dashboardView === 'workspaces'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-white text-gray-700 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 ${dashboardView === 'workspaces' ? 'animate-shimmer' : ''}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="relative">Workspaces</span>
            </button>
            <button
              onClick={() => setDashboardView('manage')}
            className={`relative overflow-hidden px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
              dashboardView === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-white text-gray-700 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 ${dashboardView === 'manage' ? 'animate-shimmer' : ''}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="relative">Manage</span>
            </button>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-lg">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="bg-white border-l-4 border-red-500 rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 sm:p-6 flex items-start">
              <div className="flex-shrink-0 mr-4">
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {dashboardView === 'contributors' ? (
              <ContributorsDashboard />
            ) : dashboardView === 'projects' ? (
              <ProjectDashboard />
            ) : dashboardView === 'workspaces' ? (
              <WorkspaceDashboard />
            ) : dashboardView === 'manage' ? (
              <Manage />
            ) : (
              <div className="space-y-8">
                <div className="mb-8 relative max-w-2xl mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative flex items-center bg-white/80 backdrop-blur-sm overflow-hidden rounded-xl shadow-md">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                  <input
                    type="text"
                    placeholder="Search by group number or member name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                        className="w-full py-4 pl-12 pr-14 text-gray-700 bg-transparent border-none rounded-xl focus:outline-none focus:ring-0 placeholder-gray-400 text-sm font-medium"
                      />
                      {searchQuery && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            onClick={() => setSearchQuery('')}
                            className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 focus:outline-none transition-all duration-200"
                          >
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {filteredGroups.map((group) => (
                  <div 
                    key={group.groupNumber} 
                    className="group bg-white/80 backdrop-blur-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden hover-lift animate-fadeIn mb-6 hover:border-blue-200"
                  >
                    <div
                      className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer transition-all duration-300"
                      onClick={() => handleGroupSelect(group.groupNumber)}
                    >
                      {/* Decorative Elements */}
                      <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-blue-50/20 to-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Team Title with Icon */}
                      <div className="flex items-center relative z-10">
                        <div className="mr-4 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-3 shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300 group-hover:scale-110">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1 group-hover:scale-105 transform transition-all duration-300">
                        Development Team {group.groupNumber}
                      </h2>
                          <p className="text-sm text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-blue-600 font-medium">Project Team</span>
                          </p>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <div className="relative z-10 self-end sm:self-auto mt-4 sm:mt-0">
                        <div
                          className={`p-3 sm:p-4 rounded-full transition-all duration-300 ${selectedGroup === group.groupNumber
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 rotate-180 shadow-lg'
                            : 'bg-white border border-gray-100 shadow-md group-hover:border-blue-200'
                            }`}
                        >
                          <svg 
                            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${selectedGroup === group.groupNumber
                                ? 'text-white'
                                : 'text-blue-600'
                                }`}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {selectedGroup === group.groupNumber && (
                      <div className="p-6 sm:p-8 border-t border-gray-100 bg-white/90 backdrop-blur-sm animate-fadeIn">
                        <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center">
                          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-2 mr-3 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </span>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Team Members
                          </span>
                        </h3>
                        
                        {/* Mobile Card View (visible on small screens) */}
                        <div className="sm:hidden space-y-5">
                              {group.members.map((member, idx) => (
                            <div 
                                  key={idx}
                              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover-lift group"
                            >
                              <div className="p-5">
                                <div className="flex items-center mb-4">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-sm opacity-30"></div>
                                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {member.name.charAt(0)}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <h4 className="font-semibold text-gray-800">{member.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Team Member</p>
                                  </div>
                                </div>
                                
                                <div className="mb-4">
                                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Workspace</div>
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                                    <span className="inline-flex items-center text-sm font-medium text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                      {member.workspaceName}
                                    </span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchProjects(
                                      group.groupNumber,
                                      member.workspaceName,
                                      member.token
                                    );
                                  }}
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-md font-medium text-sm flex items-center justify-center transform transition-transform duration-300 hover:shadow-lg active:scale-95 group-hover:translate-y-[-2px]"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  View Projects
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Desktop Table View (hidden on small screens) */}
                        <div className="hidden sm:block overflow-hidden rounded-xl shadow-lg">
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-xs font-bold uppercase tracking-wider">Name</div>
                              <div className="text-xs font-bold uppercase tracking-wider">Workspace</div>
                              <div className="text-xs font-bold uppercase tracking-wider">Actions</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {group.members.map((member, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-3 gap-4 p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
                              >
                                    <div className="flex items-center space-x-4">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-sm opacity-20"></div>
                                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {member.name.charAt(0)}
                                      </div>
                                    </div>
                                  <div>
                                    <div className="font-semibold text-gray-800">{member.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">Team Member</div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                      {member.workspaceName}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <button
                                      onClick={() =>
                                        fetchProjects(
                                          group.groupNumber,
                                          member.workspaceName,
                                          member.token
                                        )
                                      }
                                    className="inline-flex items-center px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 font-medium text-sm"
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                      View Projects
                                    </button>
                                </div>
                              </div>
                              ))}
                        </div>
                        </div>
                        
                        {/* Projects list */}
                        {projects[group.groupNumber] &&
                          renderProjects(group, projects[group.groupNumber])}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;