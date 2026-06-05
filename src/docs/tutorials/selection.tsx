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

export default function Selection() {
  return (
    <>
      {/* ── 1. Selección múltiple ────────────────────────── */}
      <h2 id="seleccion-multiple">Selección múltiple</h2>
      <p>
        Puedes seleccionar varios nodos a la vez usando <kbd>Shift</kbd> junto
        con clic o arrastre, para luego moverlos, eliminarlos o alinearlos en
        grupo.
      </p>

      <h3>Shift + clic</h3>
      <ol>
        <li>Haz clic en el primer nodo para seleccionarlo.</li>
        <li>
          Mantén <kbd>Shift</kbd> y haz clic en otros nodos para agregarlos a la
          selección.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/shift-click/shift-click.png"
        alt="Tres nodos seleccionados con Shift+clic"
        caption="Shift+clic acumula nodos en la selección"
      />

      <h3>Shift + arrastre (caja de selección)</h3>
      <ol>
        <li>
          Mantén <kbd>Shift</kbd> presionado.
        </li>
        <li>
          Haz clic y arrastra en un área vacía del lienzo para dibujar un
          rectángulo.
        </li>
        <li>Todos los nodos que toquen el rectángulo quedan seleccionados.</li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/shift-drag/start.png",
            alt: "Nodos dispersos sin selección",
          },
          {
            src: "/docs/screenshots/shift-drag/box.png",
            alt: "Rectángulo de selección siendo dibujado con Shift+arrastre",
          },
        ]}
        caption="Mantén Shift y arrastra para dibujar una caja de selección — captura todos los nodos que toca"
      />

      {/* ── 2. Agregar a la selección ─────────────────────── */}
      <h2 id="agregar-a-seleccion">Agregar a la selección</h2>
      <p>
        Si ya tienes nodos seleccionados y quieres agregar más sin perder los
        que ya tienes, mantén <kbd>Shift</kbd> al hacer clic en los nuevos
        nodos. La selección se acumula — los nodos previos no se deseleccionan.
      </p>
      <ol>
        <li>Selecciona uno o varios nodos.</li>
        <li>
          Mantén <kbd>Shift</kbd> y haz clic en un nodo adicional.
        </li>
        <li>El nodo se suma a la selección existente.</li>
      </ol>
      <Figure
        src="/docs/screenshots/add-to-selection/add-to-selection.png"
        alt="Agregando un nodo a una selección existente con Shift"
        caption="Shift+clic agrega nodos a la selección actual sin deseleccionar"
      />

      {/* ── 3. Herramientas de alineación ────────────────── */}
      <h2 id="alineacion">Herramientas de alineación</h2>
      <p>
        Al seleccionar dos o más nodos, aparece una barra de herramientas
        flotante encima de la selección con opciones de alineación.
      </p>
      <ol>
        <li>
          Selecciona 2 o más nodos usando <kbd>Shift</kbd>+clic o{" "}
          <kbd>Shift</kbd>+arrastre.
        </li>
        <li>
          La barra de alineación aparece automáticamente sobre la selección.
        </li>
        <li>
          Usa los botones de la barra:
          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "1.5rem",
              marginTop: "0.5rem",
            }}
          >
            <li>
              <strong>Centrar horizontalmente</strong> — alinea los nodos en el
              eje vertical del centro de la selección.
            </li>
            <li>
              <strong>Centrar verticalmente</strong> — alinea los nodos en el
              eje horizontal del centro de la selección.
            </li>
          </ul>
        </li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/alignment/before.png",
            alt: "Nodos desalineados con toolbar visible",
          },
          {
            src: "/docs/screenshots/alignment/after.png",
            alt: "Nodos alineados horizontalmente",
          },
        ]}
        caption="La barra de alineación aparece automáticamente — usa los botones para alinear nodos"
      />

      {/* ── 4. Crear múltiples edges desde selección ───────── */}
      <h2 id="multiples-edges">Crear múltiples edges desde selección</h2>
      <p>
        Cuando tienes varios nodos seleccionados, puedes crear conexiones desde
        cualquiera de ellos a un nodo externo usando sus asas. Todas las
        conexiones se crearán simultáneamente desde los nodos seleccionados
        hacia el destino.
      </p>
      <ol>
        <li>
          Selecciona múltiples nodos usando <kbd>Shift</kbd>+clic o{" "}
          <kbd>Shift</kbd>+arrastre (por ejemplo, 3 funciones Lambda).
        </li>
        <li>
          Coloca el cursor sobre el asa lateral de cualquiera de los nodos
          seleccionados — aparecerá un punto de conexión.
        </li>
        <li>
          Arrastra desde ese asa hasta el asa de destino del nodo externo (por
          ejemplo, una base de datos RDS).
        </li>
        <li>
          Se crearán conexiones automáticas desde cada nodo seleccionado hacia
          el nodo destino.
        </li>
      </ol>
      <p style={{ marginTop: "1rem", fontSize: "0.9em", opacity: 0.8 }}>
        <strong>Consejo:</strong> Esta técnica es útil para conectar múltiples
        orígenes (como varios Lambdas) a un destino común (como RDS, DynamoDB, o
        un SNS topic) sin tener que crear cada conexión manualmente.
      </p>
    </>
  );
}
