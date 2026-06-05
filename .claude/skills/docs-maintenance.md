# Skill: Documentación de Cloudish

## Propósito

Mantener la documentación completa de Cloudish: crear y actualizar tutoriales, generar screenshots coherentes, escribir contenido en español, y asegurar que texto, imágenes y UI siempre estén alineados.

---

## Arquitectura de documentación

### Dónde vive la documentación

```
src/docs/
├── Carousel.tsx                    # Componente de carrusel para secuencias de pasos
├── tutorial-registry.ts            # Registro central de todos los tutoriales
└── tutorials/
    ├── getting-started.tsx         # "Primeros pasos" — agregar y conectar nodos
    ├── hierarchical-containers.tsx # "Contenedores jerárquicos" — Region/VPC/AZ/Subnet
    └── selection.tsx               # "Selección" — multi-select y alineación
```

### Cómo se renderizan

- **Router**: `/docs` redirige a `/docs/:tutorialId` (ej. `/docs/getting-started`)
- **Página**: `src/pages/DocsPage.tsx` carga el tutorial y proporciona layout con ToC
- **Registry**: `src/docs/tutorial-registry.ts` mapea IDs a componentes lazy y metadatos
- **Imágenes**: servidas desde `public/docs/screenshots/` en subcarpetas por sección

---

## Crear un nuevo tutorial

### 1. Crear el archivo TSX

Crea `src/docs/tutorials/nuevo-tutorial.tsx`:

```tsx
import { Carousel } from "../Carousel";

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>;
}

function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export default function NuevoTutorial() {
  return (
    <>
      <h2 id="seccion-1">Título de la sección 1</h2>
      <p>Introducción...</p>

      {/* Para pasos simples, usa Figure */}
      <Figure
        src="/docs/screenshots/seccion/archivo.png"
        alt="Descripción"
        caption="Pie de foto"
      />

      {/* Para pasos secuenciales (antes/después), usa Carousel */}
      <Carousel
        slides={[
          { src: "/docs/screenshots/seccion/paso1.png", alt: "Paso 1" },
          { src: "/docs/screenshots/seccion/paso2.png", alt: "Paso 2" },
        ]}
        caption="Pie de foto"
      />

      <h2 id="seccion-2">Título de la sección 2</h2>
      {/* ... */}
    </>
  );
}
```

### 2. Registrar el tutorial

Edita `src/docs/tutorial-registry.ts` y agrega una entrada en el array `TUTORIALS`:

```typescript
{
  id: 'nuevo-tutorial',
  title: 'Título en la UI',
  description: 'Descripción corta en la UI',
  sections: [
    { id: 'seccion-1', title: 'Título de la sección 1' },
    { id: 'seccion-2', title: 'Título de la sección 2' },
  ],
}
```

También agrega el import lazy en `TUTORIAL_LAZY_MAP`:

```typescript
'nuevo-tutorial': () => import('./tutorials/nuevo-tutorial'),
```

### 3. Capturar las screenshots

Edita `scripts/take-screenshots.ts` y agrega una nueva función que capture tus pasos:

```typescript
// ── nuevo-tutorial: descripción ────────────────────────────────
console.log("N/M Nueva sección...");
await loadApp(page);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// Lógica de interacción (agregar nodos, moverlos, etc.)

await shot(page, "seccion", "paso1.png");
// ... más capturas
```

---

## Actualizar un tutorial existente

### Workflow típico

1. **Edita el contenido** en `src/docs/tutorials/*.tsx`
   - Actualiza el texto
   - Si cambias la sección, actualiza el `id` en el `<h2>` y en `tutorial-registry.ts`

2. **Si cambian las imágenes**: actualiza `scripts/take-screenshots.ts`
   - Modifica la lógica de captura
   - Ejecuta `npm run screenshots`

