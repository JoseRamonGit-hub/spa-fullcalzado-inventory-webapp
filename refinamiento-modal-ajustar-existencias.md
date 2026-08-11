# Refinamiento UI/UX — Modal “Ajustar existencias”

## Objetivo

Refinar el modal de **Ajustar existencias** para que sea visualmente consistente con el resto de la aplicación y tenga una jerarquía más clara.

La estructura funcional actual es correcta, por lo que no se requiere rehacer el flujo. El trabajo debe centrarse en:

- mejorar la jerarquía visual;
- reducir ruido;
- dar mayor protagonismo al ajuste numérico;
- compactar información secundaria;
- mejorar la presentación del producto;
- mantener una densidad adecuada para una aplicación administrativa.

> **Stack visual:** usar exclusivamente los componentes y tokens existentes de la app, con **Tailwind CSS** y shadcn/ui.  
> No introducir CSS manual, estilos inline ni colores hex arbitrarios salvo que ya formen parte del sistema.

---

## 1. Encabezado del modal

### Título

Cambiar:

`AJUSTAR EXISTENCIAS`

por:

`Ajustar existencias`

Usar una jerarquía similar a:

```tsx
<DialogTitle className="text-base font-semibold">
  Ajustar existencias
</DialogTitle>
```

Evitar uppercase completo.

### Contexto del negocio

Mantener el contexto del negocio, pero reducir su protagonismo.

Ejemplo:

```tsx
<DialogDescription className="text-sm text-muted-foreground">
  Zapatería Estilos C.A.
</DialogDescription>
```

Si se necesita explicitar:

`Negocio actual: Zapatería Estilos C.A.`

### Indicador verde

Eliminar el punto verde salvo que represente un estado funcional real.

No utilizarlo únicamente como decoración.

---

## 2. Resumen del producto

Refinar la fila donde actualmente aparecen:

- `SN66`
- nombre del producto
- badge `Activo`

### Jerarquía

El **nombre del producto debe ser el elemento principal**.

El código debe pasar a metadata secundaria.

Estructura sugerida:

```tsx
<div className="flex items-start justify-between gap-4">
  <div className="min-w-0">
    <p className="truncate text-sm font-medium">
      SANDALIA BAJITA DAMA BRILLANTE HERLINDA
    </p>

    <p className="mt-1 text-xs font-medium text-primary">
      SN66
    </p>
  </div>

  <Badge variant="success">
    Activo
  </Badge>
</div>
```

### Truncamiento

Para el nombre:

```tsx
className="min-w-0 truncate"
```

Si el nombre está truncado, conservar el tooltip existente con el nombre completo.

No agregar una segunda descripción visible si el tooltip ya cubre esa información.

---

## 3. Bloque principal del ajuste

Esta debe ser la sección con mayor protagonismo del modal.

Debe contener:

- Actual
- Nuevo total
- Diferencia

No crear cards independientes.

Usar una sola composición horizontal.

Ejemplo:

```tsx
<div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] items-end gap-4">
  ...
</div>
```

---

## 4. Stock actual

Mostrar:

```text
Actual
154
```

Implementación aproximada:

```tsx
<div>
  <p className="text-xs font-medium text-muted-foreground">
    Actual
  </p>
  <p className="mt-1 text-lg font-semibold tabular-nums">
    154
  </p>
</div>
```

No usar un input disabled para representar el stock actual.

---

## 5. Nuevo total

Este es el campo principal del modal.

```tsx
<div>
  <Label htmlFor="new-total" className="text-xs font-medium text-muted-foreground">
    Nuevo total
  </Label>

  <Input
    id="new-total"
    type="number"
    min={0}
    className="mt-1.5 font-medium tabular-nums"
  />
</div>
```

Requisitos:

- usar el componente `Input` existente;
- aceptar únicamente valores válidos para inventario;
- no permitir negativos;
- usar enteros si el stock no admite fracciones;
- evitar `NaN`;
- aplicar autofocus si no interfiere con el comportamiento actual del `Dialog`.

