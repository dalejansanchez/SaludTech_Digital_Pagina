const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Simple CORS middleware to allow frontend requests (e.g., from http://localhost:5500)
// Middleware CORS simple para permitir peticiones desde el frontend (por ejemplo, desde http://localhost:5500)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

const DB_DIR = path.join(__dirname, 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');
const PURCHASES_FILE = path.join(DB_DIR, 'purchases.json');
const CARTS_FILE = path.join(DB_DIR, 'carts.json');
const SERVICES_FILE = path.join(__dirname, 'data', 'servicios.json');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Registro
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  const users = readJson(USERS_FILE) || [];
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'usuario ya existe' });

  const newUser = { id: uuidv4(), email, password, role: 'client' };
  users.push(newUser);
  writeJson(USERS_FILE, users);
  const token = uuidv4();
  const sessions = readJson(SESSIONS_FILE) || [];
  sessions.push({ token, userId: newUser.id });
  writeJson(SESSIONS_FILE, sessions);

  res.json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

// Inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJson(USERS_FILE) || [];
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'credenciales inválidas' });

  const token = uuidv4();
  const sessions = readJson(SESSIONS_FILE) || [];
  sessions.push({ token, userId: user.id });
  writeJson(SESSIONS_FILE, sessions);

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'no autorizado' });
  const token = auth.replace('Bearer ', '');
  const sessions = readJson(SESSIONS_FILE) || [];
  const session = sessions.find(s => s.token === token);
  if (!session) return res.status(401).json({ error: 'token inválido' });
  const users = readJson(USERS_FILE) || [];
  req.user = users.find(u => u.id === session.userId);
  next();
}

// Listar servicios (solo lectura)
app.get('/servicios', (req, res) => {
  const data = readJson(SERVICES_FILE);
  if (!data) return res.status(500).json({ error: 'no hay servicios disponibles' });
  // Si la estructura es { servicios: [...] } devolver el array
  const servicios = Array.isArray(data) ? data : data.servicios;
  res.json(servicios);
});

// Devuelve información del usuario actual según el token
app.get('/me', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'no autorizado' });
  const { id, email, role } = req.user;
  res.json({ id, email, role });
});

// Endpoint de compra (autenticado)
app.post('/purchase', authMiddleware, (req, res) => {
  const { items } = req.body; // items: [{ id: servicioId, quantity: number }]
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items requeridos' });

  const serviciosData = readJson(SERVICES_FILE);
  const servicios = Array.isArray(serviciosData) ? serviciosData : serviciosData.servicios;

  // Construir líneas de compra y sumar precios a partir de los servicios actuales (evita manipulación por parte del cliente)
  const lines = [];
  let total = 0;
  for (const it of items) {
    const s = servicios.find(ss => ss.id === it.id);
    if (!s) return res.status(400).json({ error: `servicio ${it.id} no encontrado` });
    const precioNum = Number(String(s.precio).replace(/[^0-9]/g, '')) || 0; // crude parse
    const qty = Number(it.quantity) || 1;
    const lineTotal = precioNum * qty;
    lines.push({ servicioId: s.id, nombre: s.nombre, precio: s.precio, qty, lineTotal });
    total += lineTotal;
  }

  const purchases = readJson(PURCHASES_FILE) || [];
  const purchase = {
    id: uuidv4(),
    userId: req.user.id,
    items: lines,
    total,
    createdAt: new Date().toISOString()
  };
  purchases.push(purchase);
  writeJson(PURCHASES_FILE, purchases);

  res.json({ success: true, purchase });
});

// Obtener compras del usuario (autenticado)
app.get('/my-purchases', authMiddleware, (req, res) => {
  const purchases = readJson(PURCHASES_FILE) || [];
  const mine = purchases.filter(p => p.userId === req.user.id);
  res.json(mine);
});

// Obtener carrito del usuario
app.get('/cart', authMiddleware, (req, res) => {
  const carts = readJson(CARTS_FILE) || [];
  const mine = carts.find(c => c.userId === req.user.id);
  res.json(mine ? mine.items : []);
});

// Reemplazar carrito del usuario (sincronización completa)
app.put('/cart', authMiddleware, (req, res) => {
  const { items } = req.body; // array of { id, nombre?, precio?, quantity }
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array' });
  const carts = readJson(CARTS_FILE) || [];
  const existingIndex = carts.findIndex(c => c.userId === req.user.id);
  const entry = { userId: req.user.id, items };
  if (existingIndex >= 0) {
    carts[existingIndex] = entry;
  } else {
    carts.push(entry);
  }
  writeJson(CARTS_FILE, carts);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
