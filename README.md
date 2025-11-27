# Stream Watch - Real-Time Intelligent Database Monitoring

## 🎉 Major Update - Version 2.0

Stream Watch has been completely redesigned with enterprise-grade features, professional UI, and comprehensive security!

### ✨ What's New in v2.0

- 🔐 **MongoDB User Authentication** - Full registration and login system
- 📊 **Persistent Query History** - Last 10 queries saved and displayed
- 🛡️ **Malicious Query Detection** - Comprehensive security validation
- 🎨 **Professional UI Redesign** - Modern dark/light modes
- 🚫 **No Emojis** - Clean, professional SVG icons throughout
- 🎯 **Elegant Design** - White/blue and black/blue color schemes

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[UPGRADE_NOTES.md](UPGRADE_NOTES.md)** - Technical implementation details
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Complete feature breakdown
- **[BEFORE_AFTER.md](BEFORE_AFTER.md)** - Visual comparison guide
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - UI/UX design specifications
- **[SCREENSHOTS_GUIDE.md](SCREENSHOTS_GUIDE.md)** - Visual reference guide

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### Installation

1. **Clone and Install**
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

2. **Configure Environment**
```bash
# backend/.env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

3. **Start Services**
```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev
```

4. **Access Application**
- Open browser to `http://localhost:5173`
- Create an account (Register tab)
- Start monitoring!

---

## 🔥 Key Features

### 🔐 Secure Authentication
- User registration with validation (min 3 chars username, 6 chars password)
- MongoDB-backed user accounts
- Session management
- Ready for bcrypt password hashing in production

### 🤖 AI-Powered Queries
- Natural language to MongoDB conversion using Google Gemini
- Intelligent query generation
- Natural language answers
- Syntax-highlighted results

### 📊 Query History
- Last 10 queries automatically saved to MongoDB
- Persists across sessions and page reloads
- Click to reuse previous queries
- Shows both successful and blocked queries
- Real-time updates

### 🛡️ Security Protection
Automatically blocks dangerous queries:
- Database/collection drops
- Unauthorized deletions
- JavaScript injection ($where, $function, eval)
- Merge/output operations ($merge, $out)
- Shutdown commands
- Collection manipulation

### 🎨 Professional UI
- **Light Mode**: White and blue color scheme with elegant gradients
- **Dark Mode**: Black and blue color scheme with modern aesthetics
- Professional SVG icons (no emojis)
- Modern card-based design
- Smooth animations and transitions
- Fully responsive layout

---

## 🔒 Security Features

### Pattern Detection
The system blocks queries containing:
```
✅ drop database/collection/table
✅ delete database/collection
✅ $where/$function operators
✅ eval() and JavaScript functions
✅ shutdown commands
✅ $merge/$out operations
✅ createCollection/dropDatabase/renameCollection
```

### Query Validation
- Structure validation for MongoDB queries
- Operator whitelisting
- Aggregation pipeline stage checking
- Complete audit trail logging

### User Feedback
- Clear, specific error messages
- Visual distinction between errors and security blocks
- Detailed block reasons
- Security audit trail in database

---

## 📊 Database Collections

### users
```javascript
{
  username: String (unique, indexed),
  password: String, // Plain text in dev, hash in production!
  createdAt: Date,
  lastLogin: Date
}
```

### query_history
```javascript
{
  username: String (indexed),
  question: String,
  mongoQuery: Object,
  result: Object, // First 5 results only
  naturalAnswer: String,
  timestamp: Date (indexed),
  blocked: Boolean,
  blockReason: String
}
```

### sensor_data
```javascript
{
  temperature: Number,
  water_level: Number,
  power_stats: {
    voltage: Number,
    current: Number,
    wattage: Number
  },
  timestamp: Date,
  location: String
}
```

