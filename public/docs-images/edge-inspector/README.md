# Edge Inspector Images

Este directorio debe contener capturas de pantalla del panel inspector mostrando:

1. `01-inspector-solid.png` - Inspector con edge seleccionado, mostrando estilo sólido (por defecto)
2. `02-inspector-dashed.png` - Inspector con estilo punteado activado
3. `03-inspector-animated.png` - Inspector con estilo animado activado

## Cómo capturar estas imágenes:

1. Abre http://localhost:5173/ en el navegador
2. Arrastra dos servicios (ej: EC2 y S3) al canvas
3. Conéctalos arrastrando desde un handle de uno a otro
4. Haz clic en la línea de conexión (edge)
5. Toma una captura del panel derecho (360px de ancho) mostrando los botones de estilo de línea
6. Guarda como `01-inspector-solid.png`
7. Haz clic en el botón "Punteada" y captura como `02-inspector-dashed.png`
8. Haz clic en el botón "Animada" y captura como `03-inspector-animated.png`
