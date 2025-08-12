import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupCustomerRoutes } from './routes/customers';
import { setupContactRoutes } from './routes/contacts';
import { setupOrganizationRoutes } from './routes/organizations';
import { setupOrderRoutes } from './routes/orders';
import { setupInvoiceRoutes } from './routes/invoices';

dotenv.config();

const SEVDESK_API = 'https://my.sevdesk.de/api/v1';
const AUTH_HEADER = {
  'Authorization': process.env.SEVDESK_API_KEY,
  'Accept': 'application/json',
  'User-Agent': 'Web-Dashboard'
};

export function setupAPI(server: any) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  setupCustomerRoutes(app, SEVDESK_API, AUTH_HEADER);
  setupContactRoutes(app, SEVDESK_API, AUTH_HEADER);
  setupOrganizationRoutes(app, SEVDESK_API, AUTH_HEADER);
  setupOrderRoutes(app, SEVDESK_API, AUTH_HEADER);
  setupInvoiceRoutes(app, SEVDESK_API, AUTH_HEADER);

  server.middlewares.use(app);
}