---

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register - Create new user account
POST /api/auth/login - Authenticate existing user
```

### AI Queries
```
POST /api/ai-query - Execute AI query with security validation
GET /api/ai-query-history/:username?limit=10 - Get user's query history
```

### Sensor Data CRUD
```
GET /api/sensor-data - List all sensor data
GET /api/sensor-data/:id - Get single entry
POST /api/sensor-data - Create new entry
PUT /api/sensor-data/:id - Update entry
DELETE /api/sensor-data/:id - Delete entry
```

### Monitoring
```
GET /metrics - Prometheus metrics
GET /health - Health check
GET /admin/stats - Admin dashboard
GET /api/query-history - Query history for Grafana
```

---

## 🧪 Testing Security

Try these queries to see security in action:

**Will be blocked:**
```
"drop database streamwatch"
"delete all collections"
"shutdown the server"
"use $where to find data"
```

**Will work:**
```
"show all sensor data"
"find temperature above 50"
"average water level"
"sensors with high voltage"
```

---

## 🎨 Design System

### Color Schemes

**Light Mode**
- Background: White (#FFFFFF)
- Surface: Gray-50 (#F9FAFB)
- Accent: Blue (#3B82F6)
- Text: Gray-900 (#111827)
- Borders: Gray-200 (#E5E7EB)

**Dark Mode**
- Background: Gray-900 (#111827)
- Surface: Gray-800 (#1F2937)
- Accent: Blue (#3B82F6)
- Text: White (#FFFFFF)
- Borders: Gray-700 (#374151)

*See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete specifications*

---

## 🚀 Production Deployment

### Security Checklist
- [ ] Install bcrypt: `npm install bcrypt`
- [ ] Hash passwords on registration
- [ ] Compare hashed passwords on login
- [ ] Set up environment variables properly
- [ ] Enable MongoDB authentication
- [ ] Configure CORS restrictions
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Implement JWT tokens
- [ ] Set up logging and monitoring

### Performance Optimization
- [ ] Add database indexes (username, timestamp)
- [ ] Implement caching (Redis)
- [ ] Enable compression (gzip/brotli)
- [ ] Use CDN for static assets
- [ ] Optimize bundle size
- [ ] Implement pagination

*See [UPGRADE_NOTES.md](UPGRADE_NOTES.md) for complete production checklist*

---

## 📈 Monitoring

### Prometheus Metrics
- `client_query_traffic` - Query traffic by user and type
- `packet_size_bytes` - Packet size distribution
- Response times and error rates

### Admin Dashboard
Access at `/admin/stats` to view:
- Active users and their statistics
- Query history (last 50)
- Packet statistics
- Real-time monitoring

---

## 💡 Example Queries

### Simple Queries
```
"Show all sensors"
"Find temperature above 50"
"What is the average water level?"
```

### Complex Queries
```
"Show sensors where voltage is between 220 and 240"
"Find the maximum temperature recorded today"
"Group sensors by location and show average temperature"
```

### Blocked Queries (for testing)
```
"drop database streamwatch"
"delete all sensor data"
"$where temperature > 50"
```

---

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Verify Gemini API key is set
- Ensure port 5000 is available
- Check MongoDB Atlas IP whitelist

### Frontend won't connect
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Ensure API_URL is correct in frontend files

### Can't login
- Create an account first using Register tab
- Check backend logs for errors
- Verify MongoDB connection is working
- Ensure username is at least 3 characters
- Ensure password is at least 6 characters

*See [QUICK_START.md](QUICK_START.md) for detailed troubleshooting*

---

## 🎯 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Google Gemini AI (Flash 2.0)
- Prometheus metrics
- CORS, dotenv

### Frontend
- React 18
- React Router v6
- Tailwind CSS v3
- Axios
- Vite

---

## 📝 Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─── React Frontend (Vite + Tailwind)
       │    ├── Login/Register
       │    ├── Data Hub (CRUD)
       │    ├── AI Analyst (Query + History)
       │    └── System Vitals (Metrics)
       │
       ↓
┌──────────────────┐
│  Express Server  │
├──────────────────┤
│ • Authentication │
│ • AI Query API   │
│ • CRUD API       │
│ • Security Layer │
│ • Metrics        │
└────────┬─────────┘
         │
         ├─── MongoDB Atlas
         │    ├── users
         │    ├── query_history
         │    └── sensor_data
         │
         └─── Google Gemini AI
              └── Natural Language Processing
```

---

## 🤝 Contributing

This is a demonstration project showcasing:
- Full-stack MERN development
- AI integration with Google Gemini
- Security best practices
- Modern UI/UX design
- Professional documentation

Feel free to use as a reference or starting point!

---

## 📝 License

MIT License - Free to use for learning and reference.

---

## 🎉 Acknowledgments

Built with modern web technologies and best practices:
- Security-first approach
- User-centric design
- Professional UI/UX
- Comprehensive documentation
- Production-ready architecture

---

**Stream Watch v2.0** - Professional Database Monitoring Made Simple

For detailed information, see the documentation files in the repository.
