const axios = require('axios');
const Student = require('../models/Student');
const { sendEmail } = require('./emailService');

/**
 * Fetches commits for all repositories and checks for inactive users.
 */
const checkInactiveUsers = async () => {
  try {
    const students = await Student.find();
    const notifiedUsers = new Set(); // Track emails we've already notified in this run

    for (const student of students) {
      const { workspaceName, token } = student;

      try {
        // Fetch repositories for the workspace
        const repoResponse = await axios.get(`https://api.bitbucket.org/2.0/repositories/${workspaceName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const repositories = repoResponse.data.values;

        // Step 1: Identify the most recently active project
        let activeRepo = null;
        let latestCommitDate = new Date(0); // Initialize with the oldest possible date

        for (const repo of repositories) {
          const { slug } = repo; // Repository slug

          try {
            // Fetch the latest commit for each repo
            const commitResponse = await axios.get(
              `https://api.bitbucket.org/2.0/repositories/${workspaceName}/${slug}/commits?pagelen=1`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (commitResponse.data.values && commitResponse.data.values.length > 0) {
              const latestCommit = commitResponse.data.values[0]; // Latest commit
              const commitDate = new Date(latestCommit.date);

              if (commitDate > latestCommitDate) {
                latestCommitDate = commitDate;
                activeRepo = slug; // Set as the most recently active repo
              }
            }
          } catch (commitError) {
            console.error(`❌ Error fetching latest commit for repo: ${slug}`, commitError.response?.data || commitError.message);
          }
        }

        if (!activeRepo) {
          console.log(`⚠️ No active repository found for workspace: ${workspaceName}`);
          continue; // Skip this workspace if no active repo is found
        }

        console.log(`✅ Most active repository in ${workspaceName}: ${activeRepo}`);

        // Step 2: Fetch all contributors from the most active repository
        const contributorLastCommit = {};
        try {
          const activeRepoCommitResponse = await axios.get(
            `https://api.bitbucket.org/2.0/repositories/${workspaceName}/${activeRepo}/commits`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const commits = activeRepoCommitResponse.data.values;
          const now = new Date();

          for (const commit of commits) {
            const authorEmail = commit.author.raw.match(/<(.+?)>/)?.[1]; // Extract email from "Author Name <email>"
            
            if (authorEmail) {
              const commitDate = new Date(commit.date);
              
              // Only update if this commit is more recent than any we've seen for this user
              if (!contributorLastCommit[authorEmail] || commitDate > contributorLastCommit[authorEmail]) {
                contributorLastCommit[authorEmail] = commitDate;
              }
            }
          }

          // Step 3: Send reminders to inactive contributors
          for (const [email, lastCommitDate] of Object.entries(contributorLastCommit)) {
            const daysSinceLastCommit = (now - lastCommitDate) / (1000 * 60 * 60 * 24);

            // Only send email if: inactive for 7+ days AND not already notified in this run
            if (daysSinceLastCommit > 7 && !notifiedUsers.has(email)) {
              await sendEmail(
                email,
                '🚨 Commit Reminder - Bitbucket',
                `You have not committed in over a week in the active project '${activeRepo}'. Please push your latest changes.`
              );
              console.log(`📧 Email sent successfully to ${email}`);

              // Add to the set of notified users to prevent duplicate emails
              notifiedUsers.add(email);
            }
          }
        } catch (commitError) {
          console.error(`❌ Error fetching commits for active repo: ${activeRepo}`, commitError.response?.data || commitError.message);
        }
      } catch (repoError) {
        console.error(`❌ Error fetching repositories for workspace: ${workspaceName}`, repoError.response?.data || repoError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error checking inactive users:', error.message);
  }
};

// Run this function every 24 hours
setInterval(checkInactiveUsers, 24 * 60 * 60 * 1000);

module.exports = { checkInactiveUsers };