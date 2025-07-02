import React from 'react';
import { AlertCircle, Clock, User, GitCommit, Calendar, Activity } from 'lucide-react';

const ContributorsTab = ({ commits }) => {
  // Helper to format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate if there were commits in the last week or month
  const getRecentActivity = (lastCommitDate) => {
    const lastCommit = new Date(lastCommitDate);
    const now = new Date();
    
    // Calculate time differences
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    // Check recent activity
    const hasCommitsLastWeek = lastCommit >= oneWeekAgo;
    const hasCommitsLastMonth = lastCommit >= oneMonthAgo;
    
    return {
      hasCommitsLastWeek,
      hasCommitsLastMonth,
      daysSinceLastCommit: Math.floor((now - lastCommit) / (1000 * 60 * 60 * 24))
    };
  };

  // Get activity status badge
  const getActivityBadge = (recentActivity) => {
    if (recentActivity.hasCommitsLastWeek) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Active this week
        </span>
      );
    } else if (recentActivity.hasCommitsLastMonth) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Active last month
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Inactive ({recentActivity.daysSinceLastCommit} days)
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
          <User className="mr-2" size={20} />
          Repository Contributors
        </h2>
      </div>

      {Object.keys(commits.authorStats).length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No contributors found</h3>
          <p className="mt-1 text-sm text-gray-500">There are no commits in this repository yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User size={14} className="mr-1 hidden sm:block" />
                    <span>Contributor</span>
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <GitCommit size={14} className="mr-1 hidden sm:block" />
                    <span>Commits</span>
                  </div>
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span>%</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(commits.authorStats).map(([author, stats], index) => {
                const recentActivity = getRecentActivity(stats.lastCommit);
                
                return (
                  <tr key={author} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {author.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{author}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            Last: {formatDate(stats.lastCommit)}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {getActivityBadge(recentActivity)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">{stats.totalCommits}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600">{stats.percentage}%</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContributorsTab;