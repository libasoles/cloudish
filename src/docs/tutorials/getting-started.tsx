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

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>;
}

export default function GettingStarted() {
  return (
    <>
      {/* ── 1. Agregar nodos ─────────────────────────────── */}
      <h2 id="agregar-nodos">Agregar nodos</h2>
      <p>
        Hay tres formas de agregar nodos al lienzo: arrastrando desde el panel
        lateral, haciendo clic en un icono del panel, o usando el buscador.
      </p>

      <h3>Drag & drop desde el panel lateral</h3>
      <p>
        El panel izquierdo muestra herramientas de uso frecuente. Para agregar
        una, arrastra cualquiera y suéltala en el área del lienzo.
      </p>
      <Figure
        src="/docs/screenshots/01-sidebar-drag.png"
        alt="Arrastrando un nodo desde el sidebar hacia el lienzo"
        caption="Arrastra cualquier herramienta desde el panel lateral al lienzo"
      />

      <h3>Click para agregar al centro</h3>
      <p>
        Si solo quieres agregar un nodo rápidamente sin preocuparte por la
        posición, haz clic directamente en el icono del panel lateral — el nodo
        aparecerá en el centro del lienzo actual.
      </p>
      <Figure
        src="/docs/screenshots/02-sidebar-click.png"
        alt="Haciendo click en un icono del sidebar"
        caption="Un clic agrega el nodo al centro del lienzo"
      />

      <h3>Buscador de servicios</h3>
      <p>
        El catálogo incluye más de 100 servicios de AWS. Para encontrar uno
        rápido, usa el buscador.
      </p>
      <ol>
        <li>
          Pulsa <kbd>⌘K</kbd> (Mac) o <kbd>Ctrl K</kbd> (Windows/Linux) para
          abrir el buscador.
        </li>
        <li>
          Escribe el nombre del servicio — por ejemplo <em>Lambda</em> o{" "}
          <em>S3</em>.
        </li>
        <li>
          Navega con las flechas <kbd>↑</kbd> <kbd>↓</kbd> y confirma con{" "}
          <kbd>Enter</kbd>.
        </li>
      </ol>
      <Tip>
        El buscador filtra por nombre, categoría y descripción. Prueba buscar{" "}
        <em>database</em> para ver todos los servicios de base de datos.
      </Tip>
      <Figure
        src="/docs/screenshots/03-search.png"
        alt="Buscador de servicios abierto con resultados"
        caption="El buscador soporta búsqueda por nombre, categoría o descripción"
      />

      {/* ── 2. Conectar nodos ────────────────────────────── */}
      <h2 id="conectar-nodos">Conectar nodos</h2>
      <p>
        Las conexiones entre nodos representan flujos de datos o relaciones
        entre servicios. Se crean arrastrando desde las asas laterales de un
        nodo.
      </p>
      <Figure
        src="/docs/screenshots/04-connect-nodes.png"
        alt="Dos nodos conectados por una arista en el lienzo"
        caption="Arrastra desde el asa de un nodo hasta el asa de destino"
      />
      <Tip>
        Puedes hacer clic en cualquier conexión para seleccionarla y presionar
        <kbd>Backspace</kbd> o <kbd>Delete</kbd> para eliminarla.
      </Tip>
    </>
  );
}
