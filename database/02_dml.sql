-- Sistema para Venta de Computadoras
-- Script 02: datos de prueba (DML)
-- Motor: PostgreSQL
--
-- Los registros son ficticios y sirven solo para el ejercicio academico.
-- Este script se puede ejecutar mas de una vez: primero vacia las cinco tablas,
-- reinicia las secuencias e inserta de nuevo la misma carga.
-- Requiere que 01_ddl.sql ya se haya ejecutado.
--
-- El stock insertado es el stock inicial. Al final se descuentan las unidades
-- vendidas, de modo que el stock almacenado queda como stock actual.

BEGIN;

TRUNCATE TABLE
    detalle_venta,
    ventas,
    productos,
    clientes,
    proveedores
RESTART IDENTITY;

INSERT INTO proveedores (id_proveedor, nombre, telefono, correo) VALUES
    (1, 'Andes Tech Distribuciones SAC', '01-4456789', 'contacto@andestech.pe'),
    (2, 'Pacific Hardware SAC', '01-4567890', 'ventas@pacifichardware.pe'),
    (3, 'Lima Componentes EIRL', '01-5678901', 'pedidos@limacomponentes.pe'),
    (4, 'Nova Perifericos SAC', '01-6789012', 'hola@novaperifericos.pe');

INSERT INTO clientes (id_cliente, nombre, documento, telefono) VALUES
    (1, 'Ana Torres Quispe', '45678912', '987654321'),
    (2, 'Luis Mendoza Rios', '40123456', '912345678'),
    (3, 'Carmen Flores Diaz', '47890123', '998877665'),
    (4, 'Jorge Paredes Silva', '42345678', '965432187'),
    (5, 'Maria Huaman Ccahuana', '48901234', '934567890');

-- stock: valor inicial, antes de aplicar las ventas de este script.
INSERT INTO productos (id_producto, nombre, marca, categoria, precio, stock, id_proveedor) VALUES
    (1,  'Laptop IdeaPad 3 15',     'Lenovo',   'Laptop',          2499.00, 12, 1),
    (2,  'Laptop Vivobook 15',      'ASUS',     'Laptop',          2799.00,  8, 1),
    (3,  'Monitor 24 pulgadas',     'LG',       'Monitor',          649.00, 20, 2),
    (4,  'Monitor 27 pulgadas',     'Samsung',  'Monitor',          899.00, 10, 2),
    (5,  'Teclado mecanico K552',   'Redragon', 'Periferico',       149.90, 30, 4),
    (6,  'Mouse inalambrico M185',  'Logitech', 'Periferico',        49.90, 40, 4),
    (7,  'Memoria RAM 16GB DDR4',   'Kingston', 'Componente',       189.00, 25, 3),
    (8,  'SSD 1TB NVMe',            'Kingston', 'Almacenamiento',   279.00, 18, 3),
    (9,  'Laptop Gamer Nitro 5',    'Acer',     'Laptop',          4299.00,  5, 1),
    (10, 'Impresora Laser',         'HP',       'Impresora',        799.00,  7, 2),
    (11, 'Cable HDMI 2m',           'Steren',   'Accesorio',         25.00,  3, 4);

INSERT INTO ventas (id_venta, id_cliente, fecha, total) VALUES
    (1, 1, TIMESTAMP '2026-09-12 09:30:00', 2598.80),
    (2, 2, TIMESTAMP '2026-09-18 15:05:00', 1447.90),
    (3, 3, TIMESTAMP '2026-09-25 11:20:00',  657.00),
    (4, 4, TIMESTAMP '2026-10-02 18:45:00', 5198.00),
    (5, 5, TIMESTAMP '2026-10-10 13:10:00',  199.80),
    (6, 1, TIMESTAMP '2026-10-15 10:00:00',  799.00),
    (7, 2, TIMESTAMP '2026-10-20 16:25:00',   75.00);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
    (1, 1,  1, 2499.00, 2499.00),
    (1, 6,  2,   49.90,   99.80),
    (2, 3,  2,  649.00, 1298.00),
    (2, 5,  1,  149.90,  149.90),
    (3, 7,  2,  189.00,  378.00),
    (3, 8,  1,  279.00,  279.00),
    (4, 9,  1, 4299.00, 4299.00),
    (4, 4,  1,  899.00,  899.00),
    (5, 5,  1,  149.90,  149.90),
    (5, 6,  1,   49.90,   49.90),
    (6, 10, 1,  799.00,  799.00),
    (7, 11, 3,   25.00,   75.00);

