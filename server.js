const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);

// Serve offers
const fs = require('fs');
app.get('/api/offers', (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data/offers.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch { res.status(500).json({ error: 'Failed to load offers' }); }
});

app.put('/api/offers/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/offers.json'), 'utf-8'));
    const idx = data.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...data[idx], ...req.body };
    fs.writeFileSync(path.join(__dirname, 'data/offers.json'), JSON.stringify(data, null, 2));
    res.json(data[idx]);
  } catch { res.status(500).json({ error: 'Failed to update offer' }); }
});

// Stats endpoint for admin
app.get('/api/stats', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf-8'));
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json'), 'utf-8'));
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/orders.json'), 'utf-8'));
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    res.json({
      totalProducts: products.length,
      totalUsers: users.filter(u => u.role !== 'admin').length,
      totalOrders: orders.length,
      totalRevenue: revenue.toFixed(2),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      recentOrders: orders.slice(-5).reverse()
    });
  } catch { res.status(500).json({ error: 'Failed to load stats' }); }
});

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/index.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/menu.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/checkout.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/register.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/profile.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/orders.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/admin.html')));
app.get('/admin/products', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/manage-products.html')));
app.get('/admin/orders', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/manage-products.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/manage-products.html')));
app.get('/admin/categories', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/manage-products.html')));
app.get('/admin/offers', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/manage-products.html')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 MFC Food Shop running at http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin`);
  console.log(`   Menu:  http://localhost:${PORT}/menu\n`);
});
