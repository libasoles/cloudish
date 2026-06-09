export default function KeyboardShortcuts() {
  return (
    <>
      {/* ── 1. Búsqueda y navegación ──────────────────────── */}
      <h2 id="busqueda-navegacion">Búsqueda y navegación</h2>
      <p>
        Abre el buscador de servicios y gestiona el foco del lienzo con estos
        atajos rápidos.
      </p>

      <table
        style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid hsl(var(--border))" }}>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Atajo</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>
              Abre el buscador de servicios
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>Esc</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>
              Cierra el buscador o deselecciona nodos
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Selección y movimiento ──────────────────────── */}
      <h2 id="seleccion-movimiento">Selección y movimiento</h2>
      <p>
        Selecciona múltiples nodos y muévelos usando atajos que aceleran tu
        flujo de trabajo.
      </p>

      <table
        style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid hsl(var(--border))" }}>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Atajo</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>⌘</kbd> + clic / <kbd>Ctrl</kbd> + clic
            </td>
            <td style={{ padding: "0.75rem" }}>
              Selecciona o deselecciona un nodo
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>Shift</kbd> + clic
            </td>
            <td style={{ padding: "0.75rem" }}>Agrega nodos a la selección</td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>Shift</kbd> + arrastre
            </td>
            <td style={{ padding: "0.75rem" }}>
              Dibuja un rectángulo de selección
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>⌘↑↓←→</kbd> / <kbd>Ctrl ↑↓←→</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>
              Salta al nodo conectado en esa dirección
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. Edición y eliminación ──────────────────────── */}
      <h2 id="edicion-eliminacion">Edición y eliminación</h2>
      <p>
        Modifica tu arquitectura rápidamente: duplica, elimina y deshace
        acciones.
      </p>

      <table
        style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid hsl(var(--border))" }}>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Atajo</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>⌘D</kbd> / <kbd>Ctrl D</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>Duplica nodos seleccionados</td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>Delete</kbd> / <kbd>Backspace</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>
              Elimina nodos o conexiones seleccionados
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td style={{ padding: "0.75rem" }}>
              <kbd>⌘Z</kbd> / <kbd>Ctrl Z</kbd>
            </td>
            <td style={{ padding: "0.75rem" }}>Deshace la última acción</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
