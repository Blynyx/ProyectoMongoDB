# Endpoints de la API

API REST mínima del Sistema para Venta de Computadoras. Base URL local: `http://localhost:3000`.

Todas las respuestas son JSON. Los importes `NUMERIC(10,2)` viajan como texto (`"49.90"`) para no perder precisión. Las fechas viajan como texto `YYYY-MM-DD HH:MI:SS`, sin zona horaria.

Las consultas SQL usan parámetros (`$1`, `$2`, ...). Ningún endpoint arma SQL concatenando datos de la solicitud.

| Método | URL | Descripción |
| --- | --- | --- |
| GET | `/api/productos` | Lista productos con su proveedor |
| GET | `/api/productos/:id` | Devuelve un producto |
| POST | `/api/productos` | Registra un producto |
| GET | `/api/clientes` | Lista clientes |
| POST | `/api/clientes` | Registra un cliente |
| GET | `/api/proveedores` | Lista proveedores |
| POST | `/api/proveedores` | Registra un proveedor |
| GET | `/api/ventas` | Lista ventas con su cliente |
| GET | `/api/ventas/:id` | Devuelve una venta y sus detalles |
| POST | `/api/ventas` | Registra una venta en una transacción |

También existe `GET /`, que solo indica el nombre del proyecto y estas rutas.

## GET /api/productos

Lista todos los productos y el nombre del proveedor.

No recibe parámetros.

Respuesta `200`:

```json
[
  {
    "id_producto": 1,
    "nombre": "Laptop IdeaPad 3 15",
    "marca": "Lenovo",
    "categoria": "Laptop",
    "precio": "2499.00",
    "stock": 11,
    "id_proveedor": 1,
    "proveedor": "Andes Tech Distribuciones SAC"
  }
]
```

## GET /api/productos/:id

Devuelve un producto.

| Parámetro | Ubicación | Descripción |
| --- | --- | --- |
| id | Ruta | Entero positivo. `id_producto` |

Respuesta `200`:

```json
{
  "id_producto": 6,
  "nombre": "Mouse inalambrico M185",
  "marca": "Logitech",
  "categoria": "Periferico",
  "precio": "49.90",
  "stock": 37,
  "id_proveedor": 4,
  "proveedor": "Nova Perifericos SAC",
  "correo_proveedor": "hola@novaperifericos.pe"
}
```

Errores:

- `400` si el id no es un entero positivo.
- `404` si el producto no existe.

```json
{ "error": "El producto no existe." }
```

## POST /api/productos

Registra un producto. El proveedor debe existir.

| Campo | Tipo | Regla |
| --- | --- | --- |
| nombre | texto | Obligatorio, hasta 150 caracteres |
| marca | texto | Obligatorio, hasta 80 caracteres |
| categoria | texto | Obligatorio, hasta 80 caracteres |
| precio | texto o número | Mayor que cero, máximo dos decimales |
| stock | entero | Mayor o igual que cero |
| id_proveedor | entero | Debe existir en `proveedores` |

Solicitud:

```json
{
  "nombre": "Audifonos inalambricos",
  "marca": "Logitech",
  "categoria": "Periferico",
  "precio": "199.90",
  "stock": 15,
  "id_proveedor": 4
}
```

Respuesta `201`:

```json
{
  "id_producto": 12,
  "nombre": "Audifonos inalambricos",
  "marca": "Logitech",
  "categoria": "Periferico",
  "precio": "199.90",
  "stock": 15,
  "id_proveedor": 4
}
```

Errores: `400` si falta un dato o el precio no es válido; `404` si el proveedor no existe.

## GET /api/clientes

Lista los clientes. No recibe parámetros.

Respuesta `200`:

```json
[
  {
    "id_cliente": 1,
    "nombre": "Ana Torres Quispe",
    "documento": "45678912",
    "telefono": "987654321"
  }
]
```

## POST /api/clientes

Registra un cliente. `documento` no se puede repetir.

| Campo | Tipo | Regla |
| --- | --- | --- |
| nombre | texto | Obligatorio, hasta 150 caracteres |
| documento | texto | De 8 a 12 dígitos. Enviar como texto |
| telefono | texto | Obligatorio, hasta 20 caracteres |

Solicitud:

```json
{
  "nombre": "Pedro Ramos Vega",
  "documento": "44556677",
  "telefono": "955112233"
}
```

Respuesta `201`:

```json
{
  "id_cliente": 6,
  "nombre": "Pedro Ramos Vega",
  "documento": "44556677",
  "telefono": "955112233"
}
```

Errores: `400` si los datos no cumplen el formato; `409` si el documento ya existe.

```json
{ "error": "Ya existe un cliente con ese documento." }
```

## GET /api/proveedores

Lista los proveedores. No recibe parámetros.

Respuesta `200`:

```json
[
  {
    "id_proveedor": 1,
    "nombre": "Andes Tech Distribuciones SAC",
    "telefono": "01-4456789",
    "correo": "contacto@andestech.pe"
  }
]
```

## POST /api/proveedores

Registra un proveedor. `correo` no se puede repetir.

| Campo | Tipo | Regla |
| --- | --- | --- |
| nombre | texto | Obligatorio, hasta 120 caracteres |
| telefono | texto | Obligatorio, hasta 20 caracteres |
| correo | texto | Correo válido, hasta 120 caracteres |

Solicitud:

```json
{
  "nombre": "Sur Sistemas SAC",
  "telefono": "01-7001122",
  "correo": "ventas@sursistemas.pe"
}
```

