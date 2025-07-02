const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');

const BITBUCKET_API_URL = 'https://api.bitbucket.org/2.0';
const bitbucketCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Cached Bitbucket API Fetch with Concurrency Control
async function fetchBitbucketData(url, token, params = {}) {
    const cacheKey = `${url}:${JSON.stringify(params)}`;
    
    const cachedData = bitbucketCache.get(cacheKey);
    if (cachedData) return cachedData;
    
    try {
        const response = await axios.get(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            params: { pagelen: 100, ...params }
        });
        
        bitbucketCache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error(`API fetch error for ${url}:`, error.message);
        throw error;
    }
}

// Helper function to fetch all pages of commits
async function fetchAllCommits(workspaceName, repoSlug, token) {
    let allCommits = [];
    let url = `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`;
    
    // Keep fetching until there are no more pages
    while (url) {
        console.log(`Fetching commits from: ${url}`);
        const response = await axios.get(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            params: { 
                pagelen: 100,  // Use standard page size for each request
                sort: '-date'
            }
        });
        
        // Add the commits from this page
        allCommits = [...allCommits, ...response.data.values];
        
        // Check if there's another page
        url = response.data.next;
    }
    
    console.log(`Total commits fetched: ${allCommits.length}`);
    return allCommits;
}

// Admin Signup
router.post(
    '/signup',
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if admin username already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin username already exists' });
        }

        // Hash password and save the admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ username, password: hashedPassword });
        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    })
);

