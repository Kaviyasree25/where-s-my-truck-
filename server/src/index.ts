import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { simulationService } from './services/simulationService.js';
import { store } from './db/store.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

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
});
