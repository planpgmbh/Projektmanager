import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupCustomerRoutes } from '../../api/routes/customers';
import { setupContactRoutes } from '../../api/routes/contacts';
import { setupOrganizationRoutes } from '../../api/routes/organizations';
import { setupOrderRoutes } from '../../api/routes/orders';
import { setupInvoiceRoutes } from '../../api/routes/invoices';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://projectmanager.plan-p.de'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// SevDesk API configuration
const SEVDESK_API = 'https://my.sevdesk.de/api/v1';
const AUTH_HEADER = {
  'Authorization': process.env.SEVDESK_API_KEY,
  'Accept': 'application/json',
  'User-Agent': 'Web-Dashboard'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    sevdeskConfigured: !!process.env.SEVDESK_API_KEY
  });
});

// Setup API routes
setupCustomerRoutes(app, SEVDESK_API, AUTH_HEADER);
setupContactRoutes(app, SEVDESK_API, AUTH_HEADER);
setupOrganizationRoutes(app, SEVDESK_API, AUTH_HEADER);
setupOrderRoutes(app, SEVDESK_API, AUTH_HEADER);
setupInvoiceRoutes(app, SEVDESK_API, AUTH_HEADER);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Backend error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 SevDesk API Key configured: ${!!process.env.SEVDESK_API_KEY}`);
  console.log(`🌐 CORS origins: ${JSON.stringify(process.env.NODE_ENV === 'production' 
    ? ['https://projectmanager.plan-p.de'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'])}`);
});

export default app;