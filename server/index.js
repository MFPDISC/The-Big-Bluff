import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import stocksRouter from './routes/stocks.js';
import bitcoinRouter from './routes/bitcoin.js';
import macroRouter from './routes/macro.js';
import riskRouter from './routes/risk.js';
import alertsRouter from './routes/alerts.js';
import correlationsRouter from './routes/correlations.js';
import debtMaturityRouter from './routes/debtMaturity.js';
import bubbleRouter from './routes/bubble.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Trust proxy - important for rate limiting behind Nginx
app.set('trust proxy', 1);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// 🛡️ ENHANCED SECURITY & RATE LIMITING

// General API rate limiting - Prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 200, // Increased for better UX
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes',
    tip: 'Please wait before making more requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip;
      return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  },
  // Custom key generator to handle proxies better
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

// 🚨 Aggressive rate limiting for suspicious activity
const aggressiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Very strict limit
  message: {
    error: 'Suspicious activity detected',
    message: 'Your IP has been temporarily blocked due to unusual request patterns'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 💰 Expensive endpoints (data fetching)
const expensiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Increased for development
  message: {
    error: 'Rate limit exceeded for data endpoints',
    retryAfter: '10 minutes'
  }
});

// 🔒 Auth/sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict for auth attempts
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes'
  }
});

// 🌊 DDoS Protection - Ultra strict
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute per IP
  message: {
    error: 'DDoS protection activated',
    message: 'Too many requests in a short time. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for known good IPs (optional)
  skip: (req) => {
    // You can add trusted IPs here if needed
    const trustedIPs = ['127.0.0.1', '::1'];
    return process.env.NODE_ENV === 'development' && trustedIPs.includes(req.ip);
  }
});

// 🛡️ SECURITY MIDDLEWARE STACK
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

// Enhanced CORS with security
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://bigbluff.btcnews.co.za',
      'http://localhost:3302' // Vite dev server
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits (prevent large payload attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🌊 Apply DDoS protection first (most aggressive)
app.use(ddosProtection);

// 🔍 Suspicious activity detection
app.use((req, res, next) => {
  const suspiciousPatterns = [
    /\.php$/i,
    /\.asp$/i,
    /wp-admin/i,
    /wp-login/i,
    /admin/i,
    /phpmyadmin/i,
    /\.env$/i,
    /\.git/i,
    /\.sql$/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(req.path));

  if (isSuspicious) {
    console.warn(`🚨 Suspicious request detected: ${req.ip} -> ${req.path}`);
    return aggressiveLimiter(req, res, next);
  }

  next();
});

// 💰 Apply rate limiting to API routes
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    security: 'protected'
  });
});

// 📊 Security monitoring endpoint (admin only)
app.get('/api/security/status', authLimiter, (req, res) => {
  res.json({
    message: 'Security systems active',
    rateLimits: {
      general: '200 requests per 15 minutes',
      expensive: '50 requests per 10 minutes',
      ddos: '100 requests per minute',
      suspicious: '10 requests per 5 minutes'
    },
    protections: [
      'DDoS Protection',
      'Rate Limiting',
      'CORS Protection',
      'Helmet Security Headers',
      'Suspicious Pattern Detection',
      'Request Size Limits'
    ]
  });
});

// 🛣️ API Routes with specific rate limiting
app.use('/api/stocks', expensiveLimiter, stocksRouter);
app.use('/api/bitcoin', expensiveLimiter, bitcoinRouter);
app.use('/api/macro', expensiveLimiter, macroRouter);
app.use('/api/risk', expensiveLimiter, riskRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/correlations', expensiveLimiter, correlationsRouter);
app.use('/api/debt-maturity', expensiveLimiter, debtMaturityRouter);
app.use('/api/bubble', expensiveLimiter, bubbleRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally for routes
app.set('io', io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   The Big Bluff Dashboard - Backend   ║
║   Server running on port ${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
╚════════════════════════════════════════╝
  `);
});

export default app;
export { io, expensiveLimiter, authLimiter, aggressiveLimiter };
