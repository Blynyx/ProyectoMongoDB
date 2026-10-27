const express = require('express');
const { pool } = require('../db');
const { textoObligatorio, normalizarCorreo, responderError } = require('../validar');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id_proveedor, nombre, telefono, correo
       FROM proveedores
       ORDER BY id_proveedor`
    );
    res.json(resultado.rows);
  } catch (err) {
    responderError(err, res);
  }
});

router.post('/', async (req, res) => {
  const nombre = textoObligatorio(req.body?.nombre, 120);
  const telefono = textoObligatorio(req.body?.telefono, 20);
  const correo = normalizarCorreo(req.body?.correo);

  if (!nombre || !telefono || !correo) {
    return res.status(400).json({
      error: 'Datos inválidos. Envíe nombre, telefono y un correo válido.'
    });
  }

  try {
    const insertado = await pool.query(
      `INSERT INTO proveedores (nombre, telefono, correo)
       VALUES ($1, $2, $3)
       RETURNING id_proveedor, nombre, telefono, correo`,
      [nombre, telefono, correo]
    );
    res.status(201).json(insertado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un proveedor con ese correo.' });
    }
    responderError(err, res);
  }
});

module.exports = router;
