# StreamWatch - Real-Time Database Monitoring

StreamWatch is a full-stack observability platform for monitoring MongoDB-backed applications. It combines Prometheus, Grafana, FastAPI, and AI-assisted querying to provide real-time database insights, system metrics, and secure natural-language analytics.

## Architecture

```text
React Frontend
      │
      ▼
FastAPI Backend
      │
 ├── MongoDB
 ├── Prometheus Client
 ├── Gemini API
 └── JWT Auth
      │
      ▼
Prometheus
      │
      ▼
Grafana
````

## Features

- ✓ JWT Authentication
- ✓ OTP Email Verification
- ✓ Password Reset
- ✓ RBAC
- ✓ Natural Language → MongoDB
- ✓ Query Validation
- ✓ Prometheus Metrics
- ✓ Embedded Grafana Dashboards
- ✓ Query History
- ✓ Admin Dashboard
- ✓ Live Sensor Data CRUD
- ✓ Dark Mode

## AI-Powered Analytics Flow

StreamWatch provides an advanced natural-language-to-database pipeline powered by Google Gemini. The architecture ensures user requests are parsed, translated, and executed securely:

1. **Natural Language:** The user submits a plain-English request.
2. **Gemini:** The request is processed by the AI model.
3. **Mongo Query:** The AI generates the corresponding MongoDB syntax.
4. **Validation:** The query passes through stringent security and schema checks.
5. **Execution:** The validated query runs against the unstructured NoSQL database.
6. **History:** The transaction and outcome are logged for review.
7. **Frontend:** The data is returned and visualized for the user.

## Security

Database integrity and query safety are strictly enforced to prevent malicious or accidental destructive operations. The application implements:

- **Blocked Operators:** Restricts dangerous commands like `$drop`, `$delete`, or `$out`.
- **Regex Detection:** Scans for and blocks potentially malicious injection patterns.
- **Validation:** Ensures generated queries match expected schemas and structures.
- **Whitelist:** Limits querying exclusively to approved collections and fields.
- **Pipeline Validation:** Verifies that MongoDB aggregation pipelines are entirely read-only.

## Monitoring Tools: Role & Architecture

This project implements modern observability tools within a live web application environment.

### 1. Prometheus (The Data Collector)

- **How it works:** Prometheus is a time-series database that actively "pulls" (scrapes) metrics from an application's `/metrics` endpoint at regular intervals.
    
- **Its role here:** Our FastAPI backend utilizes the `prometheus_client` library to expose metrics such as active connections, AI query counts, response sizes, and endpoint latencies. Prometheus continuously scrapes these numbers and stores them efficiently over time.

### 2. Grafana (The Visualizer)

- **How it works:** Grafana connects to various data sources (like Prometheus) and translates raw metric data into beautiful, human-readable charts, graphs, and alerts.
    
- **Its role here:** Grafana connects directly to our local Prometheus instance to render visual dashboards of our MongoDB traffic and application health. The Stream Watch frontend then embeds these dashboards directly into the **System Vitals** page for easy administrative access.

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

_Once Grafana is running:_

1. Navigate to `http://localhost:3000`.    
2. Add Prometheus as a Data Source (URL: `http://localhost:9090`).
3. Import or create your dashboards to visualize the backend metrics!

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (Light & Dark Mode)
- **Backend**: Python, FastAPI, Prometheus Client
- **Database**: MongoDB (Motor/PyMongo)
- **Monitoring**: Prometheus, Grafana
- **AI**: Google Gemini API