Respuesta `201`:

```json
{
  "id_proveedor": 5,
  "nombre": "Sur Sistemas SAC",
  "telefono": "01-7001122",
  "correo": "ventas@sursistemas.pe"
}
```

Errores: `400` si los datos no son válidos; `409` si el correo ya existe.

## GET /api/ventas

Lista las ventas con el nombre y el documento del cliente. El detalle de cada venta se consulta en `GET /api/ventas/:id`.

No recibe parámetros.

Respuesta `200`:

```json
[
  {
    "id_venta": 1,
    "fecha": "2026-09-12 09:30:00",
    "total": "2598.80",
    "id_cliente": 1,
    "cliente": "Ana Torres Quispe",
    "documento": "45678912"
  }
]
```

## GET /api/ventas/:id

Devuelve la cabecera de una venta y sus líneas. `importe_calculado` repite la multiplicación `cantidad * precio_unitario` para comprobar el subtotal guardado.

| Parámetro | Ubicación | Descripción |
| --- | --- | --- |
| id | Ruta | Entero positivo. `id_venta` |

Respuesta `200`, con la carga de prueba y la venta 1:

```json
{
  "id_venta": 1,
  "id_cliente": 1,
  "cliente": "Ana Torres Quispe",
  "documento": "45678912",
  "fecha": "2026-09-12 09:30:00",
  "total": "2598.80",
  "detalles": [
    {
      "id_detalle": 1,
      "id_producto": 1,
      "producto": "Laptop IdeaPad 3 15",
      "cantidad": 1,
      "precio_unitario": "2499.00",
      "subtotal": "2499.00",
      "importe_calculado": "2499.00"
    },
    {
      "id_detalle": 2,
      "id_producto": 6,
      "producto": "Mouse inalambrico M185",
      "cantidad": 2,
      "precio_unitario": "49.90",
      "subtotal": "99.80",
      "importe_calculado": "99.80"
    }
  ]
}
```

Errores: `400` si el id no es válido; `404` si la venta no existe.

## POST /api/ventas

Registra una venta. El precio no se envía: se lee de `productos` dentro de la transacción.

| Campo | Tipo | Regla |
| --- | --- | --- |
| id_cliente | entero | Cliente existente |
| productos | arreglo | Al menos un elemento |
| productos[].id_producto | entero | Producto existente. No se repite en la misma venta |
| productos[].cantidad | entero | Mayor que cero y no mayor que el stock |

Si la solicitud trae un precio, la API lo ignora.

Solicitud:

```json
{
  "id_cliente": 2,
  "productos": [
    { "id_producto": 2, "cantidad": 1 },
    { "id_producto": 6, "cantidad": 1 }
  ]
}
```

Con la carga inicial, el producto 2 cuesta 2799.00 y el producto 6 cuesta 49.90. El total de este ejemplo es 2848.90. El `id_venta` será 8 solo si no se han creado ventas después de ejecutar `02_dml.sql`.

Respuesta `201`:

```json
{
  "id_venta": 8,
  "id_cliente": 2,
  "cliente": "Luis Mendoza Rios",
  "documento": "40123456",
  "fecha": "2026-10-27 16:30:00",
  "total": "2848.90",
  "detalles": [
    {
      "id_detalle": 13,
      "id_producto": 2,
      "cantidad": 1,
      "precio_unitario": "2799.00",
      "subtotal": "2799.00",
      "producto": "Laptop Vivobook 15"
    },
    {
      "id_detalle": 14,
      "id_producto": 6,
      "cantidad": 1,
      "precio_unitario": "49.90",
      "subtotal": "49.90",
      "producto": "Mouse inalambrico M185"
    }
  ]
}
```

La operación hace, en una sola transacción:

1. Comprueba que el cliente exista y bloquea su fila con `FOR SHARE`.
2. Bloquea cada producto con `FOR UPDATE`, en orden de `id_producto`.
3. Rechaza la venta si un producto no existe, si la cantidad no es positiva o si el stock no alcanza.
4. Lee el precio desde la fila bloqueada.
5. Inserta la venta y una línea por producto.
6. Calcula cada subtotal como `cantidad * precio_unitario` y el total como la suma de esos subtotales.
7. Descuenta el stock.
8. Ejecuta `COMMIT` si todo cuadra. Si algo falla, ejecuta `ROLLBACK` y no deja venta ni stock a medias.

Dos ventas simultáneas sobre los mismos productos esperan el bloqueo. La segunda ve el stock ya descontado.

Errores habituales:

```json
{ "error": "El cliente no existe." }
```

```json
{
  "error": "Uno o más productos no existen.",
  "productos_no_encontrados": [99]
}
```

```json
{
  "error": "Stock insuficiente para completar la venta.",
  "id_producto": 9,
  "producto": "Laptop Gamer Nitro 5",
  "stock_disponible": 4,
  "cantidad_solicitada": 5
}
```

| Estado | Cuándo |
| --- | --- |
| 400 | Falta `id_cliente`, la lista está vacía, hay cantidades inválidas o el mismo producto está repetido |
| 404 | El cliente o algún producto no existe |
| 409 | El stock no alcanza o no se pudo descontar |
| 503 | PostgreSQL no está disponible o las credenciales de `.env` no sirven |

Esta venta de ejemplo descuenta stock. Para volver a los datos de prueba, ejecute de nuevo `database/02_dml.sql`.
