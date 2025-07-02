import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import RepositoryHeader from './analytics/RepositoryHeader';
import TabNavigation from './analytics/TabNavigation';
import OverviewTab from './analytics/OverviewTab';
import CommitsTab from './analytics/CommitsTab';
import ContributorsTab from './analytics/ContributorsTab';



const RepositoryAnalytics = () => {
  const { workspaceName, repoSlug } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [workspaceName, repoSlug]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/repository-analytics/${workspaceName}/${repoSlug}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch repository analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
      console.log(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load repository analytics. Please try again later.');
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading repository analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8">
            <button onClick={goBack} className="flex items-center text-blue-600 mb-4 sm:mb-6 group">
              <ArrowLeft className="mr-2 group-hover:mr-3 transition-all" />
              <span>Back to Dashboard</span>
            </button>
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center">
                <AlertCircle className="mr-3 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { repository, commits } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-4 sm:mb-8">
          <RepositoryHeader 
            repository={repository} 
            commits={commits} 
            workspaceName={workspaceName} 
            repoSlug={repoSlug} 
            goBack={goBack} 
          />
          
          {/* Tabs */}
          <TabNavigation
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-4 sm:space-y-8">
          {activeTab === 'overview' && (
            <OverviewTab commits={commits} />
          )}

          {activeTab === 'commits' && (
            <CommitsTab 
              commits={commits} 
              workspaceName={workspaceName}
              repoSlug={repoSlug}
            />
          )}

          {activeTab === 'contributors' && (
            <ContributorsTab commits={commits} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryAnalytics;