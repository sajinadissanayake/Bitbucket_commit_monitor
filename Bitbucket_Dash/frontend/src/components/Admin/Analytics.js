import React, { useMemo, useCallback } from 'react';
import { ArrowLeft, Code, Users, Calendar, Hash, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const navigate = useNavigate();
  
  // Use useMemo to prevent re-creation of sample data on each render
  const analyticsData = useMemo(() => ({
    title: "CV Shortlist app",
    repoPath: "prageeth_raveendra/cv-shortlist-app",
    stats: {
      totalCommits: 11,
      contributors: 3,
      createdOn: "Feb 2, 2025",
      language: "Not specified"
    },
    timeStats: {
      today: {
        commits: 0,
        label: "Today"
      },
      lastWeek: {
        commits: 0,
        label: "Last Week"
      },
      lastMonth: {
        commits: 3,
        label: "Last Month"
      },
      average: {
        commits: "0.1",
        label: "Daily Average",
        subLabel: "commits per day"
      }
    },
    contributors: [
      {
        id: 1,
        name: "Prageeth Ravindra",
        initials: "P",
        commits: 2,
        percentage: 18.2,
        lastCommit: "May 18, 2025",
        lastCommitTime: "2:34:08 PM",
        status: "Active last month"
      },
      {
        id: 2,
        name: "prageeth",
        initials: "P",
        commits: 3,
        percentage: 27.3,
        lastCommit: "May 18, 2025",
        lastCommitTime: "2:29:02 PM",
        status: "Active last month"
      },
      {
        id: 3,
        name: "Jaliya Herath",
        initials: "J",
        commits: 6,
        percentage: 54.5,
        lastCommit: "Apr 6, 2025",
        lastCommitTime: "3:03:47 PM",
        status: "Inactive (51 days)",
        inactive: true
      }
    ]
  }), []);

  // Memoize navigation handler
  const handleBackNavigation = useCallback(() => {
    navigate('/admin/dashboard');
  }, [navigate]);

  // Simplified CSS with reduced animations
  const cssStyles = `
    .progress-bar {
      height: 8px;
      border-radius: 4px;
      background-color: #e0e7ff;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%);
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-5 pb-8">
      <style jsx>{cssStyles}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl shadow-lg p-5 sm:p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxwYXRoIGQ9Ik0wIDEwIEw0MCAxMCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]"></div>
          
          {/* Back Button */}
          <button 
            onClick={handleBackNavigation}
            className="inline-flex items-center mb-6 text-white/90 hover:text-white transition-colors group relative z-10"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          
          {/* Project Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 relative z-10">{analyticsData.title}</h1>
          <p className="text-white/80 text-sm sm:text-base mb-8 relative z-10">{analyticsData.repoPath}</p>
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 relative z-10">
            {/* Total Commits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-md bg-white/10 mr-3">
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white/80">Total Commits</span>
              </div>
              <span className="text-2xl font-bold">{analyticsData.stats.totalCommits}</span>
            </div>
            
            {/* Contributors */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-md bg-white/10 mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white/80">Contributors</span>
              </div>
              <span className="text-2xl font-bold">{analyticsData.stats.contributors}</span>
            </div>
            
            {/* Created On */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-md bg-white/10 mr-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white/80">Created On</span>
              </div>
              <span className="text-2xl font-bold">{analyticsData.stats.createdOn}</span>
            </div>
            
            {/* Language */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-md bg-white/10 mr-3">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm text-white/80">Language</span>
              </div>
              <span className="text-2xl font-bold">{analyticsData.stats.language}</span>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="bg-white shadow-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button className="flex-1 py-4 px-4 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              Overview
            </button>
            <button className="flex-1 py-4 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Commits
            </button>
            <button className="flex-1 py-4 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Contributors
            </button>
          </div>
        </div>
        
        {/* Time Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Object.entries(analyticsData.timeStats).map(([key, stat]) => (
            <div key={key} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">{stat.label}</h3>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-gray-900 mr-2">{stat.commits}</span>
                {stat.subLabel && <span className="text-xs text-gray-500">{stat.subLabel}</span>}
              </div>
            </div>
          ))}
        </div>
        
        {/* Contributors Table */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="sr-only">Contributors</h2>
          
          {/* Table Header - Desktop */}
          <div className="hidden md:grid md:grid-cols-12 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Contributor</div>
            <div className="col-span-1 text-center">Commits</div>
            <div className="col-span-3">Percentage</div>
            <div className="col-span-2">Last Commit</div>
            <div className="col-span-2">Recent Activity</div>
          </div>
          
          {/* Table Rows - No animations for better performance */}
          <div className="divide-y divide-gray-200">
            {analyticsData.contributors.map((contributor) => (
              <div 
                key={contributor.id} 
                className={`grid grid-cols-1 md:grid-cols-12 py-4 px-4 md:px-6 hover:bg-gray-50 ${contributor.inactive ? 'bg-red-50/50' : ''}`}
              >
                {/* Contributor - Always visible */}
                <div className="col-span-4 flex items-center mb-3 md:mb-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${contributor.initials === 'J' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                    {contributor.initials}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{contributor.name}</div>
                  </div>
                </div>
                
                {/* Mobile View - Stats in Grid */}
                <div className="md:hidden grid grid-cols-2 gap-3 w-full mt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Commits</div>
                    <div className="font-medium">{contributor.commits}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Percentage</div>
                    <div className="font-medium">{contributor.percentage}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Last Commit</div>
                    <div className="font-medium text-sm">{contributor.lastCommit}</div>
                    <div className="text-xs text-gray-500">{contributor.lastCommitTime}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Status</div>
                    <div className={`text-xs font-medium rounded-full px-2 py-1 inline-flex items-center ${contributor.inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {contributor.inactive ? <Clock className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
                      {contributor.status}
                    </div>
                  </div>
                </div>
                
                {/* Desktop View - Each column */}
                <div className="hidden md:flex md:col-span-1 items-center justify-center font-medium">
                  {contributor.commits}
                </div>
                <div className="hidden md:block md:col-span-3 pr-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${contributor.percentage}%` }}></div>
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium">{contributor.percentage}%</span>
                  </div>
                </div>
                <div className="hidden md:block md:col-span-2 text-sm">
                  <div>{contributor.lastCommit}</div>
                  <div className="text-xs text-gray-500">{contributor.lastCommitTime}</div>
                </div>
                <div className="hidden md:flex md:col-span-2 items-center">
                  <span className={`text-xs font-medium rounded-full px-2 py-1 flex items-center ${contributor.inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {contributor.inactive ? <Clock className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
                    {contributor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add export for React.memo to prevent unnecessary re-renders
export default React.memo(Analytics); 