---

## 6. Diferencia

Calcular en tiempo real:

```ts
const difference = newTotal - currentStock
```

### Sin cambios

Si:

```ts
difference === 0
```

mostrar:

`Sin cambios`

Usar una variante neutral/subtle.

### Incremento

Ejemplo:

`+6`

Debe usar la semántica positiva ya existente en la aplicación.

### Disminución

Ejemplo:

`−4`

Debe usar la misma semántica que las reducciones/salidas de stock del sistema.

### Ejemplo

```tsx
<div>
  <p className="text-xs font-medium text-muted-foreground">
    Diferencia
  </p>

  <div className="mt-1.5">
    <Badge variant={differenceVariant}>
      {difference === 0
        ? "Sin cambios"
        : difference > 0
          ? `+${difference}`
          : difference}
    </Badge>
  </div>
</div>
```

No crear colores nuevos para este modal.

---

## 7. Jerarquía de la sección numérica

La lectura debe ser:

**Actual → Nuevo total → Diferencia**

`Nuevo total` debe ocupar algo más de ancho porque es la interacción principal.

Referencia:

```tsx
className="grid grid-cols-[0.8fr_1.4fr_0.8fr] items-end gap-4"
```

En pantallas donde el modal necesite adaptarse:

```tsx
className="grid gap-4 sm:grid-cols-[0.8fr_1.4fr_0.8fr]"
```

No convertir los tres valores en tarjetas independientes.

---

## 8. Separadores

Reducir los separadores horizontales.

Mantener divisiones solamente entre grandes regiones:

1. header;
2. contenido;
3. footer.

Entre producto, ajuste y motivo, preferir:

- `space-y-*`
- `gap-*`
- padding

en lugar de múltiples `Separator`.

Ejemplo general del body:

```tsx
<div className="space-y-6">
  <ProductSummary />
  <StockAdjustment />
  <ReasonField />
</div>
```

---

## 9. Motivo

Mantener:

`Motivo (opcional)`

Ejemplo:

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-1.5">
    <Label htmlFor="reason">
      Motivo
    </Label>

    <span className="text-xs text-muted-foreground">
      Opcional
    </span>

    <Tooltip>
      ...
    </Tooltip>
  </div>

  <Textarea
    id="reason"
    placeholder="Ej.: Corrección por conteo físico"
    className="min-h-20 resize-none"
  />
</div>
```

El textarea debe ser compacto.

Evitar que esta sección tenga más peso visual que el cambio de stock.

---

## 10. Description / tooltip del motivo

La descripción ya cuenta con tooltip.

Por tanto, eliminar el helper text visible:

`Si lo dejas vacío, el historial mostrará «Sin motivo indicado».`

Esa información debe vivir únicamente en el tooltip.

Contenido sugerido:

`Si no indicas un motivo, el historial mostrará “Sin motivo indicado”.`

No duplicar la explicación debajo del textarea.

---

## 11. Footer

Mantener el footer fijo si ese es el patrón general de los modales de la aplicación.

Acciones:

- `Cancelar`
- `Revisar ajuste`

Ejemplo:

```tsx
<DialogFooter className="border-t px-6 py-4">
  <Button variant="outline">
    Cancelar
  </Button>

  <Button disabled={!hasChanges}>
    Revisar ajuste
  </Button>
