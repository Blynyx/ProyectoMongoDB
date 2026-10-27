const express = require('express');
const { pool } = require('../db');
const { textoObligatorio, normalizarDocumento, responderError } = require('../validar');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id_cliente, nombre, documento, telefono
       FROM clientes
       ORDER BY id_cliente`
    );
    res.json(resultado.rows);
  } catch (err) {
    responderError(err, res);
  }
});

router.post('/', async (req, res) => {
  const nombre = textoObligatorio(req.body?.nombre, 150);
  const documento = normalizarDocumento(req.body?.documento);
  const telefono = textoObligatorio(req.body?.telefono, 20);

  if (!nombre || !documento || !telefono) {
    return res.status(400).json({
      error: 'Datos inválidos. Envíe nombre, documento numérico de 8 a 12 dígitos y telefono.'
    });
  }

  try {
    const insertado = await pool.query(
      `INSERT INTO clientes (nombre, documento, telefono)
       VALUES ($1, $2, $3)
       RETURNING id_cliente, nombre, documento, telefono`,
      [nombre, documento, telefono]
    );
    res.status(201).json(insertado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese documento.' });
    }
    responderError(err, res);
  }
});

module.exports = router;
