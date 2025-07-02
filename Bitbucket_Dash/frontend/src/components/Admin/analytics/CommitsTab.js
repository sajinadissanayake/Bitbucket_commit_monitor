import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, GitCommit, FileText, PlusCircle, MinusCircle, Calendar, User, ChevronRight } from 'lucide-react';

// Memoized commit row component for better performance
const CommitRow = React.memo(({ commit, index, isExpanded, onToggleExpand, formatAuthor, formatDate }) => {
  const isEven = index % 2 === 0;
  
  // Function to format commit message for display
  const formatCommitMessage = (message) => {
    // If message is very long and contains file lists (like merge commits)
    if (message.length > 200 && message.includes('#')) {
      // Get the first line or first 100 chars
      const firstLine = message.split('\n')[0];
      return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
    }
    return message;
  };
  
  return (
    <React.Fragment>
      <tr 
        className={`border-b hover:bg-blue-50 cursor-pointer transition-colors ${
          isExpanded ? 'bg-blue-50' : (isEven ? 'bg-white' : 'bg-gray-50')
        }`}
        onClick={() => onToggleExpand(commit.hash)}
      >
        <td className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start">
            {isExpanded ? 
              <ChevronUp size={16} className="mr-1 sm:mr-2 mt-1 text-blue-600 flex-shrink-0" /> : 
              <ChevronDown size={16} className="mr-1 sm:mr-2 mt-1 text-gray-500 flex-shrink-0" />
            }
            <div className="font-medium text-gray-800 break-words text-xs sm:text-sm line-clamp-2 w-full">
              {formatCommitMessage(commit.message)}
            </div>
          </div>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="hidden sm:flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium mr-2">
              {commit.author ? formatAuthor(commit.author).charAt(0).toUpperCase() : "?"}
            </div>
            <span className="text-gray-800">{formatAuthor(commit.author)}</span>
          </div>
          <div className="sm:hidden flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium mr-1">
              {commit.author ? formatAuthor(commit.author).charAt(0).toUpperCase() : "?"}
            </div>
            <span className="text-xs text-gray-800 truncate">{formatAuthor(commit.author).split(' ')[0]}</span>
          </div>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center hidden md:table-cell">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono text-xs">
            {commit.hash.substring(0, 7)}
          </span>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center hidden lg:table-cell">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium text-xs">
            {commit.filesChanged}
          </span>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-green-600 font-medium text-xs sm:text-sm">+{commit.linesAdded}</span>
            <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">/</span>
            <span className="text-gray-500 text-xs inline sm:hidden">/</span>
            <span className="text-red-600 font-medium text-xs sm:text-sm">-{commit.linesRemoved}</span>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-blue-50 border-b">
          <td colSpan="5" className="px-3 sm:px-6 py-3 sm:py-4">
            <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 space-y-2 sm:space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                <div className="flex items-center">
                  <User size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm text-gray-500">Author</span>
                    <p className="font-medium text-gray-800 truncate text-xs sm:text-sm">{formatAuthor(commit.author)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500">Date</span>
                    <p className="font-medium text-gray-800 text-xs sm:text-sm">{formatDate(commit.date)}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="mb-3">
                  <span className="text-xs sm:text-sm text-gray-500">Full Commit Message</span>
                  <div className="font-medium text-gray-800 bg-gray-50 p-2 sm:p-3 rounded mt-1 text-xs sm:text-sm max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="whitespace-pre-wrap break-words">{commit.message}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center">
                    <FileText size={16} className="text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500">Files</span>
                      <p className="font-semibold text-blue-600 text-xs sm:text-sm">{commit.filesChanged}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <PlusCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500">Additions</span>
                      <p className="font-semibold text-green-600 text-xs sm:text-sm">+{commit.linesAdded}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MinusCircle size={16} className="text-red-600 mr-2 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500">Deletions</span>
                      <p className="font-semibold text-red-600 text-xs sm:text-sm">-{commit.linesRemoved}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-only hash info */}
              <div className="md:hidden pt-2 border-t">
                <span className="text-xs text-gray-500">Commit Hash</span>
                <p className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block mt-1 text-xs">
                  {commit.hash.substring(0, 7)}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

const CommitsTab = React.memo(({ commits, workspaceName, repoSlug }) => {
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [commitDetails, setCommitDetails] = useState({});
  
  const fetchCommitDetails = useCallback(async (commitHash) => {
    if (commitDetails[commitHash]) {
      setExpandedCommit(expandedCommit === commitHash ? null : commitHash);
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/commit-details/${workspaceName}/${repoSlug}/${commitHash}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch commit details');
      }
      
      const data = await response.json();
      
      setCommitDetails((prev) => ({
        ...prev,
        [commitHash]: { ...data },
      }));
      
      setExpandedCommit(commitHash);
    } catch (error) {
      console.error('Error fetching commit details:', error);
    }
  }, [commitDetails, expandedCommit, workspaceName, repoSlug]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Extract just the name part from author string (remove email)
  const formatAuthor = useCallback((authorString) => {
    if (!authorString) return 'Unknown';
    // Extract name from "Name <email@example.com>" format
    const match = authorString.match(/^([^<]+)/);
    return match ? match[1].trim() : authorString;
  }, []);

  const handleToggleExpand = useCallback((commitHash) => {
    fetchCommitDetails(commitHash);
  }, [fetchCommitDetails]);

  // Use all commits instead of just visible ones
  const commitsToShow = useMemo(() => {
    return commits?.recentCommits || [];
  }, [commits]);
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
          <GitCommit className="mr-2" size={20} />
          Repository Commits
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-3 sm:px-6 py-3 text-left font-semibold w-1/2 sm:w-3/5">
                <span className="text-xs sm:text-sm hidden sm:inline">Commit Message</span>
                <span className="text-xs inline sm:hidden">Message</span>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left font-semibold w-1/4 sm:w-1/5">
                <div className="hidden sm:flex items-center">
                  <User size={16} className="mr-1" />
                  <span className="text-xs sm:text-sm">Author</span>
                </div>
                <div className="sm:hidden flex items-center justify-center">
                  <User size={14} />
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-center font-semibold hidden md:table-cell w-1/8">
                <span className="text-xs sm:text-sm">Hash</span>
              </th>
              <th className="px-3 sm:px-6 py-3 text-center font-semibold hidden lg:table-cell w-1/8">
                <div className="flex items-center justify-center">
                  <FileText size={16} className="mr-1" />
                  <span className="text-xs sm:text-sm">Files</span>
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-center font-semibold w-1/4 sm:w-1/8">
                <div className="flex items-center justify-center">
                  <PlusCircle size={14} className="mr-1 text-green-600" />
                  <span className="text-xs sm:text-sm">/</span>
                  <MinusCircle size={14} className="ml-1 text-red-600" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {commitsToShow.map((commit, index) => (
              <CommitRow
                key={commit.hash}
                commit={commit}
                index={index}
                isExpanded={expandedCommit === commit.hash}
                onToggleExpand={handleToggleExpand}
                formatAuthor={formatAuthor}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {(!commits?.recentCommits || commits.recentCommits.length === 0) && (
        <div className="py-8 sm:py-10 text-center text-gray-500">
          <p>No commits found for this repository.</p>
        </div>
      )}
      
      {commits?.recentCommits && commits.recentCommits.length > 0 && (
        <div className="p-3 sm:p-4 text-center border-t">
          <p className="text-sm text-gray-500">
            Showing all {commits.recentCommits.length} commits
          </p>
        </div>
      )}
    </div>
  );
});

export default React.memo(CommitsTab);