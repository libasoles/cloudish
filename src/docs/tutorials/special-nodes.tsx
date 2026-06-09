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

export default function SpecialNodes() {
  return (
    <>
      {/* ── 1. Pasted images ───────────────────────────────── */}
      <h2 id="imagenes-pegadas">Imágenes pegadas</h2>
      <p>
        Puedes pegar imágenes directamente desde el portapapeles con{" "}
        <kbd>Cmd</kbd> + <kbd>V</kbd> o <kbd>Ctrl</kbd> + <kbd>V</kbd>. Cloudish
        las agrega como nodos visuales sin borde en el centro del lienzo, útiles
        para insertar logos, capturas, diagramas externos o referencias rápidas.
      </p>
      <p>
        Las imágenes pegadas se pueden mover como cualquier otro nodo. Al
        seleccionarlas aparecen los handles de redimensionado: arrastra una esquina
        para cambiar el tamaño manteniendo la proporción de la imagen.
      </p>
      <Figure
        src="/docs/screenshots/pasted-images/resizable.png"
        alt="Logo de AWS pegado como nodo de imagen seleccionado con handles de redimensionado visibles"
        caption="Las imágenes pegadas son nodos sin borde y redimensionables"
      />
      <Tip>
        Puedes usar imágenes sin iniciar sesión. Si luego guardas el proyecto
        estando logueado, Cloudish sube esas imágenes junto con la arquitectura
        para que sigan disponibles al reabrirla.
      </Tip>

      {/* ── 1. API Gateway ───────────────────────────────── */}
      <h2 id="api-gateway-rutas">API Gateway: rutas HTTP</h2>
      <p>
        El nodo <strong>API Gateway</strong> tiene un comportamiento especial: en
        lugar de un único handle de salida, puede exponer una handle por cada ruta
        HTTP que definas. Esto te permite conectar cada endpoint directamente al
        servicio que lo maneja — por ejemplo, <code>GET /users</code> a una Lambda
        y <code>POST /orders</code> a otra.
      </p>

      <h3>Agregar rutas desde el inspector</h3>
      <p>
        Al seleccionar un nodo API Gateway, el inspector muestra una sección{" "}
        <strong>Rutas</strong> debajo de los campos generales. Cada fila tiene un
        selector de método HTTP y un campo de ruta.
      </p>
      <ol>
        <li>Haz clic sobre el nodo API Gateway para seleccionarlo.</li>
        <li>
          En el inspector, despliega el selector de método (GET, POST, PUT,
          DELETE…) y elige el verbo para la primera ruta.
        </li>
        <li>
          Escribe la ruta en el campo de texto — por ejemplo{" "}
          <code>/users</code>.
        </li>
        <li>
          Haz clic en <strong>Agregar ruta</strong> para añadir más filas.
        </li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/api-gateway/inspector-empty.png",
            alt: "Inspector de API Gateway con dos filas vacías por defecto",
          },
          {
            src: "/docs/screenshots/api-gateway/inspector-filled.png",
            alt: "Inspector con GET /users y POST /orders definidos",
          },
          {
            src: "/docs/screenshots/api-gateway/node-with-routes.png",
            alt: "Nodo API Gateway mostrando las rutas como filas en la tarjeta",
          },
        ]}
        caption="Define las rutas en el inspector — aparecen como filas en el nodo"
      />
      <Tip>
        Las rutas con la ruta vacía no aparecen en el nodo. Un endpoint solo
        es visible cuando tiene al menos un carácter en el campo de ruta.
      </Tip>

      <h3>Conectar rutas a servicios</h3>
      <p>
        Cada fila de ruta tiene su propio handle de salida en el borde derecho del
        nodo. Arrastra desde ese handle hasta el nodo destino para modelar qué
        servicio responde a cada endpoint.
      </p>
      <Figure
        src="/docs/screenshots/api-gateway/routes-connected.png"
        alt="API Gateway con GET /users conectado a una Lambda y POST /orders a otra Lambda"
        caption="Cada ruta puede conectarse a un servicio distinto"
      />
      <Tip>
        El handle azul que aparece en el área del encabezado del nodo sigue
        funcionando como conexión general, independiente de las rutas.
      </Tip>

      {/* ── 2. VPN Gateway ───────────────────────────────── */}
      <h2 id="vpn-gateway-conexion">VPN Gateway y Customer Gateway</h2>
      <p>
        El nodo <strong>VPN Gateway</strong> representa la puerta de enlace de una
        VPN IPsec entre tu VPC y un cliente externo. En el diagrama se ubica sobre
        el borde de la VPC para marcar el punto de entrada. Tiene un comportamiento
        visual especial: cuando conectas cualquier nodo hacia él, el handle de
        origen se transforma en un ícono de <strong>Customer Gateway</strong>,
        indicando que ese extremo es el dispositivo de red en el lado del cliente.
      </p>

      <h3>Crear la conexión VPN</h3>
      <p>
        La transformación del handle ocurre automáticamente al crear el edge — no
        requiere ninguna configuración adicional.
      </p>
      <ol>
        <li>
          Agrega un nodo <strong>VPN Gateway</strong> al lienzo desde el buscador
          o el panel lateral, y colócalo centrado sobre el borde izquierdo de la VPC.
        </li>
        <li>
          Agrega el nodo que representa el extremo externo — por ejemplo{" "}
          <strong>Mobile</strong> — fuera de la VPC.
        </li>
        <li>
          Arrastra desde el handle del nodo on-premises hasta el nodo VPN Gateway.
        </li>
        <li>
          El handle de origen se convierte en el ícono de Customer Gateway, y el
          edge recibe la etiqueta <strong>VPN</strong> automáticamente.
        </li>
      </ol>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/vpn-gateway/before-connect.png",
            alt: "Mobile fuera de una VPC con VPN Gateway centrado en el borde izquierdo, API Gateway y dos Lambdas dentro",
          },
          {
            src: "/docs/screenshots/vpn-gateway/connecting.png",
            alt: "Edge en progreso desde Mobile hacia el VPN Gateway ubicado en el borde de la VPC",
          },
          {
            src: "/docs/screenshots/vpn-gateway/customer-gateway.png",
            alt: "Handle de Mobile transformado en ícono de Customer Gateway con etiqueta VPN hacia la VPC",
          },
        ]}
        caption="Al conectar hacia VPN Gateway el handle origen se convierte en Customer Gateway"
      />
      <Tip>
        Si eliminas el edge, el ícono de Customer Gateway desaparece y el handle
        vuelve a su apariencia normal. El ícono solo es visible cuando existe la
        conexión VPN activa.
      </Tip>
    </>
  );
}
