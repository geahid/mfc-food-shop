const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/categories.json');

function readCategories() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeCategories(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

router.get('/', (req, res) => {
  try { res.json(readCategories()); }
  catch { res.status(500).json({ error: 'Failed to load categories' }); }
});

router.post('/', (req, res) => {
  try {
    const categories = readCategories();
    const newCat = { id: req.body.name.toLowerCase().replace(/\s+/g, '-'), ...req.body, count: 0 };
    categories.push(newCat);
    writeCategories(categories);
    res.status(201).json(newCat);
  } catch { res.status(500).json({ error: 'Failed to create category' }); }
});

router.put('/:id', (req, res) => {
  try {
    const categories = readCategories();
    const idx = categories.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    categories[idx] = { ...categories[idx], ...req.body };
    writeCategories(categories);
    res.json(categories[idx]);
  } catch { res.status(500).json({ error: 'Failed to update' }); }
});

router.delete('/:id', (req, res) => {
  try {
    let categories = readCategories();
    categories = categories.filter(c => c.id !== req.params.id);
    writeCategories(categories);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
});

module.exports = router;
