import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Search, RefreshCw, FileText, Code, Box, Users, BarChart2, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ProjectRow component with virtualization support
const ProjectRow = React.memo(({ project, index }) => {
  const navigate = useNavigate();
  const isEven = index % 2 === 0;
  
  // Pre-compute icon type and color
  const icon = useMemo(() => {
    if (project.name.startsWith('C#')) return { type: 'C#', color: 'bg-purple-500' };
    if (project.name.startsWith('Chat-Bot')) return { type: 'Ch', color: 'bg-gray-500' };
    if (project.name.startsWith('ChatHub')) return { type: 'Ch', color: 'bg-gray-600' };
    if (project.name.startsWith('Data')) return { type: 'Da', color: 'bg-slate-500' };
    if (project.name.startsWith('JAVA')) return { type: 'JA', color: 'bg-red-500' };
    return { type: project.name.charAt(0), color: 'bg-blue-500' };
  }, [project.name]);
  
  // Pre-compute tech badge
  const techBadge = useMemo(() => {
    if (project.name.startsWith('C#')) return { color: 'bg-purple-500', text: 'C#' };
    if (project.name.includes('Chat-Bot')) return { color: 'bg-gray-500', text: 'Chat-Bot' };
    if (project.name.includes('ChatHub')) return { color: 'bg-gray-600', text: 'ChatHub' };
    if (project.name.includes('Data Science')) return { color: 'bg-slate-500', text: 'Data' };
    if (project.name.includes('JAVA')) return { color: 'bg-red-500', text: 'JAVA' };
    return { color: 'bg-blue-500', text: project.techStack || '' };
  }, [project.name, project.techStack]);

  // Optimized handlers
  const handleViewClick = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleAnalyticsClick = useCallback((e) => {
    e.preventDefault();
    navigate(`/admin/analytics/${project.id}`);
  }, [navigate, project.id]);

  return (
    <div className={`border-b ${isEven ? 'bg-white' : 'bg-gray-50'} transform-gpu`} 
         style={{ contain: 'content' }}>
      <div className="grid grid-cols-12 items-center py-4 px-2 sm:px-4">
        {/* Project Icon & Name */}
        <div className="col-span-3 md:col-span-3 flex items-center min-w-0">
          <div className={`w-7 h-7 rounded flex items-center justify-center text-white text-xs font-medium mr-2 ${icon.color}`}>
            {icon.type}
          </div>
          <div className="truncate">
            <div className="font-medium text-sm text-gray-900 truncate">{project.name}</div>
            <div className="text-xs text-gray-500 truncate">Workspace: {project.workspace}</div>
          </div>
        </div>
        
        {/* Tech Stack */}
        <div className="col-span-2 md:col-span-2 flex justify-center">
          <div className={`px-2.5 py-1 rounded-full text-xs text-white ${techBadge.color}`}>
            {techBadge.text}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="col-span-3 md:col-span-3 text-center">
          <div className="text-xs text-gray-500">Timeline not specified</div>
        </div>
        
        {/* Group */}
        <div className="col-span-2 md:col-span-2 text-center">
          <div className="text-sm font-medium">{project.group}</div>
        </div>
        
        {/* Actions */}
        <div className="col-span-2 md:col-span-2 flex items-center justify-end space-x-1">
          <button 
            onClick={handleViewClick}
            className="text-xs text-blue-600 font-medium flex items-center px-2 py-1">
            <span className="flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>View</span>
            </span>
          </button>
          <button 
            onClick={handleAnalyticsClick}
            className="text-xs text-blue-600 font-medium flex items-center px-2 py-1">
            <span className="flex items-center">
              <BarChart2 className="w-3.5 h-3.5 mr-1" />
              <span>Analytics</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

// Column Header component
const ColumnHeader = React.memo(({ title, icon, alignment = "left" }) => {
  const alignmentClass = alignment === "center" 
    ? "justify-center text-center" 
    : alignment === "right" 
      ? "justify-end text-right" 
      : "justify-start text-left";
      
  return (
    <div className={`flex items-center ${alignmentClass} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
      {icon && <span className="mr-1">{icon}</span>}
      <span>{title}</span>
    </div>
  );
});

// Optimized AdminDashboard component
const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  
  // Sample data based on screenshot
  const projects = useMemo(() => [
    { id: 1, name: 'C# 3 Project', workspace: 'prageeth_raveendra', group: 'C# 3' },
    { id: 2, name: 'C# 5 Project', workspace: 'slprojects', group: 'C# 5' },
    { id: 3, name: 'C#-4 Project', workspace: 'csharp_4', group: 'C#-4' },
    { id: 4, name: 'Chat-Bot Project', workspace: 'dlinkweerasinghe', group: 'Chat-Bot' },
    { id: 5, name: 'ChatHub Project', workspace: 'satha_123', group: 'ChatHub' },
    { id: 6, name: 'Data Science 2 Project', workspace: 'sttest1', group: 'Data Science 2' },
    { id: 7, name: 'Data Science Team 3 Project', workspace: 'Chatbot', group: 'Data Science Team 3' },
    { id: 8, name: 'JAVA 5 Project', workspace: 'java_5', group: 'JAVA 5' },
  ], []);

  // Optimized event handlers
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  }, []);
  
  const handleManageStudents = useCallback(() => {
    navigate('/admin/manage');
  }, [navigate]);
  
  const handleClassicView = useCallback(() => {
    navigate('/admin/classic');
  }, [navigate]);
  
  const handleLogout = useCallback(() => {
    // Logout logic here
    console.log('Logging out...');
  }, []);

  // Performance-optimized filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowerCaseQuery) ||
      project.workspace.toLowerCase().includes(lowerCaseQuery) ||
      project.group.toLowerCase().includes(lowerCaseQuery)
    );
  }, [projects, searchQuery]);

  // Get the displayed projects count for the UI
  const displayedCount = filteredProjects.length;
  const totalCount = 39; // From the screenshot

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - matching screenshot exactly */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-purple-600 text-white p-2 rounded-md">
                <FileText size={20} />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Analytics & Project Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleClassicView}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 bg-white flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" /> Classic View
              </button>
              <button 
                onClick={handleManageStudents}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 bg-white flex items-center"
              >
                <Users className="w-4 h-4 mr-1" /> Manage Students
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="relative flex-1 max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="ml-3 flex items-center">
            <div className="text-sm text-gray-500 mr-2">Found: <span className="font-medium">{displayedCount}</span></div>
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-full text-gray-500 focus:outline-none"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-purple-500' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Project List Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Project Management Header */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Box className="text-purple-600 h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Project Management</h2>
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">10</span> of <span className="font-medium">{totalCount}</span> projects
            </div>
          </div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-12 px-4 py-2 border-y border-gray-200 bg-gray-50">
            <div className="col-span-3 md:col-span-3">
              <ColumnHeader title="Project" icon={<FileText size={14} />} />
            </div>
            <div className="col-span-2 md:col-span-2">
              <ColumnHeader title="Tech Stack" icon={<Code size={14} />} alignment="center" />
            </div>
            <div className="col-span-3 md:col-span-3">
              <ColumnHeader title="Timeline" alignment="center" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <ColumnHeader title="Group" alignment="center" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <ColumnHeader title="Actions" alignment="right" />
            </div>
          </div>
          
          {/* Project List Container */}
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto"
            style={{
              height: 'calc(100vh - 280px)',
              overflowY: 'auto',
              overscrollBehavior: 'none'
            }}
          >
            {filteredProjects.map((project, index) => (
              <ProjectRow 
                key={project.id} 
                project={project} 
                index={index} 
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(AdminDashboard);