3. **Verifica en `/docs`**
   - Abre `http://localhost:5173/docs/id-del-tutorial`
   - Verifica que texto e imágenes sean coherentes
   - Prueba los carruseles (autoplay, pausa, click manual)

### Cambios comunes

| Cambio                     | Dónde                                             | Qué hacer                                           |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| Actualizar párrafo         | `tutorials/*.tsx`                                 | Edita el texto, no requiere screenshots nuevas      |
| Cambiar orden de secciones | `tutorials/*.tsx` + `tutorial-registry.ts`        | Reordena `<h2>` y entrada en registry               |
| Renombrar sección          | `tutorials/*.tsx` + `tutorial-registry.ts`        | Actualiza `id`, `title` en ambos                    |
| Agregar paso a un carrusel | `tutorials/*.tsx` + `scripts/take-screenshots.ts` | Agrega slide en Carousel, captura nueva imagen      |
| Cambiar ejemplos AWS       | `scripts/take-screenshots.ts` + tutoriales        | Actualiza índices de servicios, verifica coherencia |

---

## Convenciones de contenido

### 🔴 CRÍTICO: Paths de imágenes en los tutoriales

Las imágenes se referencian **SIEMPRE** desde `/docs/screenshots/` + subcarpeta.

**Estructura de carpetas en disco:**

```
public/docs/screenshots/
├── sidebar/
│   └── ec2-hover.png
├── search/
│   └── rds.png
├── connect-nodes/
│   ├── start.png
│   ├── handle.png
│   └── done.png
├── region-vpc/
│   ├── region.png
│   └── nested.png
├── az-slider/
│   ├── before.png
│   └── after.png
├── subnet-type/
│   ├── public.png
│   └── private.png
├── az-sync/
│   ├── off.png
│   └── on.png
├── shift-click/
│   └── shift-click.png
├── shift-drag/
│   ├── start.png
│   └── box.png
├── add-to-selection/
│   └── add-to-selection.png
└── alignment/
    ├── before.png
    └── after.png
```

**En el código TSX de los tutoriales:**

✅ **CORRECTO**:

```tsx
<Figure src="/docs/screenshots/sidebar/ec2-hover.png" alt="..." />
<Carousel slides={[
  { src: '/docs/screenshots/connect-nodes/start.png', alt: '...' },
  { src: '/docs/screenshots/connect-nodes/handle.png', alt: '...' },
]} />
```

❌ **INCORRECTO** (ejemplos comunes de errores):

```tsx
// NO usar el path relativo del filesystem
src = "public/docs/screenshots/sidebar/ec2-hover.png";

// NO omitir la subcarpeta
src = "/docs/screenshots/ec2-hover.png";

// NO usar nombres de archivos viejos (ej. 01-sidebar-drag.png)
src = "/docs/screenshots/01-sidebar-drag.png";

// NO mezclar números con carpetas
src = "/docs/screenshots/01-connect-nodes/start.png";
```

---

### Español

- **Tone**: instructivo, accesible, sin jargón innecesario
- **Tiempos verbales**: imperativos ("Haz clic", "Arrastra") para instrucciones
- **Términos AWS**: se usan en inglés (EC2, VPC, RDS, Lambda) pero contexto en español
- **Términos de UI**: traducidos (panel lateral, inspector, lienzo, selector, checkbox)

### Atajos de teclado

Cuando un atajo usa la tecla primaria (Cmd en Mac, Ctrl en Windows/Linux), **no duplicar líneas**. Usar una sola línea con ambas opciones:

❌ **Evitar**:

```
1. Pulsa ⌘K (Mac) para abrir el buscador.
2. O pulsa Ctrl K (Windows/Linux) para abrir el buscador.
```

✅ **Hacer**:

```
1. Pulsa ⌘K / Ctrl+K para abrir el buscador.
```

O usar tabla si hay múltiples atajos:

| Acción         | Atajo       |
| -------------- | ----------- |
| Abrir buscador | ⌘K / Ctrl+K |
| Agregar nodo   | ⌘+ / Ctrl++ |