-- El stock actual es el stock inicial menos lo vendido en detalle_venta.
UPDATE productos AS p
SET stock = p.stock - vendido.unidades
FROM (
    SELECT id_producto, SUM(cantidad) AS unidades
    FROM detalle_venta
    GROUP BY id_producto
) AS vendido
WHERE p.id_producto = vendido.id_producto;

-- Los INSERT usan ids explicitos. Hay que dejar cada secuencia en el maximo
-- para que la API no vuelva a generar un id ya ocupado.
DO $$
BEGIN
    PERFORM setval(pg_get_serial_sequence('proveedores', 'id_proveedor'), (SELECT MAX(id_proveedor) FROM proveedores));
    PERFORM setval(pg_get_serial_sequence('clientes', 'id_cliente'), (SELECT MAX(id_cliente) FROM clientes));
    PERFORM setval(pg_get_serial_sequence('productos', 'id_producto'), (SELECT MAX(id_producto) FROM productos));
    PERFORM setval(pg_get_serial_sequence('ventas', 'id_venta'), (SELECT MAX(id_venta) FROM ventas));
    PERFORM setval(pg_get_serial_sequence('detalle_venta', 'id_detalle'), (SELECT MAX(id_detalle) FROM detalle_venta));
END $$;

DO $$
DECLARE
    ventas_inconsistentes INTEGER;
    stock_inconsistente INTEGER;
    total_ventas NUMERIC(10, 2);
    total_detalles NUMERIC(10, 2);
BEGIN
    IF (SELECT COUNT(*) FROM proveedores) <> 4
        OR (SELECT COUNT(*) FROM clientes) <> 5
        OR (SELECT COUNT(*) FROM productos) <> 11
        OR (SELECT COUNT(*) FROM ventas) <> 7
        OR (SELECT COUNT(*) FROM detalle_venta) <> 12
    THEN
        RAISE EXCEPTION 'La carga de prueba no tiene la cantidad de filas esperada.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM ventas AS v
        WHERE NOT EXISTS (
            SELECT 1
            FROM detalle_venta AS d
            WHERE d.id_venta = v.id_venta
        )
    ) THEN
        RAISE EXCEPTION 'Hay una venta sin detalle.';
    END IF;

    SELECT COUNT(*)
    INTO ventas_inconsistentes
    FROM (
        VALUES
            (1, 2598.80::NUMERIC),
            (2, 1447.90::NUMERIC),
            (3,  657.00::NUMERIC),
            (4, 5198.00::NUMERIC),
            (5,  199.80::NUMERIC),
            (6,  799.00::NUMERIC),
            (7,   75.00::NUMERIC)
    ) AS esperado(id_venta, total)
    JOIN ventas AS v ON v.id_venta = esperado.id_venta
    WHERE v.total <> esperado.total
       OR v.total <> (
            SELECT SUM(d.subtotal)
            FROM detalle_venta AS d
            WHERE d.id_venta = v.id_venta
       );

    IF ventas_inconsistentes > 0 THEN
        RAISE EXCEPTION 'Hay ventas cuyo total no coincide con sus detalles.';
    END IF;

    SELECT COALESCE(SUM(total), 0) INTO total_ventas FROM ventas;
    SELECT COALESCE(SUM(subtotal), 0) INTO total_detalles FROM detalle_venta;

    IF total_ventas <> total_detalles OR total_ventas <> 10975.50 THEN
        RAISE EXCEPTION 'El total vendido esperado es 10975.50 y se obtuvo %.', total_ventas;
    END IF;

    SELECT COUNT(*)
    INTO stock_inconsistente
    FROM (
        VALUES
            (1, 11),
            (2,  8),
            (3, 18),
            (4,  9),
            (5, 28),
            (6, 37),
            (7, 23),
            (8, 17),
            (9,  4),
            (10, 6),
            (11, 0)
    ) AS esperado(id_producto, stock)
    JOIN productos AS p ON p.id_producto = esperado.id_producto
    WHERE p.stock <> esperado.stock;

    IF stock_inconsistente > 0 THEN
        RAISE EXCEPTION 'El stock final no coincide con el stock inicial menos las ventas.';
    END IF;
END $$;

COMMIT;
