import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import { convertToMongoQuery, generateNaturalLanguageAnswer } from './ai.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Trust proxy to get real client IP
app.set('trust proxy', true);

// Serve static files (if needed)
app.use(express.static('public'));

// In-memory storage for query history and user stats
const queryHistory = [];
const userStats = new Map(); // username -> { ip, queries: [], packets: { sent: 0, received: 0 } }

// Helper function to track query history
function trackQueryHistory(username, clientIP, question, mongoQuery, queryType) {
  const entry = {
    timestamp: new Date().toISOString(),
    username,
    clientIP,
    question: question || queryType,
    mongoQuery: mongoQuery ? JSON.stringify(mongoQuery, null, 2) : null,
    queryType
  };
  queryHistory.push(entry);

  // Keep only last 1000 queries
  if (queryHistory.length > 1000) {
    queryHistory.shift();
  }

  // Update user stats
  if (!userStats.has(username)) {
    userStats.set(username, {
      ip: clientIP,
      queries: [],
      packets: { sent: 0, received: 0 },
      lastSeen: new Date().toISOString()
    });
  }

  const stats = userStats.get(username);
  stats.queries.push(entry);
  stats.lastSeen = new Date().toISOString();
  if (stats.queries.length > 100) {
    stats.queries.shift(); // Keep only last 100 queries per user
  }
}

// Helper function to update packet stats
function updatePacketStats(username, direction, size) {
  if (!userStats.has(username)) {
    userStats.set(username, {
      ip: 'unknown',
      queries: [],
      packets: { sent: 0, received: 0 },
      lastSeen: new Date().toISOString()
    });
  }

  const stats = userStats.get(username);
  if (direction === 'request') {
    stats.packets.sent += size;
  } else {
    stats.packets.received += size;
  }
}

// Prometheus Metrics
const clientQueryTraffic = new Counter({
  name: 'client_query_traffic',
  help: 'Total number of queries by client',
  labelNames: ['user_name', 'client_ip', 'query_type']
});

const packetSizeBytes = new Histogram({
  name: 'packet_size_bytes',
  help: 'Size of packets (queries and responses) in bytes',
  labelNames: ['direction', 'user_name'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
});

// WARNING: High-cardinality metric (label stuffing) per user request.
// This exposes AI queries with full text, mongo query, and (truncated) result in labels.
// Use with caution in Prometheus—can cause high memory usage.
const streamwatchAIQueryLog = new Gauge({
  name: 'streamwatch_ai_query_log',
  help: 'AI queries with full context exposed via labels (label stuffing)',
  labelNames: ['user_name', 'client_ip', 'status', 'question', 'mongo_query', 'result']
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('💡 Make sure your MongoDB Atlas connection string is correct and your IP is whitelisted');
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
  temperature: { type: Number, required: true },
  water_level: { type: Number, required: true },
  power_stats: {
    voltage: { type: Number, required: true },
    current: { type: Number, required: true },
    wattage: { type: Number, required: true }
  },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, default: 'sensor-001' }
}, { collection: 'sensor_data' });

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// AI Query History Schema
const queryHistorySchema = new mongoose.Schema({
  username: { type: String, required: true },
  question: { type: String, required: true },
  mongoQuery: { type: Object },
  result: { type: Object },
  naturalAnswer: { type: String },
  timestamp: { type: Date, default: Date.now },
  blocked: { type: Boolean, default: false },
  blockReason: { type: String }
}, { collection: 'query_history' });

const QueryHistory = mongoose.model('QueryHistory', queryHistorySchema);

// Helper function to get client IP
function getClientIP(req) {
  return req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown';
}

// Security: Detect malicious queries
function detectMaliciousQuery(question) {
  const maliciousPatterns = [
    { pattern: /drop\s+(database|collection|table)/i, reason: 'Attempted to drop database/collection' },
    { pattern: /delete\s+(database|collection)/i, reason: 'Attempted to delete database/collection' },
    { pattern: /\$where/i, reason: 'Use of $where operator is not allowed' },
    { pattern: /\$function/i, reason: 'Use of $function operator is not allowed' },
    { pattern: /eval\s*\(/i, reason: 'Use of eval() is not allowed' },
    { pattern: /function\s*\(/i, reason: 'JavaScript functions are not allowed' },
    { pattern: /shutdown/i, reason: 'Shutdown commands are not allowed' },
    { pattern: /\$merge/i, reason: 'Merge operations are not allowed' },
    { pattern: /\$out/i, reason: 'Output to collection operations are not allowed' },
    { pattern: /createCollection/i, reason: 'Creating collections is not allowed' },
    { pattern: /dropDatabase/i, reason: 'Dropping databases is not allowed' },
    { pattern: /renameCollection/i, reason: 'Renaming collections is not allowed' }
  ];

  for (const { pattern, reason } of maliciousPatterns) {
    if (pattern.test(question)) {
      return reason;
    }
  }

  return null;
}

// Security: Validate MongoDB query structure
function validateMongoQuery(queryObj) {
  const { type, query } = queryObj;

  // Check for dangerous operators
  const dangerousOps = ['$where', '$function', '$accumulator', '$merge', '$out'];
  const queryStr = JSON.stringify(query);

  for (const op of dangerousOps) {
    if (queryStr.includes(op)) {
      return {
        valid: false,
        reason: `Dangerous operator ${op} detected in query`
      };
    }
  }

  // For aggregate queries, check pipeline stages
  if (type === 'aggregate' && Array.isArray(query)) {
    const allowedStages = ['$match', '$group', '$sort', '$limit', '$project', '$count', '$unwind'];

    for (const stage of query) {
      const stageKeys = Object.keys(stage);
      for (const key of stageKeys) {
        if (!allowedStages.includes(key)) {
          return {
            valid: false,
            reason: `Disallowed aggregation stage: ${key}`
          };
        }
      }
    }
  }

  return { valid: true };
}

// Helper function to record packet size
function recordPacketSize(direction, username, size) {
  packetSizeBytes.observe({ direction, user_name: username || 'anonymous' }, size);
  updatePacketStats(username || 'anonymous', direction, size);
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CRUD Operations

// List all sensor data
app.get('/api/sensor-data', async (req, res) => {
  try {
    const username = req.headers['x-username'] || 'anonymous';
    const clientIP = getClientIP(req);

    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);

    const responseSize = JSON.stringify(data).length;
    recordPacketSize('response', username, responseSize);
    trackQueryHistory(username, clientIP, 'GET /api/sensor-data', null, 'READ');

    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single sensor data entry
app.get('/api/sensor-data/:id', async (req, res) => {
  try {
    const username = req.headers['x-username'] || 'anonymous';
    const data = await SensorData.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ error: 'Sensor data not found' });
    }

    const responseSize = JSON.stringify(data).length;
    recordPacketSize('response', username, responseSize);

    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create sensor data
app.post('/api/sensor-data', async (req, res) => {
  try {
    const username = req.headers['x-username'] || 'anonymous';
    const clientIP = getClientIP(req);
    const requestSize = JSON.stringify(req.body).length;

    recordPacketSize('request', username, requestSize);
    clientQueryTraffic.inc({ user_name: username, client_ip: clientIP, query_type: 'CREATE' });

    const sensorData = new SensorData(req.body);
    const saved = await sensorData.save();

    const responseSize = JSON.stringify(saved).length;
    recordPacketSize('response', username, responseSize);
    trackQueryHistory(username, clientIP, 'POST /api/sensor-data', req.body, 'CREATE');

    console.log(`[CREATE] User: ${username} | IP: ${clientIP} | Created sensor data: ${saved._id}`);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating sensor data:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update sensor data
app.put('/api/sensor-data/:id', async (req, res) => {
  try {
    const username = req.headers['x-username'] || 'anonymous';
    const clientIP = getClientIP(req);
    const requestSize = JSON.stringify(req.body).length;

    recordPacketSize('request', username, requestSize);
    clientQueryTraffic.inc({ user_name: username, client_ip: clientIP, query_type: 'UPDATE' });

    const updated = await SensorData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Sensor data not found' });
    }

    const responseSize = JSON.stringify(updated).length;
    recordPacketSize('response', username, responseSize);
    trackQueryHistory(username, clientIP, `PUT /api/sensor-data/${req.params.id}`, req.body, 'UPDATE');

    console.log(`[UPDATE] User: ${username} | IP: ${clientIP} | Updated sensor data: ${req.params.id}`);
    res.json(updated);
  } catch (error) {
    console.error('Error updating sensor data:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete sensor data
app.delete('/api/sensor-data/:id', async (req, res) => {
  try {
    const username = req.headers['x-username'] || 'anonymous';
    const clientIP = getClientIP(req);

    clientQueryTraffic.inc({ user_name: username, client_ip: clientIP, query_type: 'DELETE' });

    const deleted = await SensorData.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Sensor data not found' });
    }

    trackQueryHistory(username, clientIP, `DELETE /api/sensor-data/${req.params.id}`, null, 'DELETE');
    console.log(`[DELETE] User: ${username} | IP: ${clientIP} | Deleted sensor data: ${req.params.id}`);
    res.json({ message: 'Sensor data deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting sensor data:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Registration endpoint
async function sendOTP(email, otp) {
  // Always log to console for development/debugging
  console.log(`==================================================`);
  console.log(`🔐 OTP for ${email}: ${otp}`);
  console.log(`==================================================`);

  // Check if email credentials are provided
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials (EMAIL_USER, EMAIL_PASS) not found in .env. OTP sent to console only.');
    return;
  }

  try {
    // Prefer explicit SMTP settings if provided; fall back to Gmail service
    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Verify transporter configuration in development to surface config issues
    if (process.env.NODE_ENV !== 'production') {
      try {
        await transporter.verify();
        console.log('✉️  Mail transporter verified successfully');
      } catch (verifyErr) {
        console.warn('⚠️  Mail transporter verification failed (will still attempt to send):', verifyErr.message);
      }
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Stream Watch - Your Verification Code',
      text: `Your OTP is: ${otp}\n\nThis code will expire in 10 minutes.`
    });
    console.log(`📧 OTP email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    // Don't throw error, just log it so registration doesn't fail
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      otp,
      otpExpires,
      isVerified: false
    });

    await user.save();

    // Send OTP
    await sendOTP(user.email, otp);

    console.log(`[REGISTER] New user registered (pending verification): ${username}`);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP.',
      email: user.email
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log(`[VERIFY] User verified: ${user.username}`);
    res.json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log(`[LOGIN] User logged in: ${username} (${user.role})`);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// AI Query endpoint with enhanced security
app.post('/api/ai-query', async (req, res) => {
  try {
    const { question, username } = req.body;
    const clientIP = getClientIP(req);
    const user = username || req.headers['x-username'] || 'anonymous';

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const requestSize = JSON.stringify(req.body).length;
    recordPacketSize('request', user, requestSize);
    clientQueryTraffic.inc({ user_name: user, client_ip: clientIP, query_type: 'AI_Query' });

    console.log(`[AI_QUERY] User: ${user} | IP: ${clientIP} | Question: ${question}`);

    // (Removed 'started' metric emission to avoid duplicate lines with N/A placeholders.)

    // Check for malicious patterns in the question
    const maliciousCheck = detectMaliciousQuery(question);
    if (maliciousCheck) {
      console.warn(`[BLOCKED] User: ${user} | Reason: ${maliciousCheck}`);

      // Save blocked query to history
      await QueryHistory.create({
        username: user,
        question,
        blocked: true,
        blockReason: maliciousCheck,
        timestamp: new Date()
      });

      // Expose blocked state with reason
      streamwatchAIQueryLog.set({
        user_name: user,
        client_ip: clientIP,
        status: 'blocked',
        question: String(question).slice(0, 500),
        mongo_query: 'BLOCKED',
        result: String(maliciousCheck).slice(0, 500)
      }, 1);
      return res.status(403).json({
        error: 'Query blocked for security reasons',
        reason: maliciousCheck,
        blocked: true
      });
    }

    // Convert natural language to MongoDB query
    const { type, query } = await convertToMongoQuery(question);

    // Validate the generated query for malicious operations
    const queryValidation = validateMongoQuery({ type, query });
    if (!queryValidation.valid) {
      console.warn(`[BLOCKED] User: ${user} | Reason: ${queryValidation.reason}`);

      // Save blocked query to history
      await QueryHistory.create({
        username: user,
        question,
        mongoQuery: { type, query },
        blocked: true,
        blockReason: queryValidation.reason,
        timestamp: new Date()
      });

      streamwatchAIQueryLog.set({
        user_name: user,
        client_ip: clientIP,
        status: 'blocked',
        question: String(question).slice(0, 500),
        mongo_query: JSON.stringify({ type, query }).slice(0, 1000),
        result: String(queryValidation.reason).slice(0, 500)
      }, 1);
      return res.status(403).json({
        error: 'Query blocked for security reasons',
        reason: queryValidation.reason,
        blocked: true
      });
    }

    // Execute the query
    let result;
    if (type === 'aggregate') {
      result = await SensorData.aggregate(query);
    } else {
      const { filter = {}, projection = {}, sort = {}, limit = 100 } = query;
      result = await SensorData.find(filter, projection).sort(sort).limit(limit);
    }

    // Generate natural language answer
  const naturalAnswer = await generateNaturalLanguageAnswer(question, query, result);

    const response = {
      question,
      mongoQuery: { type, query },
      result,
      naturalAnswer
    };

    // Save successful query to history
    await QueryHistory.create({
      username: user,
      question,
      mongoQuery: { type, query },
      result: Array.isArray(result) ? result.slice(0, 5) : result, // Store only first 5 results
      naturalAnswer,
      blocked: false,
      timestamp: new Date()
    });

    const responseSize = JSON.stringify(response).length;
    recordPacketSize('response', user, responseSize);
    trackQueryHistory(user, clientIP, question, { type, query }, 'AI_Query');

    console.log(`[AI_QUERY_RESULT] User: ${user} | Found ${Array.isArray(result) ? result.length : 1} result(s)`);

    // Expose success entry including mongo query and truncated result
    streamwatchAIQueryLog.set({
      user_name: user,
      client_ip: clientIP,
      status: 'success',
      question: String(question).slice(0, 500),
      mongo_query: JSON.stringify({ type, query }).slice(0, 1000),
      result: JSON.stringify(Array.isArray(result) ? result.slice(0, 5) : result).slice(0, 2000)
    }, 1);

    res.json(response);
  } catch (error) {
    console.error('Error processing AI query:', error);
    const user = req.body?.username || req.headers['x-username'] || 'anonymous';
    const clientIP = getClientIP(req);
    streamwatchAIQueryLog.set({
      user_name: user,
      client_ip: clientIP,
      status: 'error',
      question: String(req.body?.question || '').slice(0, 500),
      mongo_query: 'N/A',
      result: String(error.message).slice(0, 500)
    }, 1);
    res.status(500).json({ error: error.message });
  }
});

// Get AI query history for a user
app.get('/api/ai-query-history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const history = await QueryHistory
      .find({ username })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('-result'); // Exclude full results to reduce payload size

    res.json({ history });
  } catch (error) {
    console.error('Error fetching query history:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get query history for Grafana
app.get('/api/query-history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recentQueries = queryHistory.slice(-limit).reverse();

    res.json({
      queries: recentQueries,
      total: queryHistory.length,
      users: Array.from(userStats.keys())
    });
  } catch (error) {
    console.error('Error fetching query history:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for admin stats (JSON)
app.get('/api/admin-stats', (req, res) => {
  try {
    const users = Array.from(userStats.entries()).map(([username, stats]) => ({
      username,
      ip: stats.ip,
      queriesCount: stats.queries.length,
      packetsSent: stats.packets.sent,
      packetsReceived: stats.packets.received,
      lastSeen: stats.lastSeen
    }));

    const totalPacketsSent = users.reduce((sum, u) => sum + u.packetsSent, 0);
    const totalPacketsReceived = users.reduce((sum, u) => sum + u.packetsReceived, 0);

    res.json({
      users,
      totalQueries: queryHistory.length,
      totalPacketsSent,
      totalPacketsReceived,
      queries: queryHistory
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin/Stats page
app.get('/admin/stats', (req, res) => {
  const users = Array.from(userStats.entries()).map(([username, stats]) => ({
    username,
    ip: stats.ip,
    queriesCount: stats.queries.length,
    packetsSent: stats.packets.sent,
    packetsReceived: stats.packets.received,
    lastSeen: stats.lastSeen
  }));

  const totalPacketsSent = users.reduce((sum, u) => sum + u.packetsSent, 0);
  const totalPacketsReceived = users.reduce((sum, u) => sum + u.packetsReceived, 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stream Watch - Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eff6ff',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Real-time monitoring and statistics</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button onclick="toggleTheme()" class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <svg id="theme-icon-light" class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <svg id="theme-icon-dark" class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span id="theme-text" class="text-sm font-medium">Theme</span>
                    </button>
                    <button onclick="location.reload()" class="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span class="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Active Users -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">${users.length}</div>
            </div>

            <!-- Total Queries -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Queries</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">${queryHistory.length}</div>
            </div>

            <!-- Packets Sent -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Packets Sent</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">${totalPacketsSent.toLocaleString()}</div>
            </div>

            <!-- Packets Received -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Packets Received</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">${totalPacketsReceived.toLocaleString()}</div>
            </div>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Query History -->
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Query History (Latest ${Math.min(50, queryHistory.length)})</h2>
                </div>
                <div class="space-y-3 max-h-[600px] overflow-y-auto">
                    ${queryHistory.slice(-50).reverse().map(q => `
                        <div class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <span class="px-3 py-1 rounded-lg text-xs font-semibold ${q.queryType === 'AI_Query' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
      q.queryType === 'CREATE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
        q.queryType === 'UPDATE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
          q.queryType === 'DELETE' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
            'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    }">${q.queryType}</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">${q.username}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">(${q.clientIP})</span>
                                </div>
                                <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(q.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                <strong>Query:</strong> ${q.question || 'N/A'}
                            </div>
                            ${q.mongoQuery ? `
                                <div class="mt-3">
                                    <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">MongoDB Query:</div>
                                    <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">${q.mongoQuery}</pre>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Active Users Table -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Active Users</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Username</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">IP</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Queries</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).map(u => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">${u.username}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${u.ip}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${u.queriesCount}</td>
                                    <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">${new Date(u.lastSeen).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Packet Statistics Table -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Packet Statistics</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Username</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Sent</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Received</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.sort((a, b) => (b.packetsSent + b.packetsReceived) - (a.packetsSent + a.packetsReceived)).map(u => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">${u.username}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${u.packetsSent.toLocaleString()}</td>
                                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">${u.packetsReceived.toLocaleString()}</td>
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">${(u.packetsSent + u.packetsReceived).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Theme management
        function toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.toggle('dark');
            localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
            updateThemeText(isDark);
        }

        function updateThemeText(isDark) {
            document.getElementById('theme-text').textContent = isDark ? 'Light' : 'Dark';
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('admin-theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            updateThemeText(true);
        }

        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>`;

  res.send(html);
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`👨‍💼 Admin stats available at http://localhost:${PORT}/admin/stats`);
});

