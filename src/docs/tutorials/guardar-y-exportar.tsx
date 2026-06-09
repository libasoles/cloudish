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

export default function GuardarYExportar() {
  return (
    <>
      {/* ── 1. Guardar arquitectura ──────────────────────────── */}
      <h2 id="guardar">Guardar arquitectura</h2>
      <p>
        El botón <strong>Guardar</strong> de la barra superior guarda tu
        arquitectura en la nube y la asocia a tu cuenta. Así puedes cerrar el
        navegador y retomar el trabajo desde cualquier dispositivo.
      </p>
      <p>
        La primera vez que hagas clic en <strong>Guardar</strong> sin tener
        sesión iniciada, aparecerá un diálogo de autenticación. Puedes
        registrarte con correo electrónico y contraseña, o continuar con tu
        cuenta de Google. Una vez que inicies sesión, el guardado se ejecuta
        automáticamente.
      </p>
      <Figure
        src="/docs/screenshots/save/toolbar.png"
        alt="Barra superior con el botón Guardar visible"
        caption="El botón Guardar se encuentra en la barra superior, junto al nombre del proyecto"
      />
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/save/auth-dialog.png",
            alt: "Diálogo de autenticación al intentar guardar sin sesión",
          },
          {
            src: "/docs/screenshots/save/saved-toast.png",
            alt: "Notificación de guardado exitoso en la esquina inferior derecha",
          },
        ]}
        caption="Si no tienes sesión iniciada, aparece el diálogo de login. Tras autenticarte, el proyecto se guarda y aparece la confirmación"
      />
      <Tip>
        El botón <strong>Guardar</strong> se activa automáticamente cuando
        realizas cambios no guardados en el lienzo. Puedes ver el estado
        "guardado" en la barra superior: si el botón está deshabilitado, el
        proyecto ya está al día.
      </Tip>

      {/* ── 2. Proyectos guardados ───────────────────────────── */}
      <h2 id="proyectos-guardados">Proyectos guardados</h2>
      <p>
        Todos tus borradores guardados son accesibles desde el inspector lateral.
        Con la sesión activa y sin ningún nodo seleccionado, el panel derecho
        muestra la lista de arquitecturas guardadas.
      </p>
      <ol>
        <li>Haz clic en una zona vacía del lienzo para deseleccionar todo.</li>
        <li>El inspector mostrará tus borradores con nombre y fecha.</li>
        <li>
          Haz clic en <strong>Cargar</strong> para abrir esa arquitectura en el
          lienzo.
        </li>
      </ol>
      <Figure
        src="/docs/screenshots/save/projects-list.png"
        alt="Lista de proyectos guardados en el inspector lateral derecho"
        caption="El inspector muestra tus borradores cuando no hay nodos seleccionados"
      />
      <Tip>
        Para renombrar un proyecto, haz clic en el nombre editable de la barra
        superior y escribe el nuevo nombre. Para eliminar el proyecto actual, usa
        el botón de eliminar junto al botón Guardar — esta acción no tiene
        deshacer.
      </Tip>

      {/* ── 3. Exportar arquitectura ─────────────────────────── */}
      <h2 id="exportar">Exportar arquitectura</h2>
      <p>
        El icono de descarga de la barra superior abre el menú de exportación.
        Hay tres formatos disponibles: imagen PNG, Terraform y CloudFormation.
        Puedes exportar sin necesidad de tener una cuenta.
      </p>

      <h3>Imagen (PNG)</h3>
      <p>
        Genera una captura de tu arquitectura con fondo oscuro y el logotipo de
        AWS en la esquina superior izquierda. La imagen se descarga directamente
        al hacer clic — no hay confirmación previa.
      </p>

      <h3>Terraform y CloudFormation</h3>
      <p>
        Genera un scaffold de código en <strong>Terraform (.tf)</strong> o{" "}
        <strong>CloudFormation (.yaml)</strong> basado en los nodos del lienzo.
        Antes de la descarga aparece un diálogo de advertencia que recuerda que
        el archivo es un punto de partida y requiere revisión.
      </p>
      <Carousel
        slides={[
          {
            src: "/docs/screenshots/export/menu-open.png",
            alt: "Menú de exportación abierto con las tres opciones: imagen, Terraform y CloudFormation",
          },
          {
            src: "/docs/screenshots/export/disclaimer.png",
            alt: "Diálogo de advertencia antes de descargar el archivo de código generado",
          },
        ]}
        caption="Abre el menú de exportación y elige el formato. Para código, confirma el diálogo antes de descargar"
      />
      <Tip>
        Los archivos Terraform y CloudFormation generados son scaffolds
        automáticos — revisa cada recurso, reemplaza los valores{" "}
        <code>REPLACE_ME</code> con los datos reales de tu infraestructura y
        valida el resultado con <code>terraform validate</code> o el linter de
        CloudFormation antes de aplicarlos.
      </Tip>
    </>
  );
}
