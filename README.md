# Healthcare Appointment Management System

This project is a full-stack healthcare platform featuring automated appointment booking, real-time analytics, and AI-powered medical report analysis.

---

## 🚀 How to Run the Project

You have two options to run the project. Using **Docker** is the recommended way as it handles all dependencies and services automatically.

### Option 1: Using Docker (Recommended)
This starts both the Frontend and Backend in a synchronized environment.

1.  **Open a terminal** in the root directory (`tp project`).
2.  **Run the following command**:
    ```bash
    docker compose up --build
    ```
    *(Note: If the above doesn't work, try `docker-compose up --build`)*
3.  **Access the application**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

### Option 2: Manual Execution
If you prefer running the services individually in separate terminals:

#### 1. Backend
1.  Navigate to the `backend` folder: `cd backend`
2.  Install dependencies: `npm install`
3.  Start the server: `npm start` (or `npm run dev` for auto-reload)

#### 2. Frontend
1.  Open a new terminal.
2.  Navigate to the frontend folder: `cd Software-Grp-Project`
3.  Install dependencies: `npm install`
4.  Start Vite: `npm run dev`

---

## 🛠 Features
- **Patient Dashboard**: Book appointments, view medical records, and track cancelled visits.
- **Doctor Dashboard**: Manage schedule via Heatmap, handle appointments, and view performance analytics.
- **Real-time Sync**: Appointments and status updates reflect across all dashboards instantly using Socket.io.
- **AI Integration**: Powered by Google Gemini for intelligent medical insights.

## 📁 Project Structure
- `/backend`: Node.js/Express API with MongoDB & Socket.io integration.
- `/Software-Grp-Project`: React/Vite frontend with specialized dashboards.
- `docker-compose.yml`: Orchestration for both services.
