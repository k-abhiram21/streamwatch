# Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)
- Backend and Frontend dependencies installed

## Step 1: Start the Backend

```bash
cd backend
npm start
```

The backend will start on `http://localhost:5000`

## Step 2: Start the Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or similar)

## Step 3: Create an Account

1. Open your browser to the frontend URL
2. You'll see the login page
3. Click "Create an account" or the "Register" tab
4. Enter a username (min 3 characters) and password (min 6 characters)
5. Click "Create Account"

## Step 4: Use the Application

### Data Hub
- View and manage sensor data
- CRUD operations on sensor readings

### AI Analyst (NEW FEATURES!)
- **Ask natural language questions** about your sensor data
- **View query history** - Your last 10 queries are saved and displayed
- **Security protection** - Malicious queries are automatically blocked
- **Click on history items** to reuse previous questions

Example queries:
- "Show me all sensors where temperature is greater than 50"
- "What is the average water level?"
- "Find sensors with voltage below 220"

### System Vitals
- Monitor system metrics
- View Prometheus/Grafana integration

## New Features Highlights

### 🔐 Secure Authentication
- Real user accounts stored in MongoDB
- Login/Register system
- Session management

### 📊 Query History
- Last 10 queries automatically saved
- Persists across page reloads
- Shows successful and blocked queries
- Click to reuse previous queries

### 🛡️ Security Protection
Automatically blocks dangerous queries like:
- Database drops
- Collection deletions
- JavaScript injection attempts
- Unauthorized operations

### 🎨 Professional UI
- **Dark Mode**: Black and blue theme
- **Light Mode**: White and blue theme
- Toggle between themes with one click
- No emojis - clean professional icons
- Modern card-based design
- Smooth animations

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `backend/.env`
- Ensure MongoDB Atlas IP whitelist includes your IP
- Verify GEMINI_API_KEY is set

### Frontend won't connect
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_URL in frontend files

### Can't login
- Make sure you've created an account first
- Check backend logs for errors
- Verify MongoDB connection is working

## Testing Security Features

Try these queries to see security in action:

**Will be blocked:**
- "drop database streamwatch"
- "delete all collections"
- "shutdown the server"

**Will work:**
- "show all sensor data"
- "find temperature above 50"
- "average water level"

Blocked queries will show a red error message with the specific reason!
