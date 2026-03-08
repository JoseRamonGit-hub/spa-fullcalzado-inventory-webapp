# **Cotización de Desarrollo de Software a Medida**

**Fecha:** 02/03/2026  
**Nombre del cliente:** José Ramón Sánchez Hernandez  
**Propuesta realizada por:** Anderson R. Román  
**Email proveedor:** [contacto@cuantiva.net](mailto:contacto@cuantiva.net)  
**Celular proveedor:** [\+58 424-8037880](https://wa.me/584248037880)

## **Nombre del Proyecto**

**Plataforma de Gestión de Inventario y Control de Caja (Calzados)**

## **Resumen Ejecutivo**

Desarrollo de una aplicación web responsive (_móvil, tablet y pc_) orientada a la gestión eficiente de un inventario de calzados. El sistema permitirá controlar de forma exacta las entradas y salidas de mercancía, automatizar el cálculo de precios en base a tasas de cambio (BCV / Manual) y facilitar el cierre de caja diario, garantizando la integridad de los datos mediante un sistema de roles y respaldos automáticos.

## **Funcionalidades Incluidas**

### **1\. Módulo de Autenticación y Gestión de Roles**

Sistema de seguridad para el acceso a la plataforma. Se definirán dos roles principales para proteger la información financiera:

- **Administrador (Dueño):** Control total del sistema. Capacidad para modificar inventario, gestionar usuarios, actualizar la tasa de cambio, ver el historial completo y totalizar cierres de caja.
- **Empleado / Vendedor:** Acceso limitado. Solo podrá visualizar el stock disponible, registrar salidas (ventas), entradas y consultar el precio final calculado según la tasa del día.

### **2\. Módulo de Gestión de Inventario (Entradas)**

Administración integral del catálogo de zapatos. El administrador podrá:

- Registrar nuevos modelos indicando: SKU/Código, Descripción, Talla (opcional), Cantidad en stock y Precio base (reflejado en dólares).
- Actualizar, editar o dar de baja mercancía.
- Visualización rápida del stock en tiempo real mediante tablas interactivas.

### **3\. Módulo de Control de Divisas (Tasa de Cambio)**

Gestión centralizada de la tasa de cambio para cálculos de venta.

- Capacidad de fijar una tasa de cambio manual.
- El sistema multiplicará automáticamente el "Precio base (USD)" del inventario por la "Tasa Activa" para reflejar el monto a cobrar en moneda local al momento de la venta.

### **4\. Módulo de Transacciones (Salidas)**

Interfaz ágil para registrar las ventas diarias.

- Selección del zapato vendido y deducción automática del stock en el inventario.
- Registro de la transacción (fecha, hora, empleado que realizó la venta, monto en USD y monto en moneda local según la tasa).

### **5\. Módulo de Historial y Cierre de Caja**

Control estricto de la auditoría del negocio.

- **Historial de Movimientos:** Registro inmutable de cada entrada y salida de mercancía.
- **Totalización de Ventas:** Botón de "Cierre de Día" que suma automáticamente todas las transacciones realizadas en la jornada para facilitar el cuadre de caja.

## **Despliegue y Arquitectura**

La aplicación será desplegada en la infraestructura de la nube, garantizando alta disponibilidad y que pueda ser accedida desde cualquier dispositivo (PC, Tablet o Teléfono móvil). El nombre de dominio (URL) será genérico de forma provisional, con posibilidad de vincular un dominio propio posteriormente.

## **Inversión del Proyecto**

| Descripción del Servicio                           | Tipo de Entrega  | Costo (EUR)  |
| :------------------------------------------------- | :--------------- | :----------- |
| **Plataforma de Gestión de Inventario (Calzados)** | Desarrollo común | € 400.00     |
| **TOTAL**                                          |                  | **€ 400.00** |

## **Tecnologías Utilizadas**

- **Frontend:** React, TypeScript, TailwindCSS.  
  **Backend & Base de Datos:** Supabase (PostgreSQL).
- **Hosting:** Vercel.

## **Entregables y Tiempos de Ejecución**

- **Fase 1 (MVP \- Producto Mínimo Viable):** Entrega en **5 días hábiles más tardar** tras el pago inicial. El cliente recibirá acceso al sistema básico para comenzar a poblar su base de datos (registro de zapatos y tasa de cambio).
- **Fase 2 (Entrega Final):** Entrega del sistema completo (Módulo de ventas, roles e historial) en un plazo total de **14 días hábiles** tras el pago inicial.

## **Términos y Condiciones**

**1\. Forma de Pago:**

Dada la naturaleza de entrega "Express" del proyecto, los pagos se estructuran de la siguiente manera:

- **50%** al inicio del proyecto y firma del acuerdo (€ 200.00).
- **50%** al finalizar, aprobar y entregar la totalidad del proyecto (€ 200.00).

**2\. Validez de la Cotización:**

Esta cotización es válida por **15 días** a partir de la fecha de emisión (ajustado por tratarse de un requerimiento de urgencia).

**3\. Soporte Posterior y Garantía:**

Incluye soporte técnico, resolución de bugs y estabilización del sistema por **28 días continuos** luego de la entrega final.

**4\. Limitaciones del Alcance:**

Cualquier módulo, vista o integración de hardware (ej. impresoras fiscales, lectores de códigos de barras) no especificado en este documento requerirá una cotización adicional.
