import React, { useState } from 'react';
import axios from 'axios';
import './CompareCommits.css';  // Import the CSS file here

const CompareCommits = () => {
  const [workspace, setWorkspace] = useState('');
  const [repoSlug, setRepoSlug] = useState('');
  const [fromCommit, setFromCommit] = useState('');
  const [toCommit, setToCommit] = useState('');
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('access_token'); // Assumes you are storing the access token locally

    if (!token) {
      setError('Access token is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/compare-commits', {
        params: {
          workspace,
          repoSlug,
          fromCommit,
          toCommit
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setChanges(response.data.changes);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch commit differences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare-commits-container">
      <h2>Compare Commits</h2>
      
      <div>
        <label>Workspace:</label>
        <input
          type="text"
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          placeholder="Enter workspace"
        />
      </div>

      <div>
        <label>Repo Slug:</label>
        <input
          type="text"
          value={repoSlug}
          onChange={(e) => setRepoSlug(e.target.value)}
          placeholder="Enter repository slug"
        />
      </div>

      <div>
        <label>From Commit:</label>
        <input
          type="text"
          value={fromCommit}
          onChange={(e) => setFromCommit(e.target.value)}
          placeholder="Enter from commit hash"
        />
      </div>

      <div>
        <label>To Commit:</label>
        <input
          type="text"
          value={toCommit}
          onChange={(e) => setToCommit(e.target.value)}
          placeholder="Enter to commit hash"
        />
      </div>

      <button onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparing...' : 'Compare Commits'}
      </button>

      {error && <div className="error">{error}</div>}

      {changes.length > 0 && (
        <div className="changes">
          <h3>Changes Between Commits</h3>
          <ul>
            {changes.map((change, index) => (
              <li key={index}>
                <strong>{change.type.toUpperCase()}</strong>: {change.path}
                {change.type === 'modified' && (
                  <div>
                    <p>From: {change.from}</p>
                    <p>To: {change.to}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompareCommits;
