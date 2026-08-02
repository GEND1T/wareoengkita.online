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
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'OrganikStore Multi-Store E-Commerce REST API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
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

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 OrganikStore API Server is running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`=================================================`);
});

export default app;
