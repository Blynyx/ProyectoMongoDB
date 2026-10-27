const express = require('express');
const { pool } = require('../db');
const { enteroPositivo, responderError } = require('../validar');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT v.id_venta, v.fecha, v.total, v.id_cliente, c.nombre AS cliente, c.documento
       FROM ventas AS v
       INNER JOIN clientes AS c ON c.id_cliente = v.id_cliente
       ORDER BY v.id_venta`
    );
    res.json(resultado.rows);
  } catch (err) {
    responderError(err, res);
  }
});

router.get('/:id', async (req, res) => {
  const idVenta = enteroPositivo(req.params.id);
  if (idVenta === null) {
    return res.status(400).json({ error: 'El id de la venta debe ser un entero positivo.' });
  }

  try {
    const venta = await pool.query(
      `SELECT v.id_venta, v.id_cliente, c.nombre AS cliente, c.documento, v.fecha, v.total
       FROM ventas AS v
       INNER JOIN clientes AS c ON c.id_cliente = v.id_cliente
       WHERE v.id_venta = $1`,
      [idVenta]
    );
    if (venta.rowCount === 0) {
      return res.status(404).json({ error: 'La venta no existe.' });
    }

    const detalles = await pool.query(
      `SELECT d.id_detalle, d.id_producto, p.nombre AS producto, d.cantidad,
              d.precio_unitario, d.subtotal,
              (d.cantidad * d.precio_unitario) AS importe_calculado
       FROM detalle_venta AS d
       INNER JOIN productos AS p ON p.id_producto = d.id_producto
       WHERE d.id_venta = $1
       ORDER BY d.id_detalle`,
      [idVenta]
    );

    res.json({ ...venta.rows[0], detalles: detalles.rows });
  } catch (err) {
    responderError(err, res);
  }
});

router.post('/', async (req, res) => {
  const idCliente = enteroPositivo(req.body?.id_cliente);
  const productos = req.body?.productos;

  if (idCliente === null) {
    return res.status(400).json({ error: 'id_cliente es obligatorio y debe ser un entero positivo.' });
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'La venta debe incluir al menos un producto.' });
  }

  const lineas = [];
  for (const item of productos) {
    const idProducto = enteroPositivo(item?.id_producto);
    const cantidad = enteroPositivo(item?.cantidad);
    if (idProducto === null || cantidad === null) {
      return res.status(400).json({
        error: 'Cada producto debe incluir id_producto y cantidad como enteros positivos.'
      });
    }
    lineas.push({ id_producto: idProducto, cantidad });
  }

  const ids = lineas.map((linea) => linea.id_producto);
  if (new Set(ids).size !== ids.length) {
    return res.status(400).json({
      error: 'La venta no puede repetir el mismo producto. Agrupe las cantidades en una sola línea.'
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const cancelar = async (estado, cuerpo) => {
      await client.query('ROLLBACK');
      res.status(estado).json(cuerpo);
    };

    const cliente = await client.query(
      `SELECT id_cliente, nombre, documento
       FROM clientes
       WHERE id_cliente = $1
       FOR SHARE`,
      [idCliente]
    );
    if (cliente.rowCount === 0) {
      await cancelar(404, { error: 'El cliente no existe.' });
      return;
    }

    // Bloquea cada producto en orden de id. Dos ventas simultáneas no pueden
    // descontar el mismo stock, y el orden fijo reduce los interbloqueos.
    const idsOrdenados = [...ids].sort((a, b) => a - b);
    const porId = new Map();
    const faltantes = [];

    for (const idProducto of idsOrdenados) {
      const bloqueado = await client.query(
        `SELECT id_producto, nombre, precio, stock
         FROM productos
         WHERE id_producto = $1
         FOR UPDATE`,
        [idProducto]
      );
      if (bloqueado.rowCount === 0) {
        faltantes.push(idProducto);
      } else {
        porId.set(idProducto, bloqueado.rows[0]);
      }
    }

    if (faltantes.length > 0) {
      await cancelar(404, {
        error: 'Uno o más productos no existen.',
        productos_no_encontrados: faltantes
      });
      return;
    }

    for (const linea of lineas) {
      const producto = porId.get(linea.id_producto);
      if (producto.stock < linea.cantidad) {
        await cancelar(409, {
          error: 'Stock insuficiente para completar la venta.',
          id_producto: producto.id_producto,
          producto: producto.nombre,
          stock_disponible: producto.stock,
          cantidad_solicitada: linea.cantidad
        });
        return;
      }
    }

    const ventaInsertada = await client.query(
      `INSERT INTO ventas (id_cliente, total)
       VALUES ($1, 0)
       RETURNING id_venta, fecha`,
      [idCliente]
    );
    const idVenta = ventaInsertada.rows[0].id_venta;

    const detalles = [];
    for (const linea of lineas) {
      const producto = porId.get(linea.id_producto);
      const detalle = await client.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4::numeric, $3::integer * $4::numeric)
         RETURNING id_detalle, id_producto, cantidad, precio_unitario, subtotal`,
        [idVenta, linea.id_producto, linea.cantidad, producto.precio]
      );
      detalles.push({
        ...detalle.rows[0],
        producto: producto.nombre
      });
    }

    const totalActualizado = await client.query(
      `UPDATE ventas
       SET total = (
         SELECT COALESCE(SUM(subtotal), 0)
         FROM detalle_venta
         WHERE id_venta = $1
       )
       WHERE id_venta = $1
       RETURNING total`,
      [idVenta]
    );

    const stockActualizado = await client.query(
      `UPDATE productos AS p
       SET stock = p.stock - datos.cantidad
       FROM unnest($1::int[], $2::int[]) AS datos(id_producto, cantidad)
       WHERE p.id_producto = datos.id_producto
         AND p.stock >= datos.cantidad`,
      [ids, lineas.map((linea) => linea.cantidad)]
    );

    if (stockActualizado.rowCount !== lineas.length) {
      await cancelar(409, { error: 'No se pudo descontar el stock. La venta fue cancelada.' });
      return;
    }

    await client.query('COMMIT');

    res.status(201).json({
      id_venta: idVenta,
      id_cliente: idCliente,
      cliente: cliente.rows[0].nombre,
      documento: cliente.rows[0].documento,
      fecha: ventaInsertada.rows[0].fecha,
      total: totalActualizado.rows[0].total,
      detalles
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error(rollbackErr);
      }
    }
    if (!res.headersSent) {
      responderError(err, res);
    }
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
