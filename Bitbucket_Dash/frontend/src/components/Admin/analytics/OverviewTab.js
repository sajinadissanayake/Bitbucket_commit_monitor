import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ContributorsTab from './ContributorsTab';

const OverviewTab = ({ commits }) => {
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  // Helper to format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get top 3 contributors based on commit count
  const topContributors = Object.entries(commits.authorStats || {})
    .sort((a, b) => b[1].totalCommits - a[1].totalCommits)
    .slice(0, 3)
    .map(([author]) => author);

  // Process timeline data to ensure contributor data is present
  const processTimelineData = () => {
    if (!commits.timelineData || commits.timelineData.length === 0) return [];
    
    // Use spread operator to avoid mutating original data
    return commits.timelineData.map(day => {
      const processed = { ...day };
      
      // Ensure each top contributor has at least 0 commits for this day
      topContributors.forEach(contributor => {
        if (processed[contributor] === undefined) {
          processed[contributor] = 0;
        }
      });
      
      return processed;
    });
  };

  const processedTimelineData = processTimelineData();



  const finalData = processedTimelineData;

  return (
    <>
      {/* Activity Stats */}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Today</h3>
          <p className="text-3xl font-bold text-gray-800">{commits.todayCommits}</p>
          <p className="text-gray-500 text-sm mt-1">commits</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Last Week</h3>
          <p className="text-3xl font-bold text-gray-800">{commits.lastWeekCommits}</p>
          <p className="text-gray-500 text-sm mt-1">commits</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Last Month</h3>
          <p className="text-3xl font-bold text-gray-800">{commits.lastMonthCommits}</p>
          <p className="text-gray-500 text-sm mt-1">commits</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Daily Average</h3>
          <p className="text-3xl font-bold text-gray-800">
            {(commits.lastMonthCommits / 30).toFixed(1)}
          </p>
          <p className="text-gray-500 text-sm mt-1">commits per day</p>
        </div>
      </div>

      <ContributorsTab commits={commits} />

      {/* Timeline Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Commit Activity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={finalData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'total' ? 'Total Commits' : name]}
                labelFormatter={(date) => formatDate(date)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Commits"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 2 }}
                activeDot={{ r: 6 }}
              />
              {topContributors.map((author, index) => (
                <Line
                  key={author}
                  type="monotone"
                  dataKey={author}
                  name={author}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 5 }}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contribution Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Contribution Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(commits.authorStats).map(([author, stats], index) => ({
                    name: author,
                    value: parseInt(stats.totalCommits),
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(commits.authorStats).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value} commits`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Contributor Stats</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(commits.authorStats).map(([author, stats]) => ({
                  name: author,
                  commits: stats.totalCommits,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" name="Total Commits" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;