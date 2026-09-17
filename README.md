# Mi Portafolio UPLA — versión web estática

Esta es la versión en HTML/CSS/JS puro de tu portafolio, lista para
publicarse gratis con **GitHub Pages**. Mantiene el mismo diseño
(colores, tipografías, tarjetas, acordeón de unidades y semanas) que
la versión original en Java.

## Qué cambió respecto a la versión Java

GitHub Pages solo sirve archivos estáticos (HTML, CSS, JS), no puede
ejecutar un backend en Java ni conectarse a Supabase. Por eso:

- El registro, login y la lista de tareas ahora se guardan en el
  **localStorage del navegador** (en el propio dispositivo del
  usuario), en vez de en una base de datos en la nube.
- Los archivos subidos se guardan como texto codificado (base64)
  dentro del navegador. Funciona bien para archivos livianos, pero
  no es un almacenamiento serio a largo plazo ni compartido entre
  dispositivos.
- Cada persona que entra ve **sus propios** datos guardados en su
  propio navegador; no hay una base de datos compartida entre
  visitantes.

Si más adelante quieres login y subida de archivos "de verdad"
(compartidos entre todos los usuarios), lo normal es desplegar el
backend Java en un servicio como Render, Railway o un VPS, y dejar
GitHub Pages solo para la parte visual — o migrar el backend a algo
que sí corra gratis con Pages, como Firebase o Supabase directamente
desde el navegador.

## Estructura

```
MiPortafolioWeb/
├── index.html        Portafolio público
├── login.html         Iniciar sesión
├── registro.html       Crear cuenta
├── dashboard.html       Subir y gestionar tareas
├── css/styles.css       Mismos estilos que la versión original
├── js/datos.js         Lógica común (usuarios, sesión, barra superior)
├── js/main.js          Lógica del portafolio público
├── js/dashboard.js      Lógica de subida/listado/eliminado de tareas
└── img/                 Logo UPLA y foto de perfil
```

## Publicarlo con GitHub Pages (paso a paso)

1. **Abre esta carpeta en Visual Studio Code.**
2. Crea un repositorio en GitHub (por ejemplo `mi-portafolio`).
3. En la terminal de VS Code (dentro de esta carpeta), ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Portafolio UPLA - version estatica"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/mi-portafolio.git
   git push -u origin main
   ```
   (Reemplaza `TU-USUARIO` y el nombre del repositorio por los tuyos.
   Si usas la extensión de GitHub en VS Code, también puedes hacer
   todo esto con los botones de "Source Control" y "Publish to
   GitHub" en vez de la terminal.)
4. En GitHub, entra al repositorio → **Settings** → **Pages**.
5. En "Build and deployment" → "Source", elige **Deploy from a
   branch**.
6. En "Branch", elige **main** y la carpeta **/ (root)** → **Save**.
7. Espera 1-2 minutos. GitHub te mostrará el link, algo como:
   ```
   https://TU-USUARIO.github.io/mi-portafolio/
   ```

Ese link ya es tu portafolio en línea, con el mismo diseño de
siempre.

## Probarlo localmente antes de subirlo

Puedes simplemente abrir `index.html` con doble clic, o en VS Code
usar la extensión **Live Server** (botón derecho → "Open with Live
Server") para verlo con recarga automática mientras editas.
