import { Carousel } from "../Carousel";

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
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/shift-click/before.png",
            alt: "Un nodo seleccionado y otro nodo sin seleccionar con indicador de dónde hacer Shift+clic",
          },
          {
            src: "/docs/screenshots/shift-click/after.png",
            alt: "Múltiples nodos seleccionados con Shift+clic",
          },
        ]}
        caption="Primero selecciona un nodo; luego usa Shift+clic sobre otros nodos para acumular la selección"
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
            alt: "Rectángulo de selección siendo dibujado con Shift+arrastre, englobando todos los nodos",
          },
          {
            src: "/docs/screenshots/shift-drag/after.png",
            alt: "Múltiples nodos seleccionados dentro del rectángulo",
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
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/add-to-selection/before.png",
            alt: "Dos nodos seleccionados y un nodo adicional sin seleccionar con indicador de dónde hacer Shift+clic",
          },
          {
            src: "/docs/screenshots/add-to-selection/after.png",
            alt: "Múltiples nodos seleccionados, mostrando acumulación con Shift+clic",
          },
        ]}
        caption="Con una selección existente, usa Shift+clic sobre un nodo sin seleccionar para agregarlo"
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
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/multiple-edges/selected-before.png",
            alt: "Tres nodos Lambda seleccionados junto a un nodo RDS todavía sin conexiones",
          },
          {
            src: "/docs/screenshots/multiple-edges/handle.png",
            alt: "Indicador de clic sobre el asa lateral de un nodo Lambda seleccionado",
          },
          {
            src: "/docs/screenshots/multiple-edges/selected-to-rds.png",
            alt: "Tres nodos Lambda seleccionados conectados a un nodo RDS",
          },
        ]}
        caption="Con tres nodos seleccionados, arrastra desde un asa hacia RDS para crear las tres conexiones en una sola acción"
      />
      <p style={{ marginTop: "1rem", fontSize: "0.9em", opacity: 0.8 }}>
        <strong>Consejo:</strong> Esta técnica es útil para conectar múltiples
        orígenes (como varios Lambdas) a un destino común (como RDS, DynamoDB, o
        un SNS topic) sin tener que crear cada conexión manualmente.
      </p>
    </>
  );
}
