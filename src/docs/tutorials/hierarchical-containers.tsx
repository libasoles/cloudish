import { Carousel } from "../Carousel";

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
        <br />
        <strong> Región → VPC → Availability Zone (AZ) → Subnet</strong>.
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
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/region-vpc/region.png",
            alt: "Una Region vacía en el lienzo",
          },
          {
            src: "/docs/screenshots/region-vpc/nested.png",
            alt: "VPC anidado dentro de la Region",
          },
        ]}
        caption="Las Regiones contienen VPCs — arrastra un VPC dentro de una Región para anidarlos automáticamente"
      />

      <h3>Controles del inspector</h3>
      <p>
        Los contenedores exponen controles en el panel inspector derecho para
        ajustar su configuración sin necesidad de edición manual. El control más
        común es el <strong>slider de cantidad</strong>, que controla cuántos
        elementos hijos de un tipo crea automáticamente el contenedor.
      </p>
      <p>
        Por ejemplo, al seleccionar un VPC, el slider{" "}
        <strong>Availability Zones</strong> ajusta el número de AZs (1–6). Las
        AZs aparecen como sub-contenedores dentro del VPC.
      </p>
      <ol>
        <li>Haz clic en un VPC para seleccionarlo.</li>
        <li>
          En el panel inspector (derecha), usa el slider{" "}
          <strong>Availability Zones</strong> para ajustar el número de AZs.
        </li>
        <li>
          Las AZs aparecen automáticamente como contenedores dentro del VPC.
        </li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/az-slider/before.png",
            alt: "VPC seleccionado con slider en 1 AZ",
          },
          {
            src: "/docs/screenshots/az-slider/after.png",
            alt: "VPC seleccionado con slider en 2 AZs, AZs visibles en canvas",
          },
        ]}
        caption="El slider del inspector controla la cantidad de AZs — se actualizan automáticamente en el canvas"
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
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/subnet-type/public.png",
            alt: "Subnet seleccionada con tipo Pública (verde)",
          },
          {
            src: "/docs/screenshots/subnet-type/private.png",
            alt: "Subnet seleccionada con tipo Privada (azul)",
          },
        ]}
        caption="Cambia el tipo de subnet desde el inspector — el color se actualiza automáticamente"
      />
      <Tip>
        Las subnets públicas se muestran en verde esmeralda; las privadas en
        azul. Esta distinción visual es clave para revisar arquitecturas de
        seguridad.
      </Tip>

      {/* ── 2. Sincronización de AZs ─────────────────────── */}
      <h2 id="az-sync">Sincronización de AZs</h2>
      <p>
        Cuando tienes múltiples AZs en un VPC, la sincronización te permite
        replicar automáticamente los nodos de la AZ de referencia en las demás
        AZs — ideal para diseñar arquitecturas multi-AZ simétricas.
      </p>

      <h3>Sincronización de AZs</h3>
      <p>
        Cuando tienes múltiples AZs en un VPC, puedes sincronizar su contenido
        para replicar automáticamente los nodos de la AZ de referencia en las
        demás. Esto es ideal para diseñar arquitecturas multi-AZ simétricas.
      </p>

      <h4>Habilitar sincronización</h4>
      <ol>
        <li>Haz clic en una AZ para seleccionarla.</li>
        <li>
          En el inspector, activa el checkbox <strong>Sincronizar AZs</strong>.
        </li>
        <li>
          Cloudish replicará automáticamente el contenido de esa AZ en todas las
          AZs hermanas.
        </li>
        <li>
          Cualquier nodo que agregues a la AZ de referencia se copiará
          automáticamente a las demás.
        </li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/az-sync/off.png",
            alt: "Dos AZs con EC2+RDS en la primera, sincronización desactivada",
          },
          {
            src: "/docs/screenshots/az-sync/on.png",
            alt: "Dos AZs sincronizadas, la segunda AZ replica el contenido de la primera",
          },
        ]}
        caption="Activa la sincronización para que una AZ replique automáticamente el contenido de la otra"
        interval={2500}
      />

      <h4>Deshabilitar sincronización</h4>
      <ol>
        <li>Selecciona cualquier AZ del grupo sincronizado.</li>
        <li>
          Desactiva el checkbox <strong>Sincronizar AZs</strong> en el
          inspector.
        </li>
        <li>
          Las AZs conservan su contenido actual pero dejan de replicarse entre
          sí — puedes modificarlas de forma independiente.
        </li>
      </ol>
    </>
  );
}