</DialogFooter>
```

El CTA principal debe utilizar el `primary` naranja global.

No crear una variante negra específica.

---

## 12. Estado sin cambios

Si:

```ts
newTotal === currentStock
```

entonces:

- mostrar `Sin cambios` en la columna Diferencia;
- deshabilitar `Revisar ajuste`;
- no mostrar errores ni alerts.

No se trata de una validación fallida, simplemente no existe una operación que realizar.

---

## 13. Validaciones

El campo `Nuevo total` debe:

- rechazar negativos;
- evitar valores vacíos al confirmar;
- aceptar solamente enteros si el sistema no admite fracciones;
- evitar `NaN`;
- conservar las reglas de inventario ya existentes.

No introducir nuevas reglas de negocio.

---

## 14. Paso de revisión

Si `Revisar ajuste` abre un segundo paso de confirmación, conservar el flujo.

El resumen debe mostrar claramente:

```text
Stock actual      154
Nuevo stock       160
Diferencia        +6
```

Si existe motivo:

```text
Motivo
Corrección por conteo físico
```

No agregar pasos adicionales.

---

## 15. Densidad y spacing

El modal actual tiene demasiado espacio vertical debido a:

- separadores;
- helper text;
- textarea sobredimensionado;
- padding poco coherente.

Mantener una composición compacta.

Referencia con Tailwind:

```tsx
<DialogContent className="p-0 sm:max-w-lg">
  <DialogHeader className="px-6 pt-5 pb-4" />

  <div className="space-y-6 px-6 py-5">
    ...
  </div>

  <DialogFooter className="border-t px-6 py-4" />
</DialogContent>
```

Usar los tokens y escalas de Tailwind ya adoptados en la aplicación.

No crear márgenes arbitrarios si `gap`, `space-y` o padding del sistema resuelven el caso.

---

## 16. Orden visual esperado

```text
┌─────────────────────────────────────────────────┐
│ Ajustar existencias                          ×   │
│ Zapatería Estilos C.A.                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ SANDALIA BAJITA DAMA BRILLANTE HERLINDA  Activo │
│ SN66                                            │
│                                                 │
│ ACTUAL        NUEVO TOTAL          DIFERENCIA   │
│ 154           [ 160           ]    +6           │
│                                                 │
│ Motivo  Opcional  ⓘ                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ Ej.: Corrección por conteo físico          │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                          Cancelar  Revisar ajuste│
└─────────────────────────────────────────────────┘
```

Esta representación es conceptual; no copiar dimensiones de forma literal.

---

## 17. Componentes

Reutilizar componentes existentes, especialmente shadcn/ui:

- `Dialog`
- `DialogHeader`
- `DialogTitle`
- `DialogDescription`
- `DialogFooter`
- `Input`
- `Textarea`
- `Label`
- `Badge`
- `Button`
- `Tooltip`

No crear componentes visuales paralelos si los actuales ya cubren el caso.

---

## 18. Consistencia visual

Utilizar exclusivamente tokens existentes:

- `bg-background`
- `text-foreground`
- `text-muted-foreground`
- `border-border`
- `text-primary`
- variantes semánticas existentes de `Badge`
- `destructive` cuando corresponda

Mantener:

- naranja = acción primaria;
- rojo = reducción/destructivo cuando aplique;
- verde = activo/positivo cuando aplique;
- neutros = metadata y estado sin cambios.

No introducir colores hex específicos en el componente.

---

## 19. No implementar

No agregar:

- cards individuales para `Actual`, `Nuevo total` y `Diferencia`;
- gradientes;
- ilustraciones;
- iconos decorativos;
- alerts permanentes;
- explicaciones extensas;
- animaciones innecesarias;
- colores nuevos;
- helper text redundante debajo del textarea;
- CSS manual si Tailwind resuelve el caso;
- estilos inline;
- pasos adicionales en el flujo.

---

## Resultado esperado

El modal debe sentirse:

- compacto;
- sobrio;
- moderno;
- operacional;
- coherente con la vista de detalle del producto;
- centrado en el cambio de existencias.

La lectura visual debe ser:

**Producto → stock actual → nuevo stock → diferencia → motivo → confirmar.**

El usuario debe poder identificar inmediatamente:

1. qué producto está modificando;
2. cuánto stock existe actualmente;
3. a cuánto se llevará;
4. cuál será la diferencia;
5. por qué se realiza el ajuste, si corresponde.
