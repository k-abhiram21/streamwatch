# Stream Watch - Real-Time Intelligent Database Monitoring with prometheus and grafana

Stream Watch has been completely redesigned with enterprise-grade features, professional UI, and comprehensive security!

- **MongoDB User Authentication** - Full registration and login system
- **Persistent Query History** - Last 10 queries saved and displayed
- **Malicious Query Detection** - Comprehensive security validation
- **Professional UI Redesign** - Modern dark/light modes
- **No Emojis** - Clean, professional SVG icons throughout
- **Elegant Design** - White/blue and black/blue color schemes

---

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[UPGRADE_NOTES.md](UPGRADE_NOTES.md)** - Technical implementation details
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Complete feature breakdown
- **[BEFORE_AFTER.md](BEFORE_AFTER.md)** - Visual comparison guide
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - UI/UX design specifications
- **[SCREENSHOTS_GUIDE.md](SCREENSHOTS_GUIDE.md)** - Visual reference guide

---

## Quick Start

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

## Key Features

### Secure Authentication
- User registration with validation (min 3 chars username, 6 chars password)
- MongoDB-backed user accounts
- Session management
- Ready for bcrypt password hashing in production

### AI-Powered Queries
- Natural language to MongoDB conversion using Google Gemini
- Intelligent query generation
- Natural language answers
- Syntax-highlighted results

### Query History
- Last 10 queries automatically saved to MongoDB
- Persists across sessions and page reloads
- Click to reuse previous queries
- Shows both successful and blocked queries
- Real-time updates

### Security Protection
Automatically blocks dangerous queries:
- Database/collection drops
- Unauthorized deletions
- JavaScript injection ($where, $function, eval)
- Merge/output operations ($merge, $out)
- Shutdown commands
- Collection manipulation

### Professional UI
- **Light Mode**: White and blue color scheme with elegant gradients
- **Dark Mode**: Black and blue color scheme with modern aesthetics
- Professional SVG icons (no emojis)
- Modern card-based design
- Smooth animations and transitions
- Fully responsive layout

---

## Security Features

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

## Database Collections

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


## Testing Security

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

## Production Deployment

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

## Monitoring

### Prometheus Metrics
- `client_query_traffic` - Query traffic by user and type
- `packet_size_bytes` - Packet size distribution
- Response times and error rates

### Admin Dashboard
- Active users and their statistics
- Query history (last 50)
- Packet statistics
- Real-time monitoring

---

## Troubleshooting

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

## Tech Stack

### Backend
- Node.js + Express +FastAPI
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

For detailed information, see the documentation files in the repository.
