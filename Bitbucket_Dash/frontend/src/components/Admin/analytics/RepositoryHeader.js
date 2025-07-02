import React from 'react';
import { ArrowLeft, GitCommit, Users, Calendar, Code } from 'lucide-react';

const RepositoryHeader = ({ repository, commits, workspaceName, repoSlug, goBack }) => {
  // Helper to format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 md:p-8 text-white">
      <button onClick={goBack} className="flex items-center text-white mb-4 sm:mb-6 opacity-80 hover:opacity-100 group">
        <ArrowLeft className="mr-2 group-hover:mr-3 transition-all" />
        <span>Back</span>
      </button>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{repository.name}</h1>
      <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">{workspaceName}/{repoSlug}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <GitCommit className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <p className="text-xs sm:text-sm text-blue-100">Total Commits</p>
              <p className="text-xl sm:text-2xl font-bold">{commits.totalCommits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <Users className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <p className="text-xs sm:text-sm text-blue-100">Contributors</p>
              <p className="text-xl sm:text-2xl font-bold">{Object.keys(commits.authorStats).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <Calendar className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <p className="text-xs sm:text-sm text-blue-100">Created On</p>
              <p className="text-base sm:text-xl font-bold">{formatDate(repository.created_on)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <Code className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            <div>
              <p className="text-xs sm:text-sm text-blue-100">Language</p>
              <p className="text-base sm:text-xl font-bold">{repository.language || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryHeader;