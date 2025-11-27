import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { register, Counter, Histogram } from 'prom-client';
import { convertToMongoQuery, generateNaturalLanguageAnswer } from './ai.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
  password: { type: String, required: true },
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Create new user
    // NOTE: In production, use bcrypt to hash passwords: const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      username: username.trim(),
      password: password, // SECURITY WARNING: Store hashed passwords in production!
      lastLogin: new Date()
    });
    
    await user.save();
    
    console.log(`[REGISTER] New user registered: ${username}`);
    res.status(201).json({ 
      success: true, 
      username: user.username,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Error registering user:', error);
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
    // NOTE: In production, use bcrypt: const isValid = await bcrypt.compare(password, user.password)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    console.log(`[LOGIN] User logged in: ${username}`);
    res.json({ 
      success: true, 
      username: user.username,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
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
    
    res.json(response);
  } catch (error) {
    console.error('Error processing AI query:', error);
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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stream Watch - Admin Stats</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #667eea;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .query-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }
        .query-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            margin-right: 8px;
        }
        .query-type.AI_Query { background: #4CAF50; color: white; }
        .query-type.CREATE { background: #2196F3; color: white; }
        .query-type.UPDATE { background: #FF9800; color: white; }
        .query-type.DELETE { background: #f44336; color: white; }
        .query-type.READ { background: #9C27B0; color: white; }
        .timestamp {
            color: #666;
            font-size: 0.85em;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        .refresh-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.2s;
        }
        .refresh-btn:hover {
            transform: scale(1.05);
        }
        .stats-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 5px;
        }
        .stat-card p {
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Stream Watch - Admin Dashboard</h1>
        
        <div class="stats-summary">
            <div class="stat-card">
                <h3>${users.length}</h3>
                <p>Active Users</p>
            </div>
            <div class="stat-card">
                <h3>${queryHistory.length}</h3>
                <p>Total Queries</p>
            </div>
            <div class="stat-card">
                <h3>${users.reduce((sum, u) => sum + u.packetsSent, 0).toLocaleString()}</h3>
                <p>Total Packets Sent</p>
            </div>
            <div class="stat-card">
                <h3>${users.reduce((sum, u) => sum + u.packetsReceived, 0).toLocaleString()}</h3>
                <p>Total Packets Received</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="card full-width">
                <h2>Query History (Latest ${Math.min(50, queryHistory.length)})</h2>
                <div style="max-height: 600px; overflow-y: auto;">
                    ${queryHistory.slice(-50).reverse().map(q => `
                        <div class="query-box">
                            <div style="margin-bottom: 8px;">
                                <span class="query-type ${q.queryType}">${q.queryType}</span>
                                <strong>${q.username}</strong> (${q.clientIP})
                                <span class="timestamp">${new Date(q.timestamp).toLocaleString()}</span>
                            </div>
                            <div style="margin: 8px 0;">
                                <strong>Question/Query:</strong> ${q.question || 'N/A'}
                            </div>
                            ${q.mongoQuery ? `
                                <div style="margin-top: 8px;">
                                    <strong>MongoDB Query:</strong>
                                    <pre style="background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 4px; overflow-x: auto; margin-top: 5px;">${q.mongoQuery}</pre>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h2>Active Users</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>IP Address</th>
                            <th>Queries</th>
                            <th>Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).map(u => `
                            <tr>
                                <td><strong>${u.username}</strong></td>
                                <td>${u.ip}</td>
                                <td>${u.queriesCount}</td>
                                <td class="timestamp">${new Date(u.lastSeen).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>Packet Statistics</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Sent (bytes)</th>
                            <th>Received (bytes)</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.sort((a, b) => (b.packetsSent + b.packetsReceived) - (a.packetsSent + a.packetsReceived)).map(u => `
                            <tr>
                                <td><strong>${u.username}</strong></td>
                                <td>${u.packetsSent.toLocaleString()}</td>
                                <td>${u.packetsReceived.toLocaleString()}</td>
                                <td><strong>${(u.packetsSent + u.packetsReceived).toLocaleString()}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <button class="refresh-btn" onclick="location.reload()">Refresh</button>

    <script>
        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`👨‍💼 Admin stats available at http://localhost:${PORT}/admin/stats`);
});

