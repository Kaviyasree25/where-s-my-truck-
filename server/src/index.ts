import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { simulationService } from './services/simulationService.js';
import { tickTrailerPositions, initializeRoutes } from './services/positionSimulator.js';
import { startDockRotationSimulator } from './services/dockRotationSimulator.js';
import { store } from './db/store.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'where-s-my-truck-control-tower',
    healthy: true,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    healthy: true,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount API router
app.use('/api', apiRouter);

// HTTP & Socket.IO Server setup
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Pass Socket.IO instance to simulation service
simulationService.setSocketServer(io);

io.on('connection', socket => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send initial state upon connection
  socket.emit('INITIAL_STATE', {
    kpis: store.getAnalyticsKPIs(),
    shipments: store.getShipments(),
    docks: store.getDocks(),
    yard: store.getYardSlots(),
    exceptions: store.getExceptions(),
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 INBOUND WAREHOUSE CONTROL TOWER BACKEND READY`);
  console.log(`📡 REST API Endpoint: http://localhost:${PORT}/api/shipments`);
  console.log(`🔌 Socket.IO Server: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  // Fetch OSRM road routes first, then start position ticks
  // Trucks will follow actual highway geometry on the map
  initializeRoutes()
    .then(() => {
      setInterval(() => tickTrailerPositions(io), 4000);
    })
    .catch((err) => {
      console.error('Route init error — starting ticks with fallback paths:', err);
      setInterval(() => tickTrailerPositions(io), 4000);
    });

  // Start live dock rotation simulator (ticks every 60s)
  // Automatically advances unloading timers and rotates next queued trailer into freed dock
  startDockRotationSimulator(io);
  console.log('[Server] ⏱ Dock rotation simulator wired — real-time bay turnover active');
});