// Admin Login
router.post(
    '/login',
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find admin by username
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Send success response
        res.status(200).json({ 
            message: 'Login successful',
            admin: { username: admin.username }
        });
    })
);
// Fetch All Groups with Members
router.get(
    '/groups',
    asyncHandler(async (req, res) => {
        try {
            // Get all students with all fields
            const students = await Student.find({}).lean();
            console.log("Found students:", students.length);
            
            if (students.length === 0) {
                return res.status(404).json({ message: 'No students found' });
            }
            
            // Log a sample student for debugging
            if (students.length > 0) {
                const sample = students[0];
                console.log("Sample student data:", {
                    name: sample.name,
                    groupNumber: sample.groupNumber,
                    dates: {
                        projectStartDate: sample.projectStartDate,
                        projectStartDateType: typeof sample.projectStartDate,
                        projectStartDateStr: sample.projectStartDate ? sample.projectStartDate.toString() : null,
                        projectEndDate: sample.projectEndDate,
                        projectEndDateType: typeof sample.projectEndDate,
                        projectEndDateStr: sample.projectEndDate ? sample.projectEndDate.toString() : null
                    },
                    teamMembers: sample.teamMembers
                });
            }
            
            // Group students by groupNumber
            const groupsMap = {};
            
            students.forEach(student => {
                const groupNumber = student.groupNumber;
                
                if (!groupsMap[groupNumber]) {
                    groupsMap[groupNumber] = {
                        groupNumber: groupNumber,
                        members: [],
                        totalMembers: 0,
                        projectDetails: {
                            projectName: student.projectName,
                            projectStartDate: student.projectStartDate ? student.projectStartDate.toISOString() : null,
                            projectEndDate: student.projectEndDate ? student.projectEndDate.toISOString() : null
                        }
                    };
                }
                
                // Add the student as a member with all relevant fields
                groupsMap[groupNumber].members.push({
                    _id: student._id.toString(),
                    name: student.name,
                    workspaceName: student.workspaceName,
                    token: student.token,
                    role: student.role,
                    email: student.username,
                    teamMembers: student.teamMembers || []
                });
                
                groupsMap[groupNumber].totalMembers++;
            });
            
            // Convert to array and sort
            const groups = Object.values(groupsMap).sort((a, b) => {
                return a.groupNumber.localeCompare(b.groupNumber, undefined, { numeric: true });
            });
            
            console.log("Sending groups:", groups.length);
            
            // Log sample project details for debugging
            if (groups.length > 0) {
                console.log("Sample group project details:", JSON.stringify(groups[0].projectDetails));
                console.log("Sample group team members:", groups[0].members.map(m => ({
                    name: m.name,
                    role: m.role,
                    teamMembers: m.teamMembers ? m.teamMembers.length : 0
                })));
            }
            
            res.setHeader('Cache-Control', 'no-cache');
            res.status(200).json(groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.status(500).json({ message: 'Server error fetching groups', error: error.message });
        }
    })
);

// Fetch Workspace Projects
router.get(
    '/workspace-projects/:workspaceName',
    asyncHandler(async (req, res) => {
        const { workspaceName } = req.params;
        const student = await Student.findOne({ workspaceName });
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            const response = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            const repositories = response.data.values.map(repo => ({
                name: repo.name,
                slug: repo.slug,
                uuid: repo.uuid,
                updated_on: repo.updated_on,
                mainbranch: repo.mainbranch?.name || 'main',
                project: repo.project?.name || 'Default'
            }));

            res.status(200).json(repositories);
        } catch (error) {
            console.error(`Error fetching repositories for ${workspaceName}:`, error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: 'Error fetching workspace projects',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Fetch Last Two Commits
router.get(
    '/commits/:workspaceName/:repoSlug',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 1; // Default to 1 commit
        const student = await Student.findOne({ workspaceName });
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            const response = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    },
                    params: { 
                        pagelen: limit,
                        sort: '-date'
                    }
                }
            );

            const commits = response.data.values.map(commit => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author.raw,
                links: commit.links
            }));

            res.status(200).json(commits);
        } catch (error) {
            console.error(`Error fetching commits for ${workspaceName}/${repoSlug}:`, error.message);
            res.status(500).json({ 
                message: 'Error fetching commits',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Fetch All Commits (New Endpoint)
router.get(
    '/all-commits/:workspaceName/:repoSlug',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug } = req.params;
        const student = await Student.findOne({ workspaceName }).lean();
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            // First find all students for this workspace to help with name matching
            const allStudents = await Student.find({ groupNumber: student.groupNumber }).lean();
            const studentNames = new Set(allStudents.map(s => s.name.toLowerCase()));
            
            // Add all team members from all students
            allStudents.forEach(s => {
                if (s.teamMembers && s.teamMembers.length > 0) {
                    s.teamMembers.forEach(member => {
                        studentNames.add(member.name.toLowerCase());
                    });
                }
            });
            
            console.log(`Found ${studentNames.size} team member names for matching in workspace ${workspaceName}`);
            
            const response = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    },
                    params: { 
                        pagelen: 100,  // Get more commits
                        sort: '-date'
                    }
                }
            );

            const commits = response.data.values.map(commit => {
                const authorRaw = commit.author.raw;
                const authorName = authorRaw.split('<')[0].trim();
                
                // Try to match this author with a student name
                let matchedName = authorName;
                let matchType = 'exact';
                
                const authorLower = authorName.toLowerCase();
                if (!studentNames.has(authorLower)) {
                    // Try to find a partial match
                    for (const name of studentNames) {
                        if (authorLower.includes(name) || 
                            name.includes(authorLower) || 
                            (authorRaw.toLowerCase().includes('@') && 
                             authorRaw.toLowerCase().includes(name))) {
                            matchedName = Array.from(studentNames)
                                .find(n => n.toLowerCase() === name) || authorName;
                            matchType = 'partial';
                            break;
                        }
                    }
                }
                
                return {
                    hash: commit.hash,
                    date: commit.date,
                    message: commit.message,
                    author: authorRaw,
                    matchedName: matchedName,
                    matchType: matchType
                };
            });

            res.status(200).json(commits);
        } catch (error) {
            console.error(`Error fetching all commits for ${workspaceName}/${repoSlug}:`, error.message);
            res.status(500).json({ 
                message: 'Error fetching all commits',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Fetch Project Contributions
router.get(
    '/contributions/:workspaceName/:repoSlug',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug } = req.params;
        const student = await Student.findOne({ workspaceName });
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            const now = new Date();
            const lastWeekDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const lastMonthDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const todayStart = new Date(now.setHours(0, 0, 0, 0));

            const response = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    },
                    params: { 
                        pagelen: 100
                    }
                }
            );

            const commits = response.data.values;
            
            const contributionData = {
                totalCommits: commits.length,
                todayCommits: 0,
                lastWeekCommits: 0,
                lastMonthCommits: 0,
                authorStats: {},
                timelineData: []
            };

            commits.forEach(commit => {
                const commitDate = new Date(commit.date);
                const author = commit.author.raw;

                if (!contributionData.authorStats[author]) {
                    contributionData.authorStats[author] = {
                        totalCommits: 0,
                        todayCommits: 0,
                        lastWeekCommits: 0,
                        lastMonthCommits: 0
                    };
                }

                contributionData.authorStats[author].totalCommits++;

                if (commitDate >= todayStart) {
                    contributionData.todayCommits++;
                    contributionData.authorStats[author].todayCommits++;
                }
                if (commitDate >= lastWeekDate) {
                    contributionData.lastWeekCommits++;
                    contributionData.authorStats[author].lastWeekCommits++;
                }
                if (commitDate >= lastMonthDate) {
                    contributionData.lastMonthCommits++;
                    contributionData.authorStats[author].lastMonthCommits++;
                }
            });

            const timelineMap = new Map();
            commits.forEach(commit => {
                const date = new Date(commit.date).toISOString().split('T')[0];
                const author = commit.author.raw;
                
                if (!timelineMap.has(date)) {
                    timelineMap.set(date, {
                        date,
                        total: 0
                    });
                }
                
                const dateEntry = timelineMap.get(date);
                dateEntry.total++;
                dateEntry[author] = (dateEntry[author] || 0) + 1;
            });

            contributionData.timelineData = Array.from(timelineMap.values())
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            Object.keys(contributionData.authorStats).forEach(author => {
                const stats = contributionData.authorStats[author];
                stats.percentage = ((stats.totalCommits / contributionData.totalCommits) * 100).toFixed(1);
            });

            res.status(200).json(contributionData);
        } catch (error) {
            console.error(`Error fetching contributions for ${workspaceName}/${repoSlug}:`, error.message);
            res.status(500).json({ 
                message: 'Error fetching contributions',
                error: error.response?.data?.error?.message || error.message 
            });
        }
    })
);