### Estructura de tutorial

Cada tutorial tiene **2-3 secciones principales** (`<h2>`), cada una con:

```
<h2 id="seccion-id">Título de la sección</h2>
<p>Párrafo introductorio — qué es, por qué importa</p>

<h3>Subtítulo (opcional)</h3>
<ol>
  <li>Paso 1</li>
  <li>Paso 2</li>
  <li>Paso 3</li>
</ol>

<Carousel|Figure> ... </Carousel|Figure>

<Tip>Consejo o nota importante</Tip>
```

### Cuándo usar `<Carousel>` vs `<Figure>`

| Caso                                            | Uso          |
| ----------------------------------------------- | ------------ |
| Imagen estática (UI completa, resultado final)  | `<Figure>`   |
| Progresión de pasos (antes → durante → después) | `<Carousel>` |
| Una interacción con múltiples estados           | `<Carousel>` |
| Referencia sin movimiento                       | `<Figure>`   |

**Ejemplo de `<Carousel>`**: "Conectar nodos" necesita 3 imágenes (nodos separados → handle visible → edge creado) porque el usuario necesita ver la progresión visual.

**Ejemplo de `<Figure>`**: "Search" es una única captura del buscador abierto — no hay cambio progresivo.

### Dropdowns y selectores en carruseles

**CRÍTICO**: cuando un tutorial documente el uso de un dropdown/selector, el carrusel **DEBE** incluir:

1. **Estado inicial**: el selector cerrado (para contexto visual)
2. **Dropdown abierto**: con todas las opciones visibles y la opción objetivo **destacada/highlighted**
3. **Estado final**: resultado después de la selección

**Por qué**: el usuario necesita ver exactamente dónde está cada opción en el dropdown. Sin esto, el tutorial pierde claridad.

**Ejemplo:**

```tsx
<Carousel
  slides={[
    {
      src: "/docs/screenshots/subnet-type/subnet-selected.png",
      alt: "Subnet seleccionada con selector Tipo cerrado",
    },
    {
      src: "/docs/screenshots/subnet-type/dropdown-open.png",
      alt: "Selector Tipo abierto — opciones Pública y Privada visibles",
    },
    {
      src: "/docs/screenshots/subnet-type/public-selected.png",
      alt: "Subnet con tipo Pública seleccionado",
    },
  ]}
  caption="Abre el selector Tipo, elige Pública o Privada"
/>
```

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Interactúa con el dropdown (click para abrir)
- Espera a que se rendericen las opciones
- Captura con las opciones visibles
- Opcionalmente: hover/select en la opción objetivo para que esté destacada

### Nodos dentro de contenedores

**CRÍTICO**: cuando un tutorial documente agregar nodos dentro de contenedores (VPC, AZ, Subnet), **los nodos DEBEN estar visualmente dentro del contenedor** en la captura.

**Por qué**: la jerarquía visual (nodo dentro del contenedor) es el punto central del tutorial — si el nodo aparece fuera del contenedor, el usuario no entiende qué se está enseñando.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Después de agregar un nodo, **arrastrarlo explícitamente dentro del contenedor destino** usando `page.mouse.move()` y `page.mouse.down/up()`
- Esperar a que el nodo se registre dentro del contenedor (pueden haber animaciones de sincronización)
- Capturar la imagen **solo cuando el nodo esté claramente dentro del contenedor** (borders del contenedor envuelven al nodo)

**Ejemplo:** Para la sección "Sincronización de AZs", agregar EC2 → arrastrarlo dentro de AZ 1 → capturar → esto muestra la estructura jerárquica correctamente.

### Selecciones: antes y después

**CRÍTICO**: cuando un tutorial documente seleccionar nodos (multi-select, shift+click, shift+drag, etc.), el carrusel **DEBE mostrar progresión visual**:

