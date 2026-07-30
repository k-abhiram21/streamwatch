# Stream Watch - Real-Time Database Monitoring

Stream Watch is a web application for monitoring databases with an AI-powered query interface.

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started
- **[UPGRADE_NOTES.md](UPGRADE_NOTES.md)** - Technical implementation details
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Change history

## Quick Start

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- MongoDB (Local or Atlas)

### Local Development Setup

1. **Start MongoDB (if running locally):**
   ```bash
   mkdir -p .mongodb_data
   mongod --dbpath .mongodb_data --port 27017
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --port 5000
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Key Features

- **User Authentication**: Registration and login system backed by MongoDB.
- **AI-Powered Queries**: Natural language to MongoDB conversion using Google Gemini.
- **Query History**: Saves and displays previous queries for reuse.
- **Security Protection**: Blocks dangerous queries (e.g., database drops, deletions).
- **Monitoring**: Prometheus metrics and basic health checks.

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend
- Python
- FastAPI
- Google Gemini AI

### Database
- MongoDB
- Mongoose / Motor

## License

MIT License - Free to use for learning and reference.
