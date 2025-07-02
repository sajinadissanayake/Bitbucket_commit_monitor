import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import chroma from 'chroma-js';
import ReactPaginate from 'react-paginate';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement);

const Contributions = () => {
  const [contributors, setContributors] = useState([]);
  const [filteredContributors, setFilteredContributors] = useState([]);
  const [authorCommits, setAuthorCommits] = useState({
    labels: [],
    datasets: [],
  });
  const [allCommits, setAllCommits] = useState([]);
  const [filteredCommits, setFilteredCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [commitsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState(''); // State to track the search query
  const { workspace, repoSlug } = useParams();

  useEffect(() => {
    fetchContributors();
  }, [workspace, repoSlug]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contributors.filter((author) =>
        author.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContributors(filtered);
    } else {
      setFilteredContributors(contributors);
    }
  }, [searchQuery, contributors]);

  const fetchContributors = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/commits?workspace=${workspace}&repoSlug=${repoSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('bitbucketToken')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch commits');
      }

      const data = await response.json();
      const commits = data && data.commits ? data.commits : [];
      setAllCommits(commits);

      const authors = {};
      commits.forEach((commit) => {
        const authorName = commit.author.replace(/<.*?>/g, '').trim();
        authors[authorName] = (authors[authorName] || 0) + 1;
      });

      const colors = chroma
        .scale('Set3')
        .mode('lab')
        .colors(Object.keys(authors).length);

      const chartData = {
        labels: Object.keys(authors),
        datasets: [
          {
            label: 'Commits per Author',
            data: Object.values(authors),
            backgroundColor: colors,
          },
        ],
      };

      setContributors(Object.keys(authors));
      setFilteredContributors(Object.keys(authors)); // Set filtered contributors initially
      setAuthorCommits(chartData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorClick = (author) => {
    const filtered = allCommits.filter(
      (commit) =>
        commit.author.replace(/<.*?>/g, '').trim() === author
    );
    setFilteredCommits(filtered);
  };

  const totalCommits = allCommits.length;
  const avgCommitsPerAuthor = Math.round(totalCommits / contributors.length);

  const indexOfLastCommit = (currentPage + 1) * commitsPerPage;
  const indexOfFirstCommit = indexOfLastCommit - commitsPerPage;
  const currentCommits = filteredCommits.length
    ? filteredCommits.slice(indexOfFirstCommit, indexOfLastCommit)
    : allCommits.slice(indexOfFirstCommit, indexOfLastCommit);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 flex justify-center items-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
              Contribution History
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-10 pointer-events-none"></div>
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
                    <div className="text-lg font-semibold">Total Commits:</div>
                    <div className="text-2xl font-extrabold">{totalCommits}</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-4 rounded-lg shadow-lg w-full md:w-auto">
                    <div className="text-lg font-semibold">Average Commits per Author:</div>
                    <div className="text-2xl font-extrabold">{avgCommitsPerAuthor}</div>
                  </div>
                </div>
                {/* Search Box */}
                <div className="mb-6 flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Search contributors..."
                    className="px-4 py-2 rounded-lg border border-gray-300 w-full md:w-1/3"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 bg-white p-4 shadow-md rounded-lg">
                    <h3 className="text-xl font-bold mb-6 text-gray-800">Contributors:</h3>
                    <ul className="space-y-4">
                      {filteredContributors && filteredContributors.length > 0 ? (
                        filteredContributors.map((author) => (
                          <li
                            key={author}
                            className="cursor-pointer flex items-center p-3 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg shadow-md hover:bg-gradient-to-r hover:from-purple-500 hover:to-red-600 transition duration-300 ease-in-out transform hover:scale-105"
                            onClick={() => handleAuthorClick(author)}
                          >
                            <div className="mr-4 w-8 h-8 bg-white text-purple-700 rounded-full flex items-center justify-center font-semibold">
                              {author.charAt(0).toUpperCase()}
                            </div>
                            <span>{author}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No contributors found.</li>
                      )}
                    </ul>
                  </div>
                  <div className="w-full md:w-2/3">
                    <Bar
                      data={authorCommits}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (tooltipItem) => {
                                const author = tooltipItem.label;
                                const commitCount = tooltipItem.raw;
                                return `${author}: ${commitCount} commits`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                {currentCommits.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Commits ({currentCommits.length} of {totalCommits}):
                    </h3>
                    <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <th className="px-6 py-3 text-left">Commit Message</th>
                          <th className="px-6 py-3 text-left">Author</th>
                          <th className="px-6 py-3 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCommits.map((commit) => (
                          <tr key={commit.hash} className="hover:bg-gray-100">
                            <td className="px-6 py-4">{commit.message}</td>
                            <td className="px-6 py-4">{commit.author.replace(/<.*?>/g, '').trim()}</td>
                            <td className="px-6 py-4">{new Date(commit.date).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ReactPaginate
                      pageCount={Math.ceil(filteredCommits.length ? filteredCommits.length / commitsPerPage : totalCommits / commitsPerPage)}
                      onPageChange={handlePageChange}
                      containerClassName="flex justify-center mt-6"
                      pageClassName="mx-2 bg-gray-300 hover:bg-gray-400 rounded px-4 py-2"
                      activeClassName="bg-blue-500 text-white"
                      previousClassName="mx-2 bg-gray-300 hover:bg-gray-400 rounded px-4 py-2"
                      nextClassName="mx-2 bg-gray-300 hover:bg-gray-400 rounded px-4 py-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;

