// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
// import { ChevronDown, ChevronUp } from 'lucide-react';


// const Groups = () => {
//   const [groups, setGroups] = useState([]);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [projects, setProjects] = useState({});
//   const [commits, setCommits] = useState({});
//   const [allCommits, setAllCommits] = useState({}); 
//   const [contributions, setContributions] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [activeView, setActiveView] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchGroups();
//   }, []);

//   useEffect(() => {
//     setSelectedProject(null);
//     setActiveView(null);
//   }, [selectedGroup]);

//   const fetchGroups = async () => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/groups`);
//       if (!response.ok) throw new Error('Failed to fetch groups');
//       const data = await response.json();
//       setGroups(data);
//       setLoading(false);
//     } catch (err) {
//       setError('Failed to load groups');
//       setLoading(false);
//     }
//   };

//   const fetchProjects = async (groupNumber, workspaceName, token) => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/workspace-projects/${workspaceName}`);
//       if (!response.ok) throw new Error('Failed to fetch projects');
//       const data = await response.json();
//       setProjects((prev) => ({ ...prev, [groupNumber]: data }));
//       setSelectedProject(null);
//       setActiveView(null);
//     } catch (err) {
//       setError(`Failed to load projects for group ${groupNumber}`);
//     }
//   };

//   const fetchLastCommits = async (workspaceName, repoSlug) => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/commits/${workspaceName}/${repoSlug}`);
//       if (!response.ok) throw new Error('Failed to fetch commits');
//       const data = await response.json();
//       setCommits((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
//     } catch (err) {
//       setError('Failed to load commits');
//     }
//   };

//   // New function to fetch all commits
//   const fetchAllCommits = async (workspaceName, repoSlug) => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/all-commits/${workspaceName}/${repoSlug}`);
//       if (!response.ok) throw new Error('Failed to fetch all commits');
//       const data = await response.json();
//       setAllCommits((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
//     } catch (err) {
//       setError('Failed to load all commits');
//     }
//   };

//   const fetchContributions = async (workspaceName, repoSlug) => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/contributions/${workspaceName}/${repoSlug}`);
//       if (!response.ok) throw new Error('Failed to fetch contributions');
//       const data = await response.json();
//       setContributions((prev) => ({ ...prev, [`${workspaceName}/${repoSlug}`]: data }));
//     } catch (err) {
//       setError('Failed to load contributions');
//     }
//   };

//   const handleGroupSelect = (groupNumber) => {
//     setSelectedGroup(selectedGroup === groupNumber ? null : groupNumber);
//     setSelectedProject(null);
//     setActiveView(null);
//   };

//   const handleProjectSelect = (projectKey, action, workspaceName, repoSlug) => {
//     setSelectedProject(projectKey);
//     setActiveView(action);
//     if (action === 'commits') {
//       fetchLastCommits(workspaceName, repoSlug);
//     } else if (action === 'allCommits') {
//       fetchAllCommits(workspaceName, repoSlug);
//     } else if (action === 'contributions') {
//       fetchContributions(workspaceName, repoSlug);
//     }
//   };

//   // New component to render all commits
//   const AllCommitsView = ({ commits }) => {
//     if (!commits) return null;

//     return (
//       <div className="mt-4 p-6 bg-gray-100 rounded-lg shadow-lg transition-transform transform hover:scale-105">
//         <h4 className="text-xl font-medium mb-4 text-gray-700">All Commits History</h4>
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white rounded-md shadow-md">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Hash</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Author</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {commits.map((commit) => (
//                 <tr key={commit.hash} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 text-gray-800 font-mono text-sm">{commit.hash.substring(0, 7)}</td>
//                   <td className="px-6 py-4 text-gray-800">{commit.message}</td>
//                   <td className="px-6 py-4 text-gray-800">{commit.author}</td>
//                   <td className="px-6 py-4 text-gray-800">
//                     {new Date(commit.date).toLocaleDateString()} {new Date(commit.date).toLocaleTimeString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };
//   const ContributionStats = ({ data, repoKey }) => {
//     if (!data) return null;
  
