import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import jamaahRoutes from './routes/jamaah.js';
import financeRoutes from './routes/finance.js';
import eventsRoutes from './routes/events.js';
import inventoryRoutes from './routes/inventory.js';
import organizationRoutes from './routes/organization.js';
import publicRoutes from './routes/public.js';

// Inisialisasi Database SQLite & Seeding
initDatabase();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Logging ringkas request API
app.use((req, res, next) => {
  console.log(`[API ${req.method}] ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Musholla Al-Muttaqin Backend API',
    database: 'SQLite WAL mode (Production Ready)',
    timestamp: new Date().toISOString(),
  });
});

// Daftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/jamaah', jamaahRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/public', publicRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ success: false, error: 'Terjadi kegagalan internal pada server' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  Musholla Al-Muttaqin API Server Berjalan!            `);
  console.log(`  Port     : ${PORT}                                   `);
  console.log(`  Database : SQLite Production Ready                   `);
  console.log(`=======================================================`);
});
