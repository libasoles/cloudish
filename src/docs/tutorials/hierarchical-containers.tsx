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

export default function HierarchicalContainers() {
  return (
    <>
      {/* ── 1. Contenedores jerárquicos ──────────────────── */}
      <h2 id="contenedores">Contenedores jerárquicos</h2>
      <p>
        Cloudish modela la jerarquía de AWS con cuatro niveles de contenedores
        anidables:
        <strong>
          {" "}
          Región → VPC → Availability Zone (AZ) → Subnet → Servicio
        </strong>
        .
      </p>

      <h3>Crear una Región y agregar una VPC</h3>
      <ol>
        <li>
          Arrastra o haz clic en <strong>Region</strong> en el panel lateral
          para crear una región.
        </li>
        <li>
          Arrastra un <strong>VPC</strong> y suéltalo dentro de la región — el
          VPC queda anidado automáticamente.
        </li>
        <li>
          Redimensiona los contenedores arrastrando sus bordes o esquinas.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/05-region-vpc.png"
        alt="VPC anidado dentro de una región en el lienzo"
        caption="Las regiones contienen VPCs; arrastra para anidar"
      />

      <h3>AZs: slider del inspector</h3>
      <p>
        Las Availability Zones se gestionan desde el inspector lateral.
        Selecciona un VPC y el panel derecho muestra el control de AZs.
      </p>
      <ol>
        <li>Haz clic en un VPC para seleccionarlo.</li>
        <li>
          En el panel inspector (derecha), usa el slider{" "}
          <strong>Availability Zones</strong> para ajustar el número de AZs
          (1–6).
        </li>
        <li>Las AZs aparecen como contenedores dentro del VPC.</li>
      </ol>
      <Figure
        src="/docs/screenshots/06-az-inspector.png"
        alt="Inspector del VPC mostrando el slider de AZs"
        caption="El slider del inspector controla el número de AZs en el VPC"
      />

      <h3>Crear Subnets y cambiar de pública a privada</h3>
      <ol>
        <li>
          Arrastra un nodo <strong>Subnet</strong> dentro de una AZ.
        </li>
        <li>Haz clic en la subnet para seleccionarla.</li>
        <li>
          En el inspector, usa el selector <strong>Tipo</strong> para cambiar
          entre <em>Pública</em> y <em>Privada</em>.
        </li>
      </ol>
      <Tip>
        Las subnets públicas se muestran en verde esmeralda; las privadas en
        azul. Esta distinción visual es clave para revisar arquitecturas de
        seguridad.
      </Tip>
      <Figure
        src="/docs/screenshots/07-subnet-private.png"
        alt="Inspector de una subnet con selector de tipo público/privado"
        caption="Cambia el tipo de subnet desde el inspector"
      />

      {/* ── 2. Sincronización de AZs ─────────────────────── */}
      <h2 id="az-sync">Sincronización de AZs</h2>
      <p>
        Cuando tienes múltiples AZs en un VPC, la sincronización te permite
        replicar automáticamente los nodos de la AZ de referencia en las demás
        AZs — ideal para diseñar arquitecturas multi-AZ simétricas.
      </p>

      <h3>Habilitar sincronización</h3>
      <ol>
        <li>Haz clic en una AZ para seleccionarla.</li>
        <li>
          En el inspector, activa el checkbox <strong>Sincronizar AZs</strong>.
        </li>
        <li>
          Cloudish replicará el contenido de la AZ de referencia en todas las
          AZs hermanas.
        </li>
        <li>
          Cualquier nodo que agregues a la AZ de referencia se copiará
          automáticamente a las demás.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/08-az-sync.png"
        alt="AZs sincronizadas con el mismo contenido replicado"
        caption="Las AZs sincronizadas muestran un ícono de enlace y replican su contenido"
      />

      <h3>Deshabilitar sincronización</h3>
      <ol>
        <li>Selecciona cualquier AZ del grupo sincronizado.</li>
        <li>
          Desactiva el checkbox <strong>Sincronizar AZs</strong> en el
          inspector.
        </li>
        <li>
          Las AZs conservan su contenido pero dejan de replicarse entre sí.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/09-az-unsync.png"
        alt="AZs desincronizadas mostrando contenido independiente"
        caption="Al desincronizar, cada AZ mantiene su contenido actual de forma independiente"
      />
    </>
  );
}