router.get('/all-contributors', asyncHandler(async (req, res) => {
    try {
        const groups = await Student.aggregate([
            {
                $group: {
                    _id: '$groupNumber',
                    members: {
                        $push: {
                            name: '$name',
                            workspaceName: '$workspaceName',
                            token: '$token'
                        }
                    }
                }
            }
        ]);

        const allContributorsData = [];
        const limit = req.query.limit ? parseInt(req.query.limit) : 1; // Default to 1 commit

        // Process groups sequentially to prevent overwhelming API
        for (const group of groups) {
            for (const member of group.members) {
                try {
                    // Fetch repositories 
                    const reposData = await fetchBitbucketData(
                        `${BITBUCKET_API_URL}/repositories/${member.workspaceName}`, 
                        member.token
                    );

                    // Process each repository
                    for (const repo of reposData.values) {
                        try {
                            const commitsData = await fetchBitbucketData(
                                `${BITBUCKET_API_URL}/repositories/${member.workspaceName}/${repo.slug}/commits`, 
                                member.token
                            );

                            // Group commits by author
                            const commitsByAuthor = {};
                            commitsData.values.forEach(commit => {
                                const author = commit.author.raw;
                                if (!commitsByAuthor[author]) {
                                    commitsByAuthor[author] = [];
                                }
                                if (commitsByAuthor[author].length < limit) {
                                    commitsByAuthor[author].push({
                                        hash: commit.hash,
                                        message: commit.message,
                                        date: commit.date,
                                        projectName: repo.name,
                                        projectSlug: repo.slug,
                                        workspaceName: member.workspaceName
                                    });
                                }
                            });

                            // Merge contributors data
                            Object.entries(commitsByAuthor).forEach(([author, commits]) => {
                                const existingAuthor = allContributorsData.find(c => c.author === author);
                                if (existingAuthor) {
                                    existingAuthor.commits.push(...commits);
                                    existingAuthor.commits.sort((a, b) => new Date(b.date) - new Date(a.date));
                                    existingAuthor.commits = existingAuthor.commits.slice(0, limit);
                                } else {
                                    allContributorsData.push({
                                        author,
                                        commits: commits.slice(0, limit)
                                    });
                                }
                            });
                        } catch (commitError) {
                            console.error(`Commits fetch error for ${member.workspaceName}/${repo.slug}:`, commitError.message);
                        }
                    }
                } catch (repoError) {
                    console.error(`Repositories fetch error for ${member.workspaceName}:`, repoError.message);
                }
            }
        }

        res.status(200).json(allContributorsData);
    } catch (error) {
        console.error('Contributors fetch error:', error);
        res.status(500).json({
            message: 'Error fetching contributors data',
            error: error.response?.data?.error?.message || error.message
        });
    }
}));



