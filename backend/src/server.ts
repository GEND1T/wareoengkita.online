import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import storeRoutes from './routes/storeRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import storeRegistrationRoutes from './routes/storeRegistrationRoutes';
import addressRoutes from './routes/addressRoutes';
import promoRoutes from './routes/promoRoutes';
import optionRoutes from './routes/optionRoutes';
import uploadRoutes from './routes/uploadRoutes';
import pembayaranRoutes from './routes/pembayaranRoutes';
import withdrawalRoutes from './routes/withdrawalRoutes';
import shippingRoutes from './routes/shippingRoutes';
import { handleDisbursementWebhook } from './controllers/disbursementWebhookController';
import { handleBiteshipWebhook } from './controllers/shippingController';
import { errorHandler } from './middlewares/errorHandler';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Global Rate Limiter (1000 requests per 15 mins per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' },
});
app.use(globalLimiter);

// Auth Rate Limiter (20 attempts per 15 mins per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan autentikasi, silakan tunggu 15 menit.' },
});

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://waroengkita.online',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Allow configured origins
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'WaroengKita Multi-Store E-Commerce REST API',
    timestamp: new Date().toISOString(),
  });
});

// Webhook Disbursement Callback Endpoint
app.post('/api/webhook/disbursement', handleDisbursementWebhook);
app.post('/api/webhook/biteship', handleBiteshipWebhook);

// API Routes Mounting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/store-registrations', storeRegistrationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/shipping', shippingRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 WaroengKita API Server is running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`=================================================`);
});

export default app;
