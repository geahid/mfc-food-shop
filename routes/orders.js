const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/orders.json');

function readOrders() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeOrders(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

// GET all orders
router.get('/', (req, res) => {
  try {
    let orders = readOrders();
    if (req.query.userId) orders = orders.filter(o => o.userId === req.query.userId);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch { res.status(500).json({ error: 'Failed to load orders' }); }
});

// GET single order
router.get('/:id', (req, res) => {
  try {
    const orders = readOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST create order
router.post('/', (req, res) => {
  try {
    const orders = readOrders();
    const newOrder = {
      id: 'ord' + String(Date.now()).slice(-6),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeOrders(orders);
    res.status(201).json(newOrder);
  } catch { res.status(500).json({ error: 'Failed to create order' }); }
});

// PUT update order status
router.put('/:id', (req, res) => {
  try {
    const orders = readOrders();
    const idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    orders[idx] = { ...orders[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeOrders(orders);
    res.json(orders[idx]);
  } catch { res.status(500).json({ error: 'Failed to update order' }); }
});

// DELETE order
router.delete('/:id', (req, res) => {
  try {
    let orders = readOrders();
    orders = orders.filter(o => o.id !== req.params.id);
    writeOrders(orders);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete order' }); }
});

module.exports = router;
