import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <nav className="flex min-w-max">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('commits')}
          className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium ${
            activeTab === 'commits'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Commits
        </button>
        <button
          onClick={() => setActiveTab('contributors')}
          className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium ${
            activeTab === 'contributors'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Contributors
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;