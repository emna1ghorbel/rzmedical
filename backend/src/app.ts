import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import categoriesRoutes from './modules/categories/categories.routes';
import subcategoriesRoutes from './modules/subcategories/subcategories.routes';
import brandsRoutes from './modules/brands/brands.routes';
import productsRoutes from './modules/products/products.routes';
import uploadRoutes from './modules/upload/upload.routes';
import statsRoutes from './modules/stats/stats.routes';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import clientAuthRoutes from './modules/client-auth/client-auth.routes';
import ordersRoutes from './modules/orders/orders.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import inboxRoutes from './modules/inbox/inbox.routes';
import path from 'path';
import siteContentRoutes from './modules/site-content/site-content.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import supportRoutes from './modules/support/support.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/client-auth', clientAuthRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/support', supportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API MediSupply' });
});

export default app;
