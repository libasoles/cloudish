import { Carousel } from "../Carousel";

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
        lateral, haciendo clic en un icono de ese panel, o usando el buscador.
      </p>

      <h3>Drag & drop desde el panel lateral</h3>
      <p>
        El panel izquierdo muestra contenedores y herramientas de uso frecuente.
        Para agregar un nodo, arrastralo y suéltalo en el lienzo.
      </p>
      <Figure
        src="/docs/screenshots/sidebar/ec2-hover.png"
        alt="Arrastrando un nodo desde el sidebar hacia el lienzo"
        caption="Arrastra cualquier herramienta desde el panel lateral al lienzo"
      />

      <h3>Buscador de servicios</h3>
      <p>
        El catálogo incluye más de 100 servicios de AWS. Para encontrar uno
        rápido, abre el buscador con <kbd>⌘K</kbd> (Mac) o <kbd>Ctrl K</kbd>{" "}
        (Windows/Linux).
      </p>
      <ol>
        <li>
          Pulsa <kbd>⌘K</kbd> (Mac) o <kbd>Ctrl K</kbd> (Windows/Linux) para
          abrir el buscador.
        </li>
        <li>
          Escribe el nombre del servicio — por ejemplo <em>RDS</em> o{" "}
          <em>Lambda</em>.
        </li>
        <li>
          Navega con las flechas <kbd>↑</kbd> <kbd>↓</kbd> y confirma con{" "}
          <kbd>Enter</kbd> para agregar el servicio al canvas.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/search/rds.png"
        alt="Buscador de servicios abierto con resultados para RDS"
        caption="El buscador filtra por nombre, categoría y descripción"
      />

      {/* ── 2. Conectar nodos ────────────────────────────── */}
      <h2 id="conectar-nodos">Conectar nodos</h2>
      <p>
        Las conexiones entre nodos representan flujos de datos o relaciones
        entre servicios. Se crean arrastrando desde las asas laterales de un
        nodo hasta el asa de otro nodo.
      </p>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/connect-nodes/handle.png",
            alt: "Hover sobre EC2, handle visible en la derecha",
          },
          {
            src: "/docs/screenshots/connect-nodes/dragging.png",
            alt: "Edge temporal cerca del handle de destino de RDS",
          },
          {
            src: "/docs/screenshots/connect-nodes/done.png",
            alt: "Edge conectando EC2 y RDS",
          },
        ]}
        caption="Arrastra desde el asa de un nodo hasta el asa de destino para crear una conexión"
      />
      <Tip>
        Puedes hacer clic en cualquier conexión para seleccionarla y presionar
        <kbd>Backspace</kbd> o <kbd>Delete</kbd> para eliminarla.
      </Tip>
    </>
  );
}