1. **Antes**: nodos sin seleccionar (estado inicial)
2. **Después**: nodos seleccionados (con highlight visual)

**Por qué**: sin el antes/después, no se ve qué cambió ni se entiende el resultado.

**Cantidad de nodos**: si el tutorial dice "selecciona múltiples nodos", **DEBE haber 3+ nodos visibles y todos seleccionados** en el estado final. No mostrar "1 nodo seleccionado" cuando se habla de "múltiples".

**🔴 SEPARACIÓN ESPACIAL DE NODOS (OBLIGATORIO)**: Los nodos agregados **DEBEN estar bien separados y visibles en el canvas** — no pueden solaparse ni estar uno encima del otro. Son diagramas de arquitectura, no listas. Después de agregar cada nodo con `addNodeBySidebarClick()`, **arrastrar explícitamente el nodo a una posición distinta** usando `page.mouse.move()` + `page.mouse.down/up()`. Distribuir horizontalmente (columnas): primera fila izquierda, primera fila centro, primera fila derecha. La separación debe ser claramente visible en las capturas finales.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Agregar 3+ nodos (no 2, que parecería solo "un par")
- **Después de cada `addNodeBySidebarClick()`, arrastrar el nodo a una posición distinta** para evitar solapamiento
- Capturar el estado inicial con el nodo objetivo **deseleccionado**. Si el tutorial muestra una selección desde cero, todos los nodos deben estar sin seleccionar. Si muestra "agregar a la selección", los nodos existentes pueden estar seleccionados, pero el nodo que se va a agregar debe estar claramente deseleccionado.
- Ejecutar la acción de selección (shift+click, shift+drag, etc.)
- Capturar el estado final con el mismo nodo objetivo **seleccionado** (con highlight visual), manteniendo separación clara.
- Antes de la primera captura, limpiar cualquier selección heredada de pasos anteriores con `Escape` o click en una zona vacía del canvas. No reutilizar un estado donde el nodo objetivo ya aparece seleccionado y luego se lo vuelve a seleccionar.

**Ejemplo:** Para "Shift+clic", agregar 3 nodos → arrastrar el primero a (x1, y), el segundo a (x2, y), el tercero a (x3, y) con x1 < x2 < x3 → capturar sin seleccionar → shift+click en 2 → capturar con esos 2 resaltados.

### Toolbars y controles flotantes

**CRÍTICO**: si el texto del tutorial menciona una toolbar, popover, menú, dropdown, selector o control flotante, la captura **DEBE mostrar ese elemento visible**.

**Por qué**: si el texto dice que aparece una herramienta y la imagen no la muestra, la documentación pierde coherencia. No capturar estados donde el control todavía no renderizó, quedó fuera del viewport, o desapareció por pérdida de selección/foco.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Esperar explícitamente el selector del control antes de capturar, por ejemplo `await page.locator('[data-testid="align-horizontal"]').waitFor({ state: 'visible' })`.
- Si el control no aparece, fallar el script en vez de guardar una imagen incorrecta.
- Mantener los nodos separados y dentro del viewport para que la toolbar tenga espacio visible.

### Indicadores visuales de clicks en capturas

**IMPORTANTE**: cuando el tutorial documente una acción de click, la captura **DEBE incluir un indicador visual del click** (círculo, punto, o marca) en la ubicación donde ocurrió.

**Por qué**: el usuario necesita ver exactamente dónde hizo click. Sin esto, es confuso qué elemento recibió el click.

**CRÍTICO**: cuando una captura representa el estado previo a un cambio, debe mostrar la acción que dispara ese cambio. Esto aplica especialmente a bounding boxes/cajas de selección, opciones de dropdown/selectores y cualquier flujo antes → después. La imagen previa debe incluir el indicador de click en la esquina donde comienza el drag, sobre la opción que se va a elegir, o sobre el control que inicia la transición.

**CRÍTICO**: cuando se documente una acción de drag (por ejemplo dibujar una caja de selección), las capturas deben distinguir claramente el inicio y el destino del gesto. La captura inicial muestra el click/mouse en el punto donde empieza el drag. La captura durante o al final del drag muestra el mouse en el destino actual/final del arrastre (por ejemplo la esquina inferior derecha del bounding box), no en la esquina inicial. Si se usan indicadores visuales, mover o recrear el indicador para que la imagen represente la posición real del mouse en ese momento.

**CRÍTICO**: en carruseles de estado previo/posterior, el estado previo es donde se muestra el evento click y el estado posterior es donde se muestra el efecto desencadenado. Mantener igual todo lo demás entre ambas capturas: selección activa, inspector abierto, viewport, nodos visibles y contexto de UI. Si el efecto depende de un nodo seleccionado, seleccionarlo antes de la captura previa para evitar saltos bruscos del inspector entre slides.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Registrar la posición del click (coordenadas X, Y)
- Para drag/caja de selección, registrar dos puntos: inicio `(startX, startY)` y destino `(endX, endY)`. Capturar el estado inicial con el indicador en `start`, y el estado intermedio/final con el cursor o indicador en `end`.
- Cuando el click sea sobre un nodo, **no hacer click en el centro del nodo**. Usar un punto en el área inferior derecha del nodo, pero con margen suficiente para no quedar pegado al borde ni sobre handles, bordes o controles internos. Como guía: `x = nodeBox.x + nodeBox.width * 0.72`, `y = nodeBox.y + nodeBox.height * 0.72`.
- Inyectar un elemento visual (SVG circle, div con border-radius, etc.) en esa posición usando `page.evaluate()` o `page.addScriptTag()`
- Esperar a que se renderice
- Capturar con el indicador visible
- **Limpiar el indicador después de la captura** (eliminarlo del DOM)

**Ejemplo de inyección en Playwright:**

```javascript
// Después de hacer click en (x, y):
await page.evaluate((x, y) => {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.width = '40px';
  div.style.height = '40px';
  div.style.border = '3px solid #ff6b6b';
  div.style.background = 'rgba(255, 107, 107, 0.22)';
  div.style.borderRadius = '50%';
  div.style.boxShadow = '0 0 0 8px rgba(255, 107, 107, 0.14)';
  div.style.left = (x - 20) + 'px';
  div.style.top = (y - 20) + 'px';
  div.style.zIndex = '9999';
  div.style.pointerEvents = 'none';
  div.id = 'click-indicator';
  document.body.appendChild(div);
}, x, y);
await page.waitForTimeout(300);
await shot(page, 'seccion', 'archivo.png');
// Limpiar
await page.evaluate(() => {
  document.getElementById('click-indicator')?.remove();
});
```

### Validar que todas las imágenes referenciadas existan

**IMPORTANTE**: después de regenerar screenshots, **verificar que todas las imágenes referenciadas en los tutoriales sean visibles** en el navegador. Las imágenes rotas (404) o mal linkeadas generan frustraciones.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

- Agregar una función de validación final: `validateScreenshots()`
- La función abre cada tutorial en el navegador
- Espera a que carguen todas las imágenes
- Verifica que cada `<img>` en los Carousels tenga `naturalWidth > 0` (está cargada)
- Reporta cualquier imagen faltante o rota
- Si hay fallos, aborta y avisa qué imágenes están rotas

**Ejemplo:**

```javascript
async function validateScreenshots(page: Page) {
  const missingImages = await page.evaluate(() => {
    const images = document.querySelectorAll('img[loading="lazy"]')
    return Array.from(images)
      .filter(img => img.naturalWidth === 0)
      .map(img => ({ src: img.src, alt: img.alt }))
  })
  if (missingImages.length > 0) {
    console.error('❌ Broken images found:')
    missingImages.forEach(img => console.error(`  - ${img.src} (${img.alt})`))
    throw new Error('Some images are missing or broken')
  }
  console.log('✅ All images validated successfully')
}
```

---

## Generar y mantener screenshots

### Precondiciones

1. **Dev server corriendo**: `npm run dev`
2. **Locale español**: el script usa `locale: 'es-ES'` automáticamente
3. **Viewport fullscreen**: `1920x1080`

### Capturar

```bash
npm run screenshots
```

Guarda todas las imágenes en `public/docs/screenshots/` organizadas en subcarpetas:

```
public/docs/screenshots/
├── sidebar/
├── search/
├── connect-nodes/
├── region-vpc/
├── az-slider/
├── subnet-type/
├── az-sync/
├── shift-click/
├── shift-drag/
├── add-to-selection/
└── alignment/
```

### Verificar coherencia

Después de capturar, abre `/docs` y verifica **para cada sección**:

- ✅ La imagen muestra exactamente lo que dice el texto
- ✅ Si es un carrusel, cada diapositiva es un paso lógico
- ✅ Los servicios AWS son típicos (EC2+RDS, Lambda+API Gateway, etc.)
- ✅ La interfaz está en español
- ✅ El viewport es fullscreen (sin barras de scroll innecesarias)
- ✅ El mouse no deja hovers residuales, tooltips abiertos, highlights o estados visuales que no correspondan a la acción documentada

### Posición del mouse en capturas

**IMPORTANTE**: antes de tomar cada screenshot, mover el mouse a una posición neutra o a una posición relevante para la acción que se está documentando.

**Por qué**: Playwright puede dejar el puntero sobre un elemento anterior aunque el foco esté en otra parte de la UI. Eso puede producir estados inconsistentes en la captura, por ejemplo un tooltip del sidebar abierto mientras el buscador está enfocado.

**Regla práctica**:

- Si la captura no documenta hover, mover el mouse a una zona neutra del lienzo antes de capturar.
- Si la captura documenta hover, colocar el mouse exactamente sobre el elemento relevante y asegurarse de que no haya otros tooltips o highlights abiertos.
- Si la captura documenta foco o escritura en un input, evitar que el puntero quede sobre botones del sidebar, toolbar o inspector.

**En el script de screenshots** (`scripts/take-screenshots.ts`):

```javascript
// Zona neutra del canvas antes de una captura que no depende de hover.
await page.mouse.move(960, 540);
await page.waitForTimeout(150);
await shot(page, "search", "rds.png");
```

### Ejemplos AWS realistas

Usar topologías típicas, no servicios aleatorios:

| Patrón        | Servicios            | Uso                              |
| ------------- | -------------------- | -------------------------------- |
| Base de datos | EC2 + RDS            | Aplicación web + BBDD relacional |
| Serverless    | Lambda + API Gateway | API sin servidor                 |
| Multi-AZ      | VPC + AZ + EC2 + RDS | Alta disponibilidad              |
| Búsqueda      | EC2 + DynamoDB       | Caché + datos rápidos            |
| CDN           | S3 + CloudFront      | Contenido estático distribuido   |

---

## Componente Carousel

### Props

```typescript
type CarouselProps = {
  slides: Array<{ src: string; alt: string }>; // URLs a las imágenes
  caption?: string; // Pie de foto opcional
  interval?: number; // ms entre diapositivas (default 2000)
};
```

### Comportamiento

- **Autoplay**: cada diapositiva se muestra por `interval` ms
- **Pausa**: se pausa al hacer hover
- **Indicadores**: puntos abajo muestran progreso y permiten saltar
- **Transición**: fade suave (400ms) entre diapositivas
- **Accesibilidad**: aria-labels en los botones de los indicadores

### Uso

```tsx
<Carousel
  slides={[
    {
      src: "/docs/screenshots/seccion/paso1.png",
      alt: "Paso 1: nodos separados",
    },
    { src: "/docs/screenshots/seccion/paso2.png", alt: "Paso 2: conectando" },
    { src: "/docs/screenshots/seccion/paso3.png", alt: "Paso 3: conectado" },
  ]}
  caption="Arrastra para crear una conexión entre dos nodos"
/>
```

---

## Mantener coherencia

### Checklist antes de hacer commit

- [ ] Todas las secciones tienen títulos (`<h2 id="...">`)?
- [ ] Todos los `id` de secciones coinciden en `tutorial-registry.ts`?
- [ ] Las imágenes existen en `public/docs/screenshots/`?
- [ ] Los paths a imágenes son correctos (relativo a `/docs/screenshots/`)?
- [ ] Cada imagen refleja exactamente lo que dice el texto?
- [ ] Los carruseles tienen al menos 2 diapositivas?
- [ ] El contenido está en español?
- [ ] Correr `npm run lint` sin errores de TypeScript?

### Verificación visual

Abre `/docs/id-del-tutorial` en el browser y:

1. ✅ Lee el texto sin ver imágenes
2. ✅ Luego mira las imágenes
3. ✅ Verifica que coincidan perfectamente
4. ✅ Prueba los carruseles: hover, click, autoplay
5. ✅ Revisa la ToC: ¿aparecen todas las secciones?
6. ✅ Revisa links en la sidebar: ¿navega correctamente?

---

## Troubleshooting

| Problema                                   | Solución                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Screenshots vacías o grises                | Dev server no responde; `npm run dev` en otra terminal                           |
| Selector no encontrado en script           | Aumenta `waitForTimeout` o usa `waitForSelector()` antes de interactuar          |
| Imágenes muestran servicios equivocados    | Verifica índices en `addNodeBySidebarClick(page, index)` en el script            |
| Carrusel no muestra todas las diapositivas | Verifica que los paths `/docs/screenshots/seccion/archivo.png` sean correctos    |
| Texto fuera de alineación en las imágenes  | Captura de nuevo con viewport `1920x1080`, no otra resolución                    |
| Tutorial no aparece en la UI               | Verifica que esté en `TUTORIAL_LAZY_MAP` y `TUTORIALS` en `tutorial-registry.ts` |

---

## Recursos

- **Componente Carousel**: `src/docs/Carousel.tsx`
- **Tutorial registry**: `src/docs/tutorial-registry.ts`
- **Página de docs**: `src/pages/DocsPage.tsx`
- **Script de screenshots**: `scripts/take-screenshots.ts`
- **Estilos de docs**: `src/index.css` (clase `.docs-content` y `.tip`)

---

## Workflow completo: crear un tutorial nuevo

### 1. Planificar

- Qué conceptos cubre? (2-3 secciones)
- Qué imágenes necesita? (pasos progresivos)
- Qué servicios AWS ilustran bien?

### 2. Escribir contenido

```tsx
// src/docs/tutorials/mi-tutorial.tsx
export default function MiTutorial() {
  return (
    <>
      <h2 id="seccion-1">...</h2>
      {/* ... */}
    </>
  );
}
```

### 3. Registrar

```typescript
// src/docs/tutorial-registry.ts
{
  id: 'mi-tutorial',
  title: '...',
  sections: [{ id: 'seccion-1', title: '...' }],
}
```

### 4. Capturar screenshots

```typescript
// scripts/take-screenshots.ts
console.log("N/M Mi tutorial...");
// ... lógica
await shot(page, "mi-seccion", "archivo.png");
```

### 5. Correr screenshot

```bash
npm run screenshots
```

### 6. Verificar en `/docs`

Abre `http://localhost:5173/docs/mi-tutorial` — ¿texto e imágenes coinciden?

### 7. Lint y commit

```bash
npm run lint
git add src/docs/ scripts/ public/docs/screenshots/
git commit -m "Add tutorial: Mi tutorial"
```

Done! El tutorial está listo en `/docs/mi-tutorial`.