//analytics
router.get(
    '/repository-analytics/:workspaceName/:repoSlug',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug } = req.params;
        const student = await Student.findOne({ workspaceName });

        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            // Fetch all commits using pagination
            const allCommits = await fetchAllCommits(workspaceName, repoSlug, student.token);
            
            // Process commits data
            const commits = allCommits.map(commit => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author.raw,
                links: commit.links
            }));

            // Fetch repository info
            const repoInfoResponse = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            // Aggregate commit statistics
            const authorStats = {};
            const timelineData = {};

            const today = new Date();
            for (let i = 30; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                timelineData[dateString] = { date: dateString, total: 0 };
            }

            // Process commits for statistics
            for (const commit of commits) {
                const author = commit.author.split('<')[0].trim();
                if (!authorStats[author]) {
                    authorStats[author] = { totalCommits: 0, lastCommit: null };
                }
                authorStats[author].totalCommits += 1;

                const commitDate = new Date(commit.date);
                if (!authorStats[author].lastCommit || 
                    new Date(authorStats[author].lastCommit) < commitDate) {
                    authorStats[author].lastCommit = commit.date;
                }

                const dateString = commitDate.toISOString().split('T')[0];
                if (timelineData[dateString]) {
                    timelineData[dateString].total += 1;
                    if (!timelineData[dateString][author]) {
                        timelineData[dateString][author] = 0;
                    }
                    timelineData[dateString][author] += 1;
                }
            }

            // Convert timeline data to array
            const timelineArray = Object.values(timelineData);

            // Calculate total commits
            const totalCommits = commits.length;
            Object.keys(authorStats).forEach(author => {
                authorStats[author].percentage = 
                    ((authorStats[author].totalCommits / totalCommits) * 100).toFixed(1);
            });

            // Count commits from the last day, week, month
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

            const todayCommits = commits.filter(commit => 
                new Date(commit.date) >= oneDayAgo).length;
            const lastWeekCommits = commits.filter(commit => 
                new Date(commit.date) >= oneWeekAgo).length;
            const lastMonthCommits = commits.filter(commit => 
                new Date(commit.date) >= oneMonthAgo).length;

            // 🔥 Fetch commit details (files changed, lines added/removed)
            const detailedCommits = await Promise.all(
                commits.map(async commit => {
                    try {
                        const diffstatResponse = await axios.get(
                            `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/diffstat/${commit.hash}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${student.token}`,
                                    'Accept': 'application/json'
                                }
                            }
                        );

                        const filesChanged = diffstatResponse.data.values.length;
                        let linesAdded = 0;
                        let linesRemoved = 0;

                        diffstatResponse.data.values.forEach(file => {
                            linesAdded += file.lines_added || 0;
                            linesRemoved += file.lines_removed || 0;
                        });

                        return {
                            ...commit,
                            filesChanged,
                            linesAdded,
                            linesRemoved
                        };
                    } catch (err) {
                        console.error(`Error fetching diffstat for commit ${commit.hash}:`, err.message);
                        return { ...commit, filesChanged: 0, linesAdded: 0, linesRemoved: 0 };
                    }
                })
            );

            // Send response
            res.status(200).json({
                repository: {
                    name: repoInfoResponse.data.name,
                    description: repoInfoResponse.data.description,
                    created_on: repoInfoResponse.data.created_on,
                    updated_on: repoInfoResponse.data.updated_on,
                    language: repoInfoResponse.data.language,
                    size: repoInfoResponse.data.size,
                    links: repoInfoResponse.data.links
                },
                commits: {
                    totalCommits,
                    todayCommits,
                    lastWeekCommits,
                    lastMonthCommits,
                    authorStats,
                    timelineData: timelineArray,
                    recentCommits: detailedCommits // Updated with commit details
                }
            });
        } catch (error) {
            console.error(`Error fetching repository analytics for ${workspaceName}/${repoSlug}:`, error.message);
            res.status(500).json({ 
                message: 'Error fetching repository analytics',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Fetch All Projects with Members and Details
router.get(
    '/projects',
    asyncHandler(async (req, res) => {
        try {
            const projects = await Student.find({}, {
                projectName: 1,
                projectStartDate: 1,
                projectEndDate: 1,
                groupNumber: 1,
                workspaceName: 1,
                token: 1,
                role: 1,
                teamMembers: 1
            });

            if (!projects.length) {
                return res.status(404).json({ message: 'No projects found' });
            }

            // Transform the data for frontend use
            const formattedProjects = projects.map(project => {
                // Extract technology stack from group number (e.g., "MERN 1" -> "MERN")
                const techStack = project.groupNumber.split(' ')[0];
                
                // Create team members array including the project owner
                const allTeamMembers = [
                    { name: project.name, role: project.role, isOwner: true }
                ];
                
                // Add other team members if they exist
                if (project.teamMembers && project.teamMembers.length > 0) {
                    project.teamMembers.forEach(member => {
                        allTeamMembers.push({
                            name: member.name,
                            role: member.role,
                            isOwner: false
                        });
                    });
                }
                
                return {
                    id: project._id,
                    projectName: project.projectName,
                    startDate: project.projectStartDate,
                    endDate: project.projectEndDate,
                    techStack: techStack,
                    workspaceName: project.workspaceName,
                    token: project.token,
                    teamMembers: allTeamMembers,
                    groupNumber: project.groupNumber
                };
            });

            res.status(200).json(formattedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ 
                message: 'Error fetching projects',
                error: error.message
            });
        }
    })
);

// Fetch Commits by Developer
router.get(
    '/developer-commits/:workspaceName/:repoSlug/:developer',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug, developer } = req.params;
        const student = await Student.findOne({ workspaceName }).lean();
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            console.log(`Fetching commits for developer: ${developer} in repo: ${workspaceName}/${repoSlug}`);
            
            // First, fetch all contributors with mappings to establish the relationship
            // between team member names and their Bitbucket identities
            const contributorsResponse = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    },
                    params: { 
                        pagelen: 100
                    }
                }
            );
            
            // Get all students in this group
            const groupStudents = await Student.find({ groupNumber: student.groupNumber }).lean();
            
            // Map of contributors keyed by their raw author string
            const contributors = new Map();
            
            // Process all commits to identify contributors
            contributorsResponse.data.values.forEach(commit => {
                const authorRaw = commit.author.raw;
                const authorName = authorRaw.split('<')[0].trim();
                const authorEmail = authorRaw.includes('<') ? 
                    authorRaw.split('<')[1].split('>')[0].trim() : null;
                
                // Extract username from email if possible
                const username = authorEmail ? 
                    (authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail) : 
                    null;
                
                if (!contributors.has(authorRaw)) {
                    contributors.set(authorRaw, {
                        name: authorName,
                        email: authorEmail,
                        username: username,
                        possibleMatch: null,
                        commits: []
                    });
                }
                
                // Add this commit to the contributor's list
                contributors.get(authorRaw).commits.push({
                    hash: commit.hash,
                    date: commit.date,
                    message: commit.message,
                    author: authorRaw
                });
            });
            
            // Try to find matches for the requested developer
            const developerLower = developer.toLowerCase().trim();
            let matchedContributorKeys = [];
            
            // Special case for Kavindu80 -> Kavindu Liyanage
            const isKavinduLiyanage = developerLower.includes('kavindu') && 
                                       developerLower.includes('liyanage');
            
            // For each contributor, check if they match our developer
            for (const [authorRaw, contributor] of contributors.entries()) {
                const authorNameLower = contributor.name.toLowerCase();
                const authorUsername = contributor.username ? contributor.username.toLowerCase() : '';
                
                // Try various matching strategies
                
                // 1. Direct name match
                if (authorNameLower === developerLower) {
                    matchedContributorKeys.push(authorRaw);
                    contributor.possibleMatch = 'exact';
                    continue;
                }
                
                // 2. Name contains match
                if (authorNameLower.includes(developerLower) || 
                    developerLower.includes(authorNameLower)) {
                    matchedContributorKeys.push(authorRaw);
                    contributor.possibleMatch = 'partial';
                    continue;
                }
                
                // 3. First name match
                const devFirstName = developerLower.split(' ')[0];
                const authorFirstName = authorNameLower.split(' ')[0];
                if (devFirstName === authorFirstName) {
                    matchedContributorKeys.push(authorRaw);
                    contributor.possibleMatch = 'first-name';
                    continue;
                }
                
                // 4. Special case for Kavindu80 -> Kavindu Liyanage
                if (isKavinduLiyanage && 
                    (authorUsername === 'kavindu80' || 
                     authorNameLower.includes('kavindu'))) {
                    matchedContributorKeys.push(authorRaw);
                    contributor.possibleMatch = 'special-case';
                    continue;
                }
                
                // 5. Email username match
                if (contributor.username && developerLower.includes(contributor.username)) {
                    matchedContributorKeys.push(authorRaw);
                    contributor.possibleMatch = 'email';
                    continue;
                }
            }
            
            console.log(`Found ${matchedContributorKeys.length} possible contributors matching ${developer}`);
            
            // Collect all commits from the matched contributors
            let developerCommits = [];
            matchedContributorKeys.forEach(key => {
                developerCommits = [...developerCommits, ...contributors.get(key).commits];
            });
            
            // If no matches found but this developer is the project owner, 
            // return at least the most recent commit
            if (developerCommits.length === 0 && 
                groupStudents.some(s => s.name.toLowerCase() === developerLower)) {
                console.log(`No commits found for owner ${developer}, returning most recent commit`);
                
                // Get the most recent commit from any contributor
                let allCommits = [];
                contributors.forEach(contributor => {
                    allCommits = [...allCommits, ...contributor.commits];
                });
                
                // Sort by date (newest first)
                allCommits.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                if (allCommits.length > 0) {
                    const mostRecent = allCommits[0];
                    developerCommits = [{
                        hash: mostRecent.hash,
                        date: mostRecent.date,
                        message: mostRecent.message + " (Owner Attributed)",
                        author: developer + " (Repository Owner)"
                    }];
                }
            }
            
            // Sort by date (newest first) and limit to 5 commits
            developerCommits.sort((a, b) => new Date(b.date) - new Date(a.date));
            const recentCommits = developerCommits.slice(0, 5);
            
            console.log(`Returning ${recentCommits.length} commits for ${developer}`);
            res.status(200).json(recentCommits);
        } catch (error) {
            console.error(`Error fetching commits for developer ${developer}:`, error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: 'Error fetching developer commits',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Get project details by group number
router.get(
    '/project-details/:groupNumber',
    asyncHandler(async (req, res) => {
        try {
            const { groupNumber } = req.params;
            
            // Find students in this group
            const students = await Student.find({ groupNumber }).lean();
            
            if (!students || students.length === 0) {
                return res.status(404).json({ message: 'No students found for this group number' });
            }
            
            // Use the first student's project details
            const firstStudent = students[0];
            
            // Create team members array
            const teamMembers = [];
            const processedNames = new Set();
            
            // Add all students from this group
            students.forEach(student => {
                if (!processedNames.has(student.name)) {
                    teamMembers.push({
                        name: student.name,
                        role: student.role,
                        email: student.username,
                        isOwner: student._id.toString() === firstStudent._id.toString()
                    });
                    processedNames.add(student.name);
                }
                
                // Add their team members
                if (student.teamMembers && student.teamMembers.length > 0) {
                    student.teamMembers.forEach(member => {
                        if (!processedNames.has(member.name)) {
                            teamMembers.push({
                                name: member.name,
                                role: member.role,
                                isOwner: false
                            });
                            processedNames.add(member.name);
                        }
                    });
                }
            });
            
            // Format the project data
            const projectData = {
                groupNumber: groupNumber,
                projectName: firstStudent.projectName,
                projectStartDate: firstStudent.projectStartDate ? firstStudent.projectStartDate.toISOString() : null,
                projectEndDate: firstStudent.projectEndDate ? firstStudent.projectEndDate.toISOString() : null,
                techStack: groupNumber.split(' ')[0],
                teamMembers: teamMembers,
                workspaceName: firstStudent.workspaceName,
                token: firstStudent.token
            };
            
            res.status(200).json(projectData);
        } catch (error) {
            console.error(`Error fetching project details for group ${req.params.groupNumber}:`, error);
            res.status(500).json({ 
                message: 'Error fetching project details',
                error: error.message
            });
        }
    })
);

// Fetch Repository Contributors with Name Mapping
router.get(
    '/repository-contributors/:workspaceName/:repoSlug',
    asyncHandler(async (req, res) => {
        const { workspaceName, repoSlug } = req.params;
        const student = await Student.findOne({ workspaceName }).lean();
        
        if (!student) {
            return res.status(404).json({ message: 'Student workspace not found' });
        }

        try {
            // Get all students in this group to have complete team information
            const groupStudents = await Student.find({ groupNumber: student.groupNumber }).lean();
            
            // Build a list of all team members (students + their team members)
            const allTeamMembers = [];
            
            // First add all the students themselves
            groupStudents.forEach(s => {
                allTeamMembers.push({
                    name: s.name,
                    role: s.role,
                    isStudent: true,
                    bitbucketUsername: s.bitbucketUsername || null
                });
                
                // Then add their team members
                if (s.teamMembers && s.teamMembers.length > 0) {
                    s.teamMembers.forEach(member => {
                        allTeamMembers.push({
                            name: member.name,
                            role: member.role,
                            isStudent: false,
                            bitbucketUsername: member.bitbucketUsername || null
                        });
                    });
                }
            });
            
            console.log(`Found ${allTeamMembers.length} team members for group ${student.groupNumber}`);
            
            // Now fetch contributors from Bitbucket
            const response = await axios.get(
                `${BITBUCKET_API_URL}/repositories/${workspaceName}/${repoSlug}/commits`,
                {
                    headers: { 
                        'Authorization': `Bearer ${student.token}`,
                        'Accept': 'application/json'
                    },
                    params: { 
                        pagelen: 100
                    }
                }
            );
            
            // Extract unique contributors from commits
            const contributors = new Map();
            
            response.data.values.forEach(commit => {
                const authorRaw = commit.author.raw;
                const authorName = authorRaw.split('<')[0].trim();
                const authorEmail = authorRaw.includes('<') ? 
                    authorRaw.split('<')[1].split('>')[0].trim() : null;
                
                // Extract username from email if possible
                const username = authorEmail ? 
                    (authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail) : 
                    null;
                
                if (!contributors.has(authorRaw)) {
                    contributors.set(authorRaw, {
                        name: authorName,
                        email: authorEmail,
                        username: username,
                        commits: 0,
                        lastCommit: null,
                        matchedMember: null
                    });
                }
                
                const contributor = contributors.get(authorRaw);
                contributor.commits++;
                
                // Update last commit if needed
                if (!contributor.lastCommit || new Date(commit.date) > new Date(contributor.lastCommit)) {
                    contributor.lastCommit = commit.date;
                }
            });
            
            // Now try to match contributors to team members
            for (const [authorRaw, contributor] of contributors.entries()) {
                // Various matching strategies
                const authorNameLower = contributor.name.toLowerCase();
                const authorUsername = contributor.username ? contributor.username.toLowerCase() : null;
                
                // Try different matching strategies
                for (const member of allTeamMembers) {
                    const memberNameLower = member.name.toLowerCase();
                    
                    // 1. Direct name match
                    if (authorNameLower === memberNameLower) {
                        contributor.matchedMember = member.name;
                        contributor.matchType = 'exact-name';
                        break;
                    }
                    
                    // 2. Name contains match
                    if (authorNameLower.includes(memberNameLower) || 
                        memberNameLower.includes(authorNameLower)) {
                        contributor.matchedMember = member.name;
                        contributor.matchType = 'partial-name';
                        continue; // Continue looking for better matches
                    }
                    
                    // 3. Username match if available
                    if (member.bitbucketUsername && 
                        authorUsername && 
                        (authorUsername.includes(member.bitbucketUsername.toLowerCase()) || 
                         member.bitbucketUsername.toLowerCase().includes(authorUsername))) {
                        contributor.matchedMember = member.name;
                        contributor.matchType = 'username';
                        break; // Username match is strong
                    }
                    
                    // 4. First name + last name initial match
                    const memberNames = memberNameLower.split(' ');
                    const authorNames = authorNameLower.split(' ');
                    
                    if (memberNames.length > 1 && authorNames.length > 0) {
                        const memberFirst = memberNames[0];
                        const memberLast = memberNames[memberNames.length - 1];
                        
                        // Check for first name + last initial matches
                        if (authorNames.some(name => 
                            name === memberFirst || 
                            (name.startsWith(memberFirst) && memberLast && name.endsWith(memberLast[0]))
                        )) {
                            contributor.matchedMember = member.name;
                            contributor.matchType = 'name-pattern';
                            break;
                        }
                    }
                    
                    // 5. Special case for "Kavindu80" -> "Kavindu Liyanage"
                    if (authorUsername && 
                        memberNameLower.split(' ')[0].toLowerCase() === 'kavindu' && 
                        authorUsername === 'kavindu80') {
                        contributor.matchedMember = member.name;
                        contributor.matchType = 'special-case';
                        break;
                    }
                }
            }
            
            // Convert map to array for response
            const contributorsArray = Array.from(contributors.entries()).map(([authorRaw, data]) => ({
                authorRaw,
                ...data
            }));
            
            // Return both the contributors and team members for frontend mapping
            res.status(200).json({
                contributors: contributorsArray,
                teamMembers: allTeamMembers
            });
        } catch (error) {
            console.error(`Error fetching repository contributors for ${workspaceName}/${repoSlug}:`, error.message);
            res.status(500).json({ 
                message: 'Error fetching repository contributors',
                error: error.response?.data?.error?.message || error.message
            });
        }
    })
);

// Delete Student by ID
router.delete(
    '/students/:id',
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            
            // Log the request
            console.log(`Delete request for student ID: ${id}`);
            
            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.log(`Invalid ObjectId format: ${id}`);
                return res.status(400).json({ message: 'Invalid student ID format' });
            }
            
            // Debug: Check the MongoDB connection
            console.log('MongoDB connection state:', mongoose.connection.readyState);
            // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            
            // Debug: Check if the Student model is properly defined
            console.log('Student model:', Student.modelName);
            
            // Debug: Check if the collection exists
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            console.log('Available collections:', collectionNames);
            console.log('Looking for collection:', Student.collection.name);
            
            // First check if the student exists
            const studentExists = await Student.findById(id);
            console.log('Student exists check result:', studentExists ? 'Found' : 'Not found');
            
            if (!studentExists) {
                console.log(`Student not found with ID: ${id}`);
                return res.status(404).json({ message: 'Student not found' });
            }
            
            // Find and delete the student
            const deletedStudent = await Student.findByIdAndDelete(id);
            
            if (!deletedStudent) {
                console.log(`Failed to delete student with ID: ${id}`);
                return res.status(500).json({ message: 'Failed to delete student' });
            }
            
            // Log the successful deletion
            console.log(`Student deleted successfully: ${deletedStudent.name} (ID: ${deletedStudent._id}, Group: ${deletedStudent.groupNumber})`);
            
            res.status(200).json({ 
                message: 'Student deleted successfully',
                deletedStudent: {
                    id: deletedStudent._id,
                    name: deletedStudent.name,
                    groupNumber: deletedStudent.groupNumber
                }
            });
        } catch (error) {
            console.error('Error deleting student:', error);
            
            // Ensure we always return a proper JSON response
            res.status(500).json({ 
                message: 'Server error deleting student', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    })
);

// Delete Student by ID - direct MongoDB method
router.delete(
    '/students-direct/:id',
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            
            // Log the request
            console.log(`Direct delete request for student ID: ${id}`);
            
            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.log(`Invalid ObjectId format: ${id}`);
                return res.status(400).json({ message: 'Invalid student ID format' });
            }
            
            // Use direct MongoDB driver for deletion
            const db = mongoose.connection.db;
            const collection = db.collection('students'); // Use the actual collection name
            
            // First check if the document exists
            const studentDoc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
            
            if (!studentDoc) {
                console.log(`Student not found with ID: ${id} (direct method)`);
                return res.status(404).json({ message: 'Student not found' });
            }
            
            // Delete the document
            const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
            
            if (result.deletedCount === 1) {
                console.log(`Student deleted successfully (direct method): ${id}`);
                res.status(200).json({ 
                    message: 'Student deleted successfully',
                    deletedStudent: {
                        id: id,
                        name: studentDoc.name,
                        groupNumber: studentDoc.groupNumber
                    }
                });
            } else {
                console.log(`Failed to delete student with ID: ${id} (direct method)`);
                res.status(500).json({ message: 'Failed to delete student' });
            }
        } catch (error) {
            console.error('Error deleting student (direct method):', error);
            
            // Ensure we always return a proper JSON response
            res.status(500).json({ 
                message: 'Server error deleting student', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    })
);

