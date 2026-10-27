# Modelo relacional

Sistema para Venta de Computadoras.

Cada entidad del modelo conceptual se transforma en una relación. Los atributos multivaluados no aparecen: teléfono y correo se guardan como un solo valor por fila, que es lo que pide el enunciado. La categoría tampoco se separa en otra tabla.

La clave primaria está marcada como **PK**. La clave foránea está marcada como **FK**.

## Esquema

```text
proveedores (id_proveedor PK, nombre, telefono, correo)
productos   (id_producto PK, nombre, marca, categoria, precio, stock, id_proveedor FK)
clientes    (id_cliente PK, nombre, documento, telefono)
ventas      (id_venta PK, id_cliente FK, fecha, total)
detalle_venta (id_detalle PK, id_venta FK, id_producto FK, cantidad, precio_unitario, subtotal)
```

## Tablas

### proveedores

| Atributo | Clave | Regla |
| --- | --- | --- |
| id_proveedor | PK | Identifica al proveedor |
| nombre |  | Obligatorio |
| telefono |  | Obligatorio |
| correo | UNIQUE | Obligatorio y no se repite |

### productos

| Atributo | Clave | Regla |
| --- | --- | --- |
| id_producto | PK | Identifica al producto |
| nombre |  | Obligatorio |
| marca |  | Obligatorio |
| categoria |  | Obligatorio |
| precio |  | Obligatorio y mayor que cero |
| stock |  | Obligatorio y mayor o igual que cero |
| id_proveedor | FK → proveedores.id_proveedor | Obligatorio |

### clientes

| Atributo | Clave | Regla |
| --- | --- | --- |
| id_cliente | PK | Identifica al cliente |
| nombre |  | Obligatorio |
| documento | UNIQUE | Obligatorio y no se repite |
| telefono |  | Obligatorio |

### ventas

| Atributo | Clave | Regla |
| --- | --- | --- |
| id_venta | PK | Identifica la venta |
| id_cliente | FK → clientes.id_cliente | Obligatorio |
| fecha |  | Obligatorio |
| total |  | Obligatorio. Es la suma de los subtotales de sus detalles |

### detalle_venta

| Atributo | Clave | Regla |
| --- | --- | --- |
| id_detalle | PK | Identifica la línea |
| id_venta | FK → ventas.id_venta | Obligatorio |
| id_producto | FK → productos.id_producto | Obligatorio |
| cantidad |  | Entero mayor que cero |
| precio_unitario |  | Mayor que cero. Se copia del producto al vender |
| subtotal |  | Igual a cantidad × precio_unitario |

La pareja `(id_venta, id_producto)` es única. Así un producto no se repite dentro de la misma venta y la relación “un producto aparece en muchos detalles” se cumple entre ventas distintas.

## Relaciones

| Relación | Tabla padre | Tabla hija | Cardinalidad | Columnas |
| --- | --- | --- | --- | --- |
| Suministra | proveedores | productos | 1:N | productos.id_proveedor → proveedores.id_proveedor |
| Realiza | clientes | ventas | 1:N | ventas.id_cliente → clientes.id_cliente |
| Contiene | ventas | detalle_venta | 1:N | detalle_venta.id_venta → ventas.id_venta |
| Incluye | productos | detalle_venta | 1:N | detalle_venta.id_producto → productos.id_producto |

No hay relación directa entre clientes y productos. Esa consulta se resuelve recorriendo venta y detalle de venta.

## Dependencias que se conservan al pasar al modelo físico

- Un producto no puede quedar sin proveedor.
- Una venta no puede quedar sin cliente.
- Un detalle no puede quedar sin venta ni sin producto.
- Borrar un proveedor, un cliente, una venta o un producto que ya está referenciado queda restringido. El borrado en cascada no forma parte de este diseño porque las ventas son el historial del negocio.

La implementación de tipos, `CHECK`, índices y transacciones está en [modelo_fisico.md](modelo_fisico.md).