//     return (
//       <div className="mt-6 p-6 bg-white shadow-lg rounded-lg transition-transform transform hover:scale-105">
//         <h3 className="text-xl font-semibold mb-4 text-gray-800">Contribution Statistics</h3>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-gray-50 p-4 rounded-lg shadow-md">
//             <h4 className="text-sm text-gray-500">Total Commits</h4>
//             <p className="text-2xl font-bold text-gray-700">{data.totalCommits}</p>
//           </div>
//           <div className="bg-gray-50 p-4 rounded-lg shadow-md">
//             <h4 className="text-sm text-gray-500">Today's Commits</h4>
//             <p className="text-2xl font-bold text-gray-700">{data.todayCommits}</p>
//           </div>
//           <div className="bg-gray-50 p-4 rounded-lg shadow-md">
//             <h4 className="text-sm text-gray-500">Last Week</h4>
//             <p className="text-2xl font-bold text-gray-700">{data.lastWeekCommits}</p>
//           </div>
//           <div className="bg-gray-50 p-4 rounded-lg shadow-md">
//             <h4 className="text-sm text-gray-500">Last Month</h4>
//             <p className="text-2xl font-bold text-gray-700">{data.lastMonthCommits}</p>
//           </div>
//         </div>
//         <div className="mb-6">
//           <h4 className="text-lg font-medium mb-4">Contributions by Author</h4>
//           <div className="h-64">
//             <BarChart
//               width={800}
//               height={240}
//               data={Object.entries(data.authorStats).map(([author, stats]) => ({
//                 author: author.split('<')[0].trim(),
//                 commits: stats.totalCommits,
//                 percentage: parseFloat(stats.percentage),
//               }))}
//               margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="author" />
//               <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
//               <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
//               <Tooltip />
//               <Legend />
//               <Bar yAxisId="left" dataKey="commits" fill="#8884d8" name="Total Commits" />
//               <Bar yAxisId="right" dataKey="percentage" fill="#82ca9d" name="Percentage %" />
//             </BarChart>
//           </div>
//         </div>
//         <div>
//           <h4 className="text-lg font-medium mb-4">Commit Timeline</h4>
//           <div className="h-64">
//             <LineChart
//               width={800}
//               height={240}
//               data={data.timelineData}
//               margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Commits" />
//               {Object.keys(data.authorStats).map((author, index) => (
//                 <Line
//                   key={author}
//                   type="monotone"
//                   dataKey={author}
//                   stroke={`hsl(${index * 137.5}, 70%, 50%)`}
//                   name={author.split('<')[0].trim()}
//                 />
//               ))}
//             </LineChart>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderProjects = (group, projects) => (
//     <div className="mt-6">
//       <h3 className="text-lg font-medium mb-4 text-gray-800">Projects</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project Name</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {projects.map((project) => {
//               const projectKey = `${group.members[0].workspaceName}/${project.slug}`;
//               return (
//                 <tr key={project.uuid} className="hover:bg-gray-50 transition">
//                   <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
//                   <td className="px-6 py-4 whitespace-nowrap space-x-2">
//                     <button
//                       onClick={() => handleProjectSelect(
//                         projectKey,
//                         'commits',
//                         group.members[0].workspaceName,
//                         project.slug
//                       )}
//                       className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-green-400 ${
//                         selectedProject === projectKey && activeView === 'commits'
//                           ? 'bg-green-600 hover:bg-green-700'
//                           : 'bg-green-500 hover:bg-green-600'
//                       }`}
//                     >
//                       View Last Commits
//                     </button>
//                     <button
//                       onClick={() => handleProjectSelect(
//                         projectKey,
//                         'allCommits',
//                         group.members[0].workspaceName,
//                         project.slug
//                       )}
//                       className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${
//                         selectedProject === projectKey && activeView === 'allCommits'
//                           ? 'bg-purple-600 hover:bg-purple-700'
//                           : 'bg-purple-500 hover:bg-purple-600'
//                       }`}
//                     >
//                       View All Commits
//                     </button>
//                     <button
//                       onClick={() => handleProjectSelect(
//                         projectKey,
//                         'contributions',
//                         group.members[0].workspaceName,
//                         project.slug
//                       )}
//                       className={`px-4 py-2 rounded text-white shadow transition-transform transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
//                         selectedProject === projectKey && activeView === 'contributions'
//                           ? 'bg-blue-600 hover:bg-blue-700'
//                           : 'bg-blue-500 hover:bg-blue-600'
//                       }`}
//                     >
//                       View Contributions
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Render views based on activeView */}
//       {selectedProject && activeView === 'commits' && commits[selectedProject] && (
//         <div className="mt-4 p-6 bg-gray-100 rounded-lg shadow-lg transition-transform transform hover:scale-105">
//           <h4 className="text-md font-medium mb-2 text-gray-700">Last Two Commits</h4>
//           <div className="overflow-x-auto">
//             <table className="min-w-full bg-white rounded-md shadow-md">
//               <thead className="bg-gray-200">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Author</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {commits[selectedProject].map((commit) => (
//                   <tr key={commit.hash} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 text-gray-800">{commit.message}</td>
//                     <td className="px-6 py-4 text-gray-800">{commit.author}</td>
//                     <td className="px-6 py-4 text-gray-800">{new Date(commit.date).toLocaleDateString()}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {selectedProject && activeView === 'allCommits' && allCommits[selectedProject] && (
//         <AllCommitsView commits={allCommits[selectedProject]} />
//       )}

//       {selectedProject && activeView === 'contributions' && contributions[selectedProject] && (
//         <ContributionStats
//           data={contributions[selectedProject]}
//           repoKey={selectedProject}
//         />
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-5xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-12">
//          Groups
//         </h1>
        
//         {loading ? (
//           <div className="text-center py-12">
//             <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//             <p className="text-gray-600 font-medium">Loading dashboard data...</p>
//           </div>
//         ) : error ? (
//           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-lg">
//             {error}
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {groups.map((group) => (
//               <div key={group.groupNumber} className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
//                 <div
//                   className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors duration-200"
//                   onClick={() => handleGroupSelect(group.groupNumber)}
//                 >
//                   <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
//                     Development Team {group.groupNumber}
//                   </h2>
//                   <div className="bg-blue-50 p-2 rounded-full transition-transform duration-200 transform hover:scale-110">
//                     {selectedGroup === group.groupNumber ? (
//                       <ChevronUp className="w-6 h-6 text-blue-600" />
//                     ) : (
//                       <ChevronDown className="w-6 h-6 text-blue-600" />
//                     )}
//                   </div>
//                 </div>
//                 {selectedGroup === group.groupNumber && (
//                   <div className="p-6 border-t border-gray-100 bg-gray-50/50">
//                     <h3 className="text-xl font-semibold text-gray-800 mb-6">Team Members</h3>
//                     <div className="overflow-hidden rounded-xl shadow-lg">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
//                           <tr>
//                             <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
//                             <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Workspace</th>
//                             <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {group.members.map((member, idx) => (
//                             <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
//                               <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{member.name}</td>
//                               <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.workspaceName}</td>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <button
//                                   onClick={() => fetchProjects(group.groupNumber, member.workspaceName, member.token)}
//                                   className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
//                                 >
//                                   View Projects
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                     {projects[group.groupNumber] && renderProjects(group, projects[group.groupNumber])}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// export default Groups;