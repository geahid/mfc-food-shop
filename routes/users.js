const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/users.json');

function readUsers() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeUsers(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch { res.status(500).json({ error: 'Login failed' }); }
});

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
    const newUser = {
      id: 'u' + String(Date.now()).slice(-6),
      name, email, password, phone: phone || '',
      address: '', role: 'customer',
      createdAt: new Date().toISOString(),
      favorites: []
    };
    users.push(newUser);
    writeUsers(users);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch { res.status(500).json({ error: 'Registration failed' }); }
});

// GET all users (admin)
router.get('/', (req, res) => {
  try {
    const users = readUsers().map(({ password, ...u }) => u);
    res.json(users);
  } catch { res.status(500).json({ error: 'Failed to load users' }); }
});

// GET single user
router.get('/:id', (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PUT update user
router.put('/:id', (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const { password, ...updates } = req.body;
    users[idx] = { ...users[idx], ...updates };
    if (password) users[idx].password = password;
    writeUsers(users);
    const { password: _, ...safeUser } = users[idx];
    res.json(safeUser);
  } catch { res.status(500).json({ error: 'Failed to update user' }); }
});

// Update favorites
router.put('/:id/favorites', (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users[idx].favorites = req.body.favorites || [];
    writeUsers(users);
    res.json({ favorites: users[idx].favorites });
  } catch { res.status(500).json({ error: 'Failed to update favorites' }); }
});

// DELETE user
router.delete('/:id', (req, res) => {
  try {
    let users = readUsers();
    users = users.filter(u => u.id !== req.params.id);
    writeUsers(users);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete user' }); }
});

module.exports = router;
