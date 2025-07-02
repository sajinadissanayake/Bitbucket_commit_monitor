import React, { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';

const Contributors = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContributors, setFilteredContributors] = useState([]);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    fetchContributors();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contributors.filter((contributor) =>
        contributor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContributors(filtered);
    } else {
      setFilteredContributors(contributors);
    }
  }, [searchQuery, contributors]);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/contributors`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch contributors');
      }

      const processedData = processContributorsData(data.contributors || []);
      setContributors(processedData);
      setFilteredContributors(processedData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processContributorsData = (rawData) => {
    const contributorMap = new Map();

    rawData.forEach(contributor => {
      const { name, repositories } = contributor;
      
      if (!contributorMap.has(name)) {
        contributorMap.set(name, {
          name,
          workspaces: new Set(),
          repositories: new Map()
        });
      }

      const contributorData = contributorMap.get(name);
      repositories.forEach(repo => {
        contributorData.workspaces.add(repo.workspace);
        if (!contributorData.repositories.has(repo.workspace)) {
          contributorData.repositories.set(repo.workspace, new Set());
        }
        contributorData.repositories.get(repo.workspace).add({
          name: repo.name,
          commits: repo.commits
        });
      });
    });

    return Array.from(contributorMap.values()).map(({ name, workspaces, repositories }) => ({
      name,
      workspaces: Array.from(workspaces),
      repositories: Array.from(repositories.entries()).map(([workspace, repos]) => ({
        workspace,
        repos: Array.from(repos)
      }))
    }));
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const paginatedData = filteredContributors.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const totalContributors = filteredContributors.length;
  const totalWorkspaces = [...new Set(filteredContributors.flatMap(c => c.workspaces))].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 flex justify-center items-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
              Contributors Overview
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-10"></div>
            <div className="absolute top-0 left-0 w-12 h-12 bg-indigo-500 rounded-full blur-xl opacity-30 transform -translate-x-6 -translate-y-6"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 bg-blue-500 rounded-full blur-xl opacity-30 transform translate-x-6 translate-y-6"></div>
          </div>

          <div className="p-6 md:p-8 bg-gray-50">
            {loading ? (
              <div className="flex justify-center items-center text-xl text-gray-600">
                <div className="loader"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 font-bold">{error}</div>
            ) : (
              <div>
                <div className="stats mb-8 flex gap-6 justify-between">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white p-4 rounded-lg shadow-lg w-full md:w-auto">
                    <div className="text-lg font-semibold">Total Contributors:</div>
                    <div className="text-2xl font-extrabold">{totalContributors}</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-4 rounded-lg shadow-lg w-full md:w-auto">
                    <div className="text-lg font-semibold">Total Workspaces:</div>
                    <div className="text-2xl font-extrabold">{totalWorkspaces}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search contributors..."
                    className="px-4 py-2 rounded-lg border border-gray-300 w-full md:w-1/3"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Workspaces</th>
                        <th className="px-6 py-3 text-left">Repositories</th>
                        <th className="px-6 py-3 text-left">Recent Commits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((contributor) => (
                        contributor.workspaces.map((workspace, workspaceIndex) => (
                          <tr 
                            key={`${contributor.name}-${workspace}-${workspaceIndex}`}
                            className="hover:bg-gray-50 border-t border-gray-200"
                          >
                            {workspaceIndex === 0 && (
                              <td
                                className="px-6 py-4"
                                rowSpan={contributor.workspaces.length}
                              >
                                <div className="font-semibold text-gray-900">{contributor.name}</div>
                              </td>
                            )}
                            <td className="px-6 py-4 text-gray-700">{workspace}</td>
                            <td className="px-6 py-4 text-gray-700">
                              {contributor.repositories
                                .find(r => r.workspace === workspace)?.repos
                                .map(r => r.name)
                                .join(', ')}
                            </td>
                            <td className="px-6 py-4">
                              {contributor.repositories
                                .find(r => r.workspace === workspace)?.repos
                                .map(repo => (
                                  <div key={repo.name} className="mb-3 last:mb-0">
                                    <div className="font-medium text-indigo-600 mb-1">{repo.name}</div>
                                    {repo.commits ? (
                                      <ul class="list-disc">
                                        {repo.commits.map(commit => (
                                          <li key={commit.hash} className="text-sm">
                                            
                                            <span className="text-gray-700">{commit.message.split('\n')[0]}</span>{' '}
                                            <span className="text-gray-400">({formatDate(commit.date)})</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-400 text-sm">No recent commits</span>
                                    )}
                                  </div>
                                ))}
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>

                <ReactPaginate
                  pageCount={Math.ceil(filteredContributors.length / itemsPerPage)}
                  onPageChange={handlePageChange}
                  containerClassName="flex justify-center mt-6 gap-2"
                  pageClassName="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow"
                  activeClassName="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                  previousClassName="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow"
                  nextClassName="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow"
                  disabledClassName="opacity-50 cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributors;