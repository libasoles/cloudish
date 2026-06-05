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
