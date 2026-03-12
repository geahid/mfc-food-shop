const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/products.json');

function readProducts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeProducts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all products
router.get('/', (req, res) => {
  try {
    let products = readProducts();
    const { category, search, featured, sort } = req.query;
    if (category && category !== 'all') products = products.filter(p => p.category === category);
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    if (featured === 'true') products = products.filter(p => p.featured);
    if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    res.json(products);
  } catch { res.status(500).json({ error: 'Failed to load products' }); }
});

// GET single product
router.get('/:id', (req, res) => {
  try {
    const products = readProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST create product
router.post('/', (req, res) => {
  try {
    const products = readProducts();
    const newProduct = {
      id: 'p' + String(Date.now()).slice(-6),
      ...req.body,
      rating: parseFloat(req.body.rating) || 4.5,
      reviews: parseInt(req.body.reviews) || 0,
      price: parseFloat(req.body.price),
      available: req.body.available !== false,
      featured: req.body.featured === true || req.body.featured === 'true'
    };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch { res.status(500).json({ error: 'Failed to create product' }); }
});

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const products = readProducts();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products[idx] = {
      ...products[idx],
      ...req.body,
      price: parseFloat(req.body.price) || products[idx].price,
      featured: req.body.featured === true || req.body.featured === 'true'
    };
    writeProducts(products);
    res.json(products[idx]);
  } catch { res.status(500).json({ error: 'Failed to update product' }); }
});

// DELETE product
router.delete('/:id', (req, res) => {
  try {
    let products = readProducts();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(idx, 1);
    writeProducts(products);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete product' }); }
});

module.exports = router;
