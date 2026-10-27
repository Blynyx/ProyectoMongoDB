const express = require('express');
const { pool } = require('../db');
const {
  enteroPositivo,
  enteroNoNegativo,
  normalizarImporte,
  textoObligatorio,
  responderError
} = require('../validar');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT p.id_producto, p.nombre, p.marca, p.categoria, p.precio, p.stock,
              p.id_proveedor, pr.nombre AS proveedor
       FROM productos AS p
       INNER JOIN proveedores AS pr ON pr.id_proveedor = p.id_proveedor
       ORDER BY p.id_producto`
    );
    res.json(resultado.rows);
  } catch (err) {
    responderError(err, res);
  }
});

router.get('/:id', async (req, res) => {
  const idProducto = enteroPositivo(req.params.id);
  if (idProducto === null) {
    return res.status(400).json({ error: 'El id del producto debe ser un entero positivo.' });
  }

  try {
    const resultado = await pool.query(
      `SELECT p.id_producto, p.nombre, p.marca, p.categoria, p.precio, p.stock,
              p.id_proveedor, pr.nombre AS proveedor, pr.correo AS correo_proveedor
       FROM productos AS p
       INNER JOIN proveedores AS pr ON pr.id_proveedor = p.id_proveedor
       WHERE p.id_producto = $1`,
      [idProducto]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'El producto no existe.' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    responderError(err, res);
  }
});

router.post('/', async (req, res) => {
  const nombre = textoObligatorio(req.body?.nombre, 150);
  const marca = textoObligatorio(req.body?.marca, 80);
  const categoria = textoObligatorio(req.body?.categoria, 80);
  const precio = normalizarImporte(req.body?.precio);
  const stock = enteroNoNegativo(req.body?.stock);
  const idProveedor = enteroPositivo(req.body?.id_proveedor);

  if (!nombre || !marca || !categoria || !precio || stock === null || idProveedor === null) {
    return res.status(400).json({
      error: 'Datos inválidos. Envíe nombre, marca, categoria, precio mayor que cero, stock entero mayor o igual que cero e id_proveedor.'
    });
  }

  try {
    const proveedor = await pool.query(
      'SELECT id_proveedor FROM proveedores WHERE id_proveedor = $1',
      [idProveedor]
    );
    if (proveedor.rowCount === 0) {
      return res.status(404).json({ error: 'El proveedor no existe.' });
    }

    const insertado = await pool.query(
      `INSERT INTO productos (nombre, marca, categoria, precio, stock, id_proveedor)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_producto, nombre, marca, categoria, precio, stock, id_proveedor`,
      [nombre, marca, categoria, precio, stock, idProveedor]
    );
    res.status(201).json(insertado.rows[0]);
  } catch (err) {
    responderError(err, res);
  }
});

module.exports = router;
