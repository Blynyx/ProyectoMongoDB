-- Sistema para Venta de Computadoras
-- Script 03: consultas de verificacion
-- Motor: PostgreSQL
--
-- Solo lectura. Se puede ejecutar las veces que se necesite.
-- Con la carga de 02_dml.sql, el total vendido debe ser 10975.50
-- y el producto 11 (Cable HDMI 2m) debe quedar con stock 0.

-- 1. Productos con su proveedor.
SELECT
    p.id_producto,
    p.nombre AS producto,
    p.marca,
    p.categoria,
    p.precio,
    p.stock,
    pr.id_proveedor,
    pr.nombre AS proveedor,
    pr.correo
FROM productos AS p
INNER JOIN proveedores AS pr ON pr.id_proveedor = p.id_proveedor
ORDER BY p.id_producto;

-- 2. Ventas con su cliente.
SELECT
    v.id_venta,
    v.fecha,
    v.total,
    c.id_cliente,
    c.nombre AS cliente,
    c.documento
FROM ventas AS v
INNER JOIN clientes AS c ON c.id_cliente = v.id_cliente
ORDER BY v.id_venta;

-- 3. Detalle de una venta concreta (venta 1).
--    Para revisar otra venta, cambie el valor 1.
SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    p.nombre AS producto,
    d.cantidad,
    d.precio_unitario,
    d.subtotal
FROM ventas AS v
INNER JOIN clientes AS c ON c.id_cliente = v.id_cliente
INNER JOIN detalle_venta AS d ON d.id_venta = v.id_venta
INNER JOIN productos AS p ON p.id_producto = d.id_producto
WHERE v.id_venta = 1
ORDER BY d.id_detalle;

-- 4. Importe calculado como cantidad x precio_unitario.
--    subtotal_correcto debe ser true en todas las filas.
SELECT
    d.id_detalle,
    d.id_venta,
    d.id_producto,
    d.cantidad,
    d.precio_unitario,
    (d.cantidad * d.precio_unitario) AS importe_calculado,
    d.subtotal,
    (d.subtotal = d.cantidad * d.precio_unitario) AS subtotal_correcto
FROM detalle_venta AS d
ORDER BY d.id_venta, d.id_detalle;

-- 5. Total vendido, comparado con la suma de los subtotales.
SELECT
    (SELECT COALESCE(SUM(total), 0) FROM ventas) AS total_vendido,
    (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_venta) AS suma_subtotales;

-- 6. Productos con stock disponible.
SELECT
    id_producto,
    nombre,
    marca,
    categoria,
    precio,
    stock
FROM productos
WHERE stock > 0
ORDER BY id_producto;

-- Consulta complementaria: productos agotados.
-- Con la carga inicial solo el Cable HDMI 2m queda en cero.
SELECT
    id_producto,
    nombre,
    stock
FROM productos
WHERE stock = 0
ORDER BY id_producto;

-- Cadena completa: cliente, venta, detalle, producto y proveedor.
SELECT
    v.id_venta,
    v.fecha,
    c.nombre AS cliente,
    p.nombre AS producto,
    pr.nombre AS proveedor,
    d.cantidad,
    d.precio_unitario,
    d.subtotal,
    v.total
FROM ventas AS v
INNER JOIN clientes AS c ON c.id_cliente = v.id_cliente
INNER JOIN detalle_venta AS d ON d.id_venta = v.id_venta
INNER JOIN productos AS p ON p.id_producto = d.id_producto
INNER JOIN proveedores AS pr ON pr.id_proveedor = p.id_proveedor
ORDER BY v.id_venta, d.id_detalle;

-- Unidades vendidas y stock actual por producto.
SELECT
    p.id_producto,
    p.nombre,
    p.stock AS stock_actual,
    COALESCE(SUM(d.cantidad), 0) AS unidades_vendidas
FROM productos AS p
LEFT JOIN detalle_venta AS d ON d.id_producto = p.id_producto
GROUP BY p.id_producto, p.nombre, p.stock
ORDER BY p.id_producto;
