# AI Workflow Management System

A full-stack application consisting of a Backend API, React Frontend, and webhook testing server for managing AI job workflows.

## Project Structure

```
├── Backend/          # Express.js API server
├── Frontend/         # React + Vite Frontend
└── WebhookTest/      # Webhook testing server
```

## Prerequisites

- Node.js (v16 or higher)  
- npm or yarn  
- Redis server (for Backend job queue)  

⚡ **Windows Users:** Official Redis for Windows is deprecated. Please use **Memurai** (a Redis-compatible server for Windows).

---

## Git Repository

The project is hosted on GitHub:  
🔗 [Queue-Management-Prashant](https://github.com/Codiantsoftware/Queue-Management-Prashant.git)  

- **Default branch:** `main` 
- **Updated branch:** `develop` 

### Clone the Repository
```bash
git clone https://github.com/Codiantsoftware/Queue-Management-Prashant.git
cd Queue-Management-Prashant
git checkout develop


## Quick Start

### 1. Install Dependencies

Install dependencies for all three projects:

```bash
# Backend dependencies
cd Backend
npm install

# Frontend dependencies
cd ../Frontend
npm install

# Webhook test server dependencies
cd ../WebhookTest
npm install
```

---

### 2. Start Redis/Memurai Server

Make sure Redis (or Memurai on Windows) is running on your system.  

#### **Windows (using Memurai)**

- Install Memurai with **Chocolatey**:
  ```powershell
  choco install memurai
  ```

  Or with **Winget**:
  ```powershell
  winget install Memurai.Developer
  ```

- Memurai installs as a **Windows Service** (default port: `6379`).  
- Service commands:
  ```powershell
  Start-Service Memurai     # Start Memurai
  Stop-Service Memurai      # Stop Memurai
  Get-Service Memurai       # Check status
  ```

- Test if it’s running:
  ```powershell
  redis-cli ping
  ```
  Expected output:
  ```
  PONG
  ```

#### **macOS**
```bash
brew install redis
brew services start redis
```

#### **Linux**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

### 3. Start All Servers

Open three terminal windows/tabs and run the following commands:

#### Terminal 1 - Backend Server
```bash
cd Backend
npm run dev
```
Backend will start on: [http://localhost:3000](http://localhost:3000)

#### Terminal 2 - Frontend Development Server
```bash
cd Frontend
npm run dev
```
Frontend will start on: [http://localhost:5173](http://localhost:5173)

#### Terminal 3 - Webhook Test Server
```bash
cd webhookTest
npm run dev
```
Webhook test server will start on: [http://localhost:3001](http://localhost:3001)

---

## Available Scripts

### Backend
- `npm start` - Start production server  
- `npm run dev` - Start development server with nodemon  

### Frontend
- `npm run dev` - Start development server  

### Webhook Test Server
- `npm start` - Start production server  
- `npm run dev` - Start development server with nodemon  

---

## Environment Variables

### Backend
Create a `.env` file in the `Backend` directory:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Frontend
Create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:3000
```

---

## Features

- **Backend**: RESTful API with job queue management, Redis/Memurai integration, security middleware  
- **Frontend**: Modern React app with Redux state management, Tailwind CSS styling  
- **Webhook Test**: Simple server to test webhook notifications from the Backend  

---

## API Endpoints

- `POST /api/jobs` - Create a new job  
- `GET /api/jobs` - Get all jobs  
- `GET /api/jobs/:id` - Get job by ID  
- `DELETE /api/jobs/:id` - Delete job by ID  

---

## Troubleshooting

1. **Redis/Memurai Connection Error**: Make sure Redis/Memurai server is running  
2. **Port Already in Use**: Change ports in the respective `.env` files  
3. **CORS Issues**: Check Backend CORS configuration  
4. **Module Not Found**: Run `npm install` in the respective project directory  

---

## Development

- **Backend**: Express.js with BullMQ for job queues  
- **Frontend**: React 18 with Vite and Tailwind CSS  
- **Webhook Test Server**: Simple Express.js server for testing notifications  

---

## License

ISC
