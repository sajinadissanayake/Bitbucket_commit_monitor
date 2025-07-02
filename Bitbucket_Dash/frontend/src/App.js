import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import BitbucketDashboard from './components/BitbucketDashboard';
import ContributionsDashboard from './components/ContributionsDashboard';
import StudentSignup from './components/students/StudentSignup';
import AdminLogin from './components/Admin/Adminlogin';
import AdminSignup from './components/Admin/AdminSignup';
import AdminDashboard from './components/AdminDashboard';
import NewAdminDashboard from './components/NewAdminDashboard';
import ContributorsDashboard from './components/ContributorsDashboard';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import Manage from './components/Admin/Manage';
import Groups2 from './components/Admin/Groups2';
import RepositoryAnalytics from './components/Admin/RepositoryAnalytics';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const workspace = localStorage.getItem('bitbucketWorkspace');
  const accessToken = localStorage.getItem('bitbucketToken');

  return workspace && accessToken ? children : <Navigate to="/" replace />;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const adminInfo = localStorage.getItem('adminInfo');

  return adminInfo ? children : <Navigate to="/adminlogin" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <BitbucketDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:workspace/repo/:repoSlug/contributions"
        element={<ContributionsDashboard />}
      />

      <Route
        path="/adminsignup"
        element={<AdminSignup />}></Route>
       <Route
        path="/studentsignup"
        element={<StudentSignup />}
      />
      <Route
        path="/adminlogin"
        element={<AdminLogin />}>
      </Route>
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }>
      </Route>
      <Route
        path="/admin/new-dashboard"
        element={
          <AdminProtectedRoute>
            <NewAdminDashboard />
          </AdminProtectedRoute>
        }>
      </Route>
      <Route
        path="/workspaces"
        element={< WorkspaceDashboard />}/>
      <Route
        path="/contributors"
        element={<ContributorsDashboard />}/>
      <Route path="/workspace/:workspaceName" element={<BitbucketDashboard />} />
      <Route 
        path="/admin/manage" 
        element={
          <AdminProtectedRoute>
            <Manage />
          </AdminProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/analytics/:workspaceName/:repoSlug" 
        element={
          <AdminProtectedRoute>
            <RepositoryAnalytics/>
          </AdminProtectedRoute>
        } 
      />

      <Route path="/groups2" element={<Groups2 />} />
    </Routes>

  );
}


export default App;
