# Modelo conceptual

Sistema para Venta de Computadoras.

Este modelo describe el negocio antes de definir tablas, tipos SQL o código. El alcance es el registro de proveedores, productos, clientes y ventas. No incluye facturación electrónica, usuarios ni un catálogo separado de categorías.

## Entidades y atributos principales

### Proveedor

Empresa que abastece productos.

| Atributo | Descripción | Identificador |
| --- | --- | --- |
| id_proveedor | Identificador del proveedor | Sí, primario |
| nombre | Razón social o nombre comercial | No |
| telefono | Teléfono de contacto | No |
| correo | Correo de contacto | No, único |

### Producto

Artículo que la tienda ofrece: laptops, monitores, periféricos, componentes y accesorios.

| Atributo | Descripción | Identificador |
| --- | --- | --- |
| id_producto | Identificador del producto | Sí, primario |
| nombre | Nombre comercial | No |
| marca | Marca del fabricante | No |
| categoria | Clasificación simple del producto | No |
| precio | Precio de venta vigente | No |
| stock | Unidades disponibles | No |
| id_proveedor | Proveedor que abastece el producto | Sí, foráneo |

La categoría es un atributo del producto. No se modela como entidad porque el enunciado fija cinco entidades.

### Cliente

Persona que compra en la tienda.

| Atributo | Descripción | Identificador |
| --- | --- | --- |
| id_cliente | Identificador del cliente | Sí, primario |
| nombre | Nombre del cliente | No |
| documento | Documento de identidad | No, único |
| telefono | Teléfono de contacto | No |

### Venta

Operación de compra realizada por un cliente.

| Atributo | Descripción | Identificador |
| --- | --- | --- |
| id_venta | Identificador de la venta | Sí, primario |
| id_cliente | Cliente que realiza la compra | Sí, foráneo |
| fecha | Fecha y hora de la venta | No |
| total | Suma de los subtotales de sus detalles | No |

### Detalle de venta

Línea de una venta: un producto, la cantidad comprada y el precio usado en esa operación.

| Atributo | Descripción | Identificador |
| --- | --- | --- |
| id_detalle | Identificador de la línea | Sí, primario |
| id_venta | Venta a la que pertenece | Sí, foráneo |
| id_producto | Producto vendido | Sí, foráneo |
| cantidad | Unidades vendidas | No |
| precio_unitario | Precio copiado al momento de la venta | No |
| subtotal | cantidad × precio_unitario | No |

El precio unitario se guarda en el detalle para que un cambio posterior del precio del producto no altere ventas ya registradas.

## Relaciones y cardinalidades

La notación (mínimo, máximo) indica cuántas veces participa cada entidad.

### Proveedor suministra Producto

Un proveedor tiene cero o muchos productos. Cada producto pertenece a un solo proveedor.

- Proveedor (1, 1) — (0, N) Producto, leída desde el producto.
- Cada producto tiene exactamente un proveedor.
- Un proveedor puede existir aunque todavía no tenga productos cargados.

### Cliente realiza Venta

Un cliente realiza cero o muchas ventas. Cada venta pertenece a un solo cliente.

- Cliente (1, 1) — (0, N) Venta, leída desde la venta.
- Cada venta tiene exactamente un cliente.
- Un cliente puede estar registrado sin haber comprado.

### Venta contiene Detalle de venta

Una venta contiene uno o varios detalles. Cada detalle pertenece a una sola venta.

- Venta (1, 1) — (1, N) Detalle de venta, leída desde el detalle.
- No tiene sentido una línea de detalle sin venta.
- En el modelo conceptual, una venta válida tiene al menos una línea.

### Producto se incluye en Detalle de venta

Un producto puede aparecer en cero o muchos detalles. Cada detalle referencia un solo producto.

- Producto (1, 1) — (0, N) Detalle de venta, leída desde el detalle.
- Un producto puede no haberse vendido nunca.
- El mismo producto puede venderse en distintas ventas.
- Dentro de una misma venta, el producto se registra en una sola línea. Si el cliente lleva varias unidades, aumenta la cantidad; no se repite el producto.

## Reglas del negocio reflejadas en el modelo

- El precio y el stock no pueden ser negativos. El precio de un producto en catálogo es mayor que cero.
- La cantidad de una línea es un entero mayor que cero.
- El subtotal de la línea es la cantidad multiplicada por el precio unitario de esa línea.
- El total de la venta es la suma de los subtotales de sus detalles.
- Al confirmar una venta se descuenta el stock. No se puede vender más stock del disponible.
- El documento del cliente no se repite. El correo del proveedor no se repite.

## Correspondencia con los demás entregables

Las cinco entidades de este documento son las cinco tablas de [modelo_relacional.md](modelo_relacional.md), del [diccionario de datos](diccionario_datos.md) y de `database/01_ddl.sql`. El diagrama está en [diagrama_er.md](diagrama_er.md).
