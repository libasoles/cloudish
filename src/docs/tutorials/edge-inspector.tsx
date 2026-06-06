import { Carousel } from "../Carousel";

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>;
}

function Figure({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={className ? `figure ${className}` : "figure"}>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export default function EdgeInspector() {
  return (
    <>
      {/* ── 1. Abrir el inspector de conexiones ────────────── */}
      <h2 id="abrir-inspector-conexion">Abrir el inspector de una conexión</h2>
      <p>
        Cada conexión entre nodos tiene propiedades editables accesibles desde el
        inspector. Para abrirlo, haz clic sobre cualquier línea de conexión del
        lienzo.
      </p>
      <p>
        El panel derecho mostrará las opciones de esa conexión: etiqueta,
        dirección de flechas y estilo de línea.
      </p>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/edge-inspector/click-edge.png",
            alt: "Cursor haciendo clic sobre una conexión entre EC2 y RDS",
          },
          {
            src: "/docs/screenshots/edge-inspector/inspector-open.png",
            alt: "Inspector abierto después de seleccionar una conexión",
          },
        ]}
        caption="Haz clic sobre una conexión para abrir sus opciones en el inspector"
      />

      {/* ── 2. Estilo de línea ───────────────────────────────── */}
      <h2 id="estilo-de-linea">Estilo de línea</h2>
      <p>
        La sección <strong>Estilo de línea</strong> del inspector ofrece tres
        modos de visualización para cada conexión. Solo uno puede estar activo a
        la vez. Los botones se encuentran en el panel derecho cuando el edge está
        seleccionado.
      </p>

      <h3>Sólida</h3>
      <p>
        El primer botón aplica una línea continua sin interrupciones. Es el
        estilo por defecto de todas las conexiones nuevas. Úsalo para representar
        flujos estables o relaciones directas entre servicios.
      </p>
      <Figure
        src="/docs/screenshots/edge-inspector/line-solid.png"
        alt="Inspector mostrando estilo de línea Sólida"
        caption="Estilo Sólida: línea continua (defecto)"
        className="figure-intrinsic"
      />

      <h3>Punteada</h3>
      <p>
        El segundo botón aplica una línea discontinua. Es útil para indicar
        conexiones opcionales, flujos secundarios o dependencias débiles —por
        ejemplo, una ruta de fallback o un enlace de solo lectura.
      </p>
      <Figure
        src="/docs/screenshots/edge-inspector/line-dashed.png"
        alt="Inspector mostrando estilo de línea Punteada"
        caption="Estilo Punteada: línea discontinua"
        className="figure-intrinsic"
      />

      <h3>Animada</h3>
      <p>
        El tercer botón activa el flujo animado: la línea se mueve en dirección
        origen → destino de forma continua. Úsalo para destacar flujos activos
        de datos, peticiones en tiempo real, o tráfico principal de la
        arquitectura.
      </p>
      <Figure
        src="/docs/screenshots/edge-inspector/line-animated.png"
        alt="Inspector mostrando estilo de línea Animada"
        caption="Estilo Animada: línea con flujo continuo"
        className="figure-intrinsic"
      />
      <Tip>
        Al activar la animación, el estilo punteado se desactiva automáticamente
        — y viceversa. Los tres modos son excluyentes entre sí.
      </Tip>
    </>
  );
}