// Test endpoint to verify Student model
router.get(
    '/test-student-model',
    asyncHandler(async (req, res) => {
        try {
            // Check MongoDB connection
            const connectionState = mongoose.connection.readyState;
            const connectionStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][connectionState];
            
            // Check Student model
            const modelInfo = {
                modelName: Student.modelName,
                collectionName: Student.collection.name,
                schema: Object.keys(Student.schema.paths)
            };
            
            // Check if collection exists
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            const collectionExists = collectionNames.includes(Student.collection.name);
            
            // Count students
            const studentCount = await Student.countDocuments();
            
            // Get a sample student
            const sampleStudent = await Student.findOne().lean();
            
            res.status(200).json({
                connectionState: connectionStateText,
                model: modelInfo,
                collectionExists,
                studentCount,
                sampleStudent: sampleStudent ? {
                    id: sampleStudent._id,
                    name: sampleStudent.name,
                    groupNumber: sampleStudent.groupNumber,
                    // Don't include sensitive fields like password and token
                } : null
            });
        } catch (error) {
            console.error('Error testing Student model:', error);
            res.status(500).json({
                message: 'Error testing Student model',
                error: error.message
            });
        }
    })
);

// Check if a student exists by ID
router.get(
    '/check-student/:id',
    asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            
            // Validate MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    exists: false,
                    message: 'Invalid student ID format' 
                });
            }
            
            // Check if student exists
            const student = await Student.findById(id).lean();
            
            if (student) {
                res.status(200).json({
                    exists: true,
                    student: {
                        id: student._id,
                        name: student.name,
                        groupNumber: student.groupNumber,
                        workspaceName: student.workspaceName
                    }
                });
            } else {
                res.status(200).json({
                    exists: false,
                    message: 'Student not found'
                });
            }
        } catch (error) {
            console.error('Error checking student existence:', error);
            res.status(500).json({
                exists: false,
                message: 'Error checking student existence',
                error: error.message
            });
        }
    })
);

// Get MongoDB collection info
router.get(
    '/db-collections',
    asyncHandler(async (req, res) => {
        try {
            // Check MongoDB connection
            const connectionState = mongoose.connection.readyState;
            const connectionStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][connectionState];
            
            // Get all collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionInfo = collections.map(c => ({
                name: c.name,
                type: c.type,
                options: c.options
            }));
            
            // Check expected collection name vs actual
            const expectedCollectionName = Student.collection.name;
            const actualCollectionExists = collections.some(c => c.name === expectedCollectionName);
            
            // Get document count for each collection
            const collectionStats = {};
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                collectionStats[collection.name] = count;
            }
            
            res.status(200).json({
                connectionState: connectionStateText,
                collections: collectionInfo,
                studentModelCollection: {
                    expected: expectedCollectionName,
                    exists: actualCollectionExists
                },
                collectionStats
            });
        } catch (error) {
            console.error('Error getting DB collections:', error);
            res.status(500).json({
                message: 'Error getting DB collections',
                error: error.message
            });
        }
    })
);

// Keep the existing error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Server error',
        error: err.message 
    });
});

module.exports = router;