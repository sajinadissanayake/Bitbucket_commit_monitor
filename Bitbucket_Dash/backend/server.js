const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const { checkInactiveUsers } = require('./services/commitCheckService');
const sendWhatsAppMessage = require('./services/whatsappservice');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const BITBUCKET_API_URL = 'https://api.bitbucket.org/2.0';

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // this.isOperational = true
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    status: err.statusCode || 500,
  });

  const status = err.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(status).json(response);
});

const validateCredentials = async (workspace, accessToken) => {
  try {
    const response = await axios.get(`${BITBUCKET_API_URL}/repositories/${workspace}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    throw new AppError(`Validation failed: ${message}`, status);
  }
};
// Login route to validate username and password and fetch workspace and token
app.post(
  '/api/login',
  asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const student = await Student.findOne({ username });
    if (!student) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Validate workspace and token
    const isValid = await validateCredentials(student.workspaceName, student.token);
    if (!isValid) {
      return res.status(401).json({ error: 'Workspace or token validation failed.' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      workspace: student.workspaceName,
      token: student.token,
      user: { 
        username: student.username, 
        workspace: student.workspaceName,
        role: student.role,
        projectName: student.projectName,
        projectStartDate: student.projectStartDate,
        projectEndDate: student.projectEndDate,
        groupNumber: student.groupNumber,
        teamMembers: student.teamMembers || []
      },
    });
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!',
  });
});

app.get(
  '/api/projects',
  asyncHandler(async (req, res, next) => {
    const { workspace } = req.query;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!workspace || !accessToken) {
      return next(new AppError('Workspace and access token are required.', 400));
    }

    try {
      const response = await axios.get(`${BITBUCKET_API_URL}/repositories/${workspace}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const repositories = response.data.values.map((repo) => ({
        name: repo.name,
        slug: repo.slug,
        description: repo.description,
        updated_on: repo.updated_on,
      }));

      res.json({ success: true, repositories });
    } catch (error) {
      next(new AppError('Failed to fetch repositories. Check your workspace or token.', 500));
    }
  })
);

app.get(
  '/api/commits',
  asyncHandler(async (req, res, next) => {
    const { workspace, repoSlug } = req.query;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!workspace || !repoSlug || !accessToken) {
      return next(new AppError('Workspace, repoSlug, and access token are required.', 400));
    }

    try {
      const response = await axios.get(`${BITBUCKET_API_URL}/repositories/${workspace}/${repoSlug}/commits`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const commits = response.data.values.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author.raw,
        date: commit.date,
      }));

      res.json({ success: true, commits });
    } catch (error) {
      next(new AppError('Failed to fetch commits. Check your workspace, repoSlug, or token.', 500));
    }
  })
);

// Connect to MongoDB
//mongodb+srv://user1:user1@cluster0.29tg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//mongodb://localhost:27017/bitbucket_dashboard
//'mongodb+srv://kavindu:xppFRIgfwykHia2E@cluster0.iofqwq5.mongodb.net/bitbucket_admin?retryWrites=true&w=majority&appName=Cluster0'
mongoose.connect('mongodb+srv://kavindu:xppFRIgfwykHia2E@cluster0.iofqwq5.mongodb.net/bitbucket_admin?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Set response headers for all routes to ensure proper content type
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  // Ensure CORS headers are set
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  next();
});

// Handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bitbucket Dashboard Backend is running.',
    version: '1.0.0'
  });
});

const adminRoutes = require('./routes/Admins');
app.use('/api/admin', adminRoutes);

const studentRoutes = require('./routes/Students');
app.use('/api/students', studentRoutes);

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl
  });

  // Ensure response hasn't been sent yet
  if (res.headersSent) {
    return next(err);
  }

  // Handle MongoDB specific errors
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: {
        status: 400,
        details: err.message
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: {
        status: 400,
        details: messages
      }
    });
  }

  // Set status code (default to 500 if not set)
  const statusCode = err.statusCode || 500;
  
  // Always return JSON
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: {
      status: statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

//checkInactiveUsers();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
