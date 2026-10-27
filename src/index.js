require('dotenv').config();

const express = require('express');
const { pool } = require('./db');
const productos = require('./routes/productos');
const clientes = require('./routes/clientes');
const proveedores = require('./routes/proveedores');
const ventas = require('./routes/ventas');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    proyecto: 'Sistema para Venta de Computadoras',
    documentacion: 'routes/README.md',
    recursos: ['/api/productos', '/api/clientes', '/api/proveedores', '/api/ventas']
  });
});

app.use('/api/productos', productos);
app.use('/api/clientes', clientes);
app.use('/api/proveedores', proveedores);
app.use('/api/ventas', ventas);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const puerto = Number(process.env.PORT) || 3000;

const servidor = app.listen(puerto, () => {
  console.log(`API escuchando en http://localhost:${puerto}`);
});

async function cerrar() {
  servidor.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
