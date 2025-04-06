const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

// Helper functions
const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (error) {
    return [];
  }
};

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    return false;
  }
};

// API Routes
app.get('/api/users', (req, res) => {
  res.json(readData(USERS_FILE));
});

app.get('/api/tasks', (req, res) => {
  res.json(readData(TASKS_FILE));
});

app.post('/api/users', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Users data must be an array' });
  }
  
  if (writeData(USERS_FILE, req.body)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save users data' });
  }
});

app.post('/api/tasks', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Tasks data must be an array' });
  }
  
  if (writeData(TASKS_FILE, req.body)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to save tasks data' });
  }
});

app.get('/api/currentUser', (req, res) => {
  const userId = req.query.id;
  if (!userId) return res.status(404).json({ error: 'No user specified' });
  
  const users = readData(USERS_FILE);
  const user = users.find(u => u.username === userId);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/currentUser', (req, res) => {
  const user = req.body;
  if (!user || !user.username) {
    return res.status(400).json({ error: 'Invalid user data' });
  }
  
  const users = readData(USERS_FILE);
  if (!users.some(u => u.username === user.username)) {
    users.push(user);
    writeData(USERS_FILE, users);
  }
  
  res.json({ success: true });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});