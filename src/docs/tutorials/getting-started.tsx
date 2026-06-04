function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>
}

export default function GettingStarted() {
  return (
    <>
      {/* ── 1. Agregar nodos ─────────────────────────────── */}
      <h2 id="agregar-nodos">Agregar nodos</h2>
      <p>
        Hay tres formas de agregar nodos al canvas: arrastrando desde el panel lateral,
        haciendo clic en un icono del panel, o usando el buscador.
      </p>

      <h3>Drag & drop desde el panel lateral</h3>
      <p>
        El panel izquierdo muestra los tipos de nodos disponibles. Para agregar uno,
        arrastra cualquier herramienta y suéltala en el área del canvas.
      </p>
      <ol>
        <li>Posiciona el cursor sobre el icono de un servicio en el panel lateral.</li>
        <li>Mantén presionado el botón del mouse y arrastra hacia el canvas.</li>
        <li>Suelta en la posición deseada — el nodo aparece exactamente donde lo soltaste.</li>
      </ol>
      <Figure
        src="/docs/screenshots/01-sidebar-drag.png"
        alt="Arrastrando un nodo desde el sidebar hacia el canvas"
        caption="Arrastra cualquier herramienta desde el panel lateral al canvas"
      />

      <h3>Click para agregar al centro</h3>
      <p>
        Si solo quieres agregar un nodo rápidamente sin preocuparte por la posición,
        haz clic directamente en el icono del panel lateral — el nodo aparecerá en el
        centro del viewport actual.
      </p>
      <Figure
        src="/docs/screenshots/02-sidebar-click.png"
        alt="Haciendo click en un icono del sidebar"
        caption="Un clic agrega el nodo al centro del canvas"
      />

      <h3>Buscador de servicios</h3>
      <p>
        El catálogo incluye más de 100 servicios de AWS. Para encontrar uno rápido,
        usa el buscador en la parte superior del canvas.
      </p>
      <ol>
        <li>
          Pulsa <kbd>⌘K</kbd> (Mac) o <kbd>Ctrl K</kbd> (Windows/Linux) para abrir el buscador.
        </li>
        <li>Escribe el nombre del servicio — por ejemplo <em>Lambda</em> o <em>S3</em>.</li>
        <li>Navega con las flechas <kbd>↑</kbd> <kbd>↓</kbd> y confirma con <kbd>Enter</kbd>.</li>
      </ol>
      <Tip>
        El buscador filtra por nombre, categoría y descripción. Prueba buscar <em>database</em>
        para ver todos los servicios de base de datos.
      </Tip>
      <Figure
        src="/docs/screenshots/03-search.png"
        alt="Buscador de servicios abierto con resultados"
        caption="El buscador soporta búsqueda por nombre, categoría o descripción"
      />

      {/* ── 2. Conectar nodos ────────────────────────────── */}
      <h2 id="conectar-nodos">Conectar nodos</h2>
      <p>
        Las conexiones entre nodos representan flujos de datos o relaciones entre servicios.
        Se crean arrastrando desde las asas (handles) que aparecen al pasar el cursor por los bordes de un nodo.
      </p>
      <ol>
        <li>Pasa el cursor por encima del borde de un nodo — aparecerán las asas azules.</li>
        <li>Haz clic y arrastra desde un asa de salida hacia otro nodo.</li>
        <li>Al acercarte al destino verás el asa de entrada resaltada — suelta para crear la conexión.</li>
      </ol>
      <Figure
        src="/docs/screenshots/04-connect-nodes.png"
        alt="Arrastrando una conexión entre dos nodos"
        caption="Arrastra desde el asa de un nodo hasta el asa de destino"
      />
      <Tip>
        Puedes hacer clic en cualquier conexión para seleccionarla y presionar
        <kbd>Backspace</kbd> o <kbd>Delete</kbd> para eliminarla.
      </Tip>

      {/* ── 3. Contenedores jerárquicos ──────────────────── */}
      <h2 id="contenedores">Contenedores jerárquicos</h2>
      <p>
        Cloudish modela la jerarquía de AWS con cuatro niveles de contenedores anidables:
        <strong> Región → VPC → Availability Zone (AZ) → Subnet → Servicio</strong>.
      </p>

      <h3>Crear una Región y agregar una VPC</h3>
      <ol>
        <li>Arrastra o haz clic en <strong>Region</strong> en el panel lateral para crear una región.</li>
        <li>Arrastra un <strong>VPC</strong> y suéltalo dentro de la región — el VPC queda anidado automáticamente.</li>
        <li>Redimensiona los contenedores arrastrando sus bordes o esquinas.</li>
      </ol>
      <Figure
        src="/docs/screenshots/05-region-vpc.png"
        alt="VPC anidado dentro de una región en el canvas"
        caption="Las regiones contienen VPCs; arrastra para anidar"
      />

      <h3>AZs: slider del inspector</h3>
      <p>
        Las Availability Zones se gestionan desde el inspector lateral. Selecciona un VPC
        y el panel derecho muestra el control de AZs.
      </p>
      <ol>
        <li>Haz clic en un VPC para seleccionarlo.</li>
        <li>En el panel inspector (derecha), usa el slider <strong>Availability Zones</strong> para ajustar el número de AZs (1–6).</li>
        <li>Las AZs aparecen como contenedores dentro del VPC.</li>
      </ol>
      <Figure
        src="/docs/screenshots/06-az-inspector.png"
        alt="Inspector del VPC mostrando el slider de AZs"
        caption="El slider del inspector controla el número de AZs en el VPC"
      />

      <h3>Crear Subnets y cambiar de pública a privada</h3>
      <ol>
        <li>Arrastra un nodo <strong>Subnet</strong> dentro de una AZ.</li>
        <li>Haz clic en la subnet para seleccionarla.</li>
        <li>En el inspector, usa el selector <strong>Tipo</strong> para cambiar entre <em>Pública</em> y <em>Privada</em>.</li>
      </ol>
      <Tip>
        Las subnets públicas se muestran en verde esmeralda; las privadas en azul.
        Esta distinción visual es clave para revisar arquitecturas de seguridad.
      </Tip>
      <Figure
        src="/docs/screenshots/07-subnet-private.png"
        alt="Inspector de una subnet con selector de tipo público/privado"
        caption="Cambia el tipo de subnet desde el inspector"
      />

      {/* ── 4. Sincronización de AZs ─────────────────────── */}
      <h2 id="az-sync">Sincronización de AZs</h2>
      <p>
        Cuando tienes múltiples AZs en un VPC, la sincronización te permite replicar
        automáticamente los nodos de la AZ de referencia en las demás AZs —
        ideal para diseñar arquitecturas multi-AZ simétricas.
      </p>

      <h3>Habilitar sincronización</h3>
      <ol>
        <li>Haz clic en una AZ para seleccionarla.</li>
        <li>En el inspector, activa el checkbox <strong>Sincronizar AZs</strong>.</li>
        <li>Cloudish replicará el contenido de la AZ de referencia en todas las AZs hermanas.</li>
        <li>Cualquier nodo que agregues a la AZ de referencia se copiará automáticamente a las demás.</li>
      </ol>
      <Figure
        src="/docs/screenshots/08-az-sync.png"
        alt="AZs sincronizadas con el mismo contenido replicado"
        caption="Las AZs sincronizadas muestran un ícono de enlace y replican su contenido"
      />

      <h3>Deshabilitar sincronización</h3>
      <ol>
        <li>Selecciona cualquier AZ del grupo sincronizado.</li>
        <li>Desactiva el checkbox <strong>Sincronizar AZs</strong> en el inspector.</li>
        <li>Las AZs conservan su contenido pero dejan de replicarse entre sí.</li>
      </ol>
      <Figure
        src="/docs/screenshots/09-az-unsync.png"
        alt="AZs desincronizadas mostrando contenido independiente"
        caption="Al desincronizar, cada AZ mantiene su contenido actual de forma independiente"
      />

      {/* ── 5. Selección múltiple ────────────────────────── */}
      <h2 id="seleccion-multiple">Selección múltiple</h2>
      <p>
        Puedes seleccionar varios nodos a la vez usando <kbd>Shift</kbd> junto con
        clic o arrastre, para luego moverlos, eliminarlos o alinearlos en grupo.
      </p>

      <h3>Shift + clic</h3>
      <ol>
        <li>Haz clic en el primer nodo para seleccionarlo.</li>
        <li>Mantén <kbd>Shift</kbd> y haz clic en otros nodos para agregarlos a la selección.</li>
      </ol>
      <Figure
        src="/docs/screenshots/10-shift-click.png"
        alt="Tres nodos seleccionados con Shift+clic"
        caption="Shift+clic acumula nodos en la selección"
      />

      <h3>Shift + arrastre (caja de selección)</h3>
      <ol>
        <li>Mantén <kbd>Shift</kbd> presionado.</li>
        <li>Haz clic y arrastra en un área vacía del canvas para dibujar un rectángulo.</li>
        <li>Todos los nodos que toquen el rectángulo quedan seleccionados.</li>
      </ol>
      <Figure
        src="/docs/screenshots/11-shift-drag.png"
        alt="Rectángulo de selección dibujado con Shift+arrastre"
        caption="La caja de selección captura todos los nodos que toca"
      />

      {/* ── 6. Agregar a la selección ─────────────────────── */}
      <h2 id="agregar-a-seleccion">Agregar a la selección</h2>
      <p>
        Si ya tienes nodos seleccionados y quieres agregar más sin perder los que ya
        tienes, mantén <kbd>Shift</kbd> al hacer clic en los nuevos nodos.
        La selección se acumula — los nodos previos no se deseleccionan.
      </p>
      <ol>
        <li>Selecciona uno o varios nodos.</li>
        <li>Mantén <kbd>Shift</kbd> y haz clic en un nodo adicional.</li>
        <li>El nodo se suma a la selección existente.</li>
      </ol>
      <Figure
        src="/docs/screenshots/12-add-to-selection.png"
        alt="Agregando un nodo a una selección existente con Shift"
        caption="Shift+clic agrega nodos a la selección actual sin deseleccionar"
      />

      {/* ── 7. Herramientas de alineación ────────────────── */}
      <h2 id="alineacion">Herramientas de alineación</h2>
      <p>
        Al seleccionar dos o más nodos, aparece una barra de herramientas flotante
        encima de la selección con opciones de alineación.
      </p>
      <ol>
        <li>Selecciona 2 o más nodos usando <kbd>Shift</kbd>+clic o <kbd>Shift</kbd>+arrastre.</li>
        <li>La barra de alineación aparece automáticamente sobre la selección.</li>
        <li>
          Usa los botones de la barra:
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Centrar horizontalmente</strong> — alinea los nodos en el eje vertical del centro de la selección.</li>
            <li><strong>Centrar verticalmente</strong> — alinea los nodos en el eje horizontal del centro de la selección.</li>
          </ul>
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/13-alignment-toolbar.png"
        alt="Barra de alineación flotante sobre nodos seleccionados"
        caption="La barra de alineación aparece automáticamente al seleccionar 2 o más nodos"
      />
    </>
  )
}
