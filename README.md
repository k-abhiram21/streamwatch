# Stream Watch - Real-Time Database Monitoring

Stream Watch demonstrates the integration of industry-standard observability tools (Prometheus and Grafana) with an unstructured NoSQL database (MongoDB). It provides a full-stack dashboard for system vitals, query history, and AI-powered natural language queries.

## Key Features

- **Prometheus & Grafana Integration**: Collects and visualizes real-time metrics (like query latency, packet sizes, and user traffic) straight from the backend.
- **Unstructured DB Monitoring**: Tracks interactions and complex AI-generated queries made against a MongoDB cluster.
- **AI-Powered Queries**: Natural language to MongoDB conversion using Google Gemini.
- **User Authentication**: Secure registration and login system with Role-Based Access Control (Admin/User).

---

## Monitoring Tools: Role & Architecture

This project serves as a practical demonstration of how modern observability tools are hooked into a live web application.

### 1. Prometheus (The Data Collector)
- **How it works:** Prometheus is a time-series database that actively "pulls" (scrapes) metrics from an application's `/metrics` endpoint at regular intervals.
- **Its role here:** Our FastAPI backend utilizes the `prometheus_client` library to expose metrics such as active connections, AI query counts, response sizes, and endpoint latencies. Prometheus continuously scrapes these numbers and stores them efficiently over time.

### 2. Grafana (The Visualizer)
- **How it works:** Grafana connects to various data sources (like Prometheus) and translates raw metric data into beautiful, human-readable charts, graphs, and alerts.
- **Its role here:** Grafana connects directly to our local Prometheus instance to render visual dashboards of our MongoDB traffic and application health. The Stream Watch frontend then embeds these dashboards directly into the **System Vitals** page for easy administrative access.

---

## Quick Start

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- MongoDB (Local or Atlas)
- Prometheus & Grafana (Local Installations)

### 1. Application Setup

**Start MongoDB (if running locally):**
```bash
mkdir -p .mongodb_data
mongod --dbpath .mongodb_data --port 27017
```

**Start the Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 5000
```

**Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Monitoring Setup (Prometheus & Grafana)

**Start Prometheus:**
You need a `prometheus.yml` configuration file that points to the backend (e.g., `localhost:5000`).
```bash
# Run Prometheus locally with your config
prometheus --config.file=prometheus.yml
```

**Start Grafana:**
```bash
# Start the Grafana server (usually runs on port 3000)
sudo systemctl start grafana-server
```

*Once Grafana is running:*
1. Navigate to `http://localhost:3000`.
2. Add Prometheus as a Data Source (URL: `http://localhost:9090`).
3. Import or create your dashboards to visualize the backend metrics!

---

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS (Light & Dark Mode)
- **Backend**: Python, FastAPI, Prometheus Client
- **Database**: MongoDB (Motor/PyMongo)
- **Monitoring**: Prometheus, Grafana
- **AI**: Google Gemini API
