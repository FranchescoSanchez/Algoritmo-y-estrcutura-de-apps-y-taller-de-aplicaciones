# Mi Portafolio (GitHub Pages + Supabase, sin Java)

Portafolio de tareas semana por semana:

- **Página**: HTML + CSS + JavaScript, publicada gratis en **GitHub Pages**.
- **Base de datos y archivos**: **Supabase** (Postgres + Storage + Auth).
- **Quien entra al enlace** ve tu nombre, tu foto y tus tareas, y puede
  abrirlas o descargarlas **sin iniciar sesión**.
- **Solo tú** inicias sesión, cuando quieres subir o borrar una tarea.

No hay servidor ni Java: la página habla directo con Supabase, y la
seguridad la dan las políticas del archivo `supabase.sql`.

> ⚠️ **Nunca pongas la clave `secret` / `service_role` de Supabase en esta
> página.** Es pública y esa clave se salta toda la seguridad. Aquí solo va
> la clave **publishable** (o **anon**), que sí puede ser pública.

Plan gratis de Supabase (sin tarjeta): 500 MB de base de datos, 1 GB de
archivos, 50 MB máximo por archivo (aquí 25 MB) y 5 GB de descargas al mes.
**Un proyecto gratis se pausa tras una semana sin actividad**: si pasa, tus
compañeros verán error hasta que lo reactives con un clic en supabase.com.

## Puesta en marcha (una sola vez, ~15 minutos)

### 1. Proyecto Supabase
Crea uno en <https://supabase.com> (o reutiliza el que ya tenías: las tablas
viejas no estorban). Si reutilizas uno cuyas claves se compartieron por
chat o se subieron a GitHub, **resetea antes la contraseña de la base y la
clave secreta** (Project Settings).

### 2. Crear TU cuenta
1. **Authentication → Users → Add user → Create new user**.
2. Escribe tu correo y una contraseña, y marca **Auto Confirm User**.
3. Copia el **User UID** de esa fila.

### 3. Crear la base y las políticas
1. Abre `supabase.sql`, cambia `PEGA_AQUI_TU_UID` por tu UID.
2. **SQL Editor → New query**, pega todo el archivo y pulsa **Run**.

Esto crea la tabla `tareas`, el bucket público `portafolio-archivos` y las
políticas: cualquiera **lee**, solo tu cuenta **sube y borra**.

Recomendado: en **Authentication → Sign In / Providers**, desactiva
**Allow new users to sign up** para que nadie más pueda crear cuentas.
(Aunque lo hicieran, las políticas les impiden escribir.)

### 4. Conectar la página
1. **Project Settings → API Keys**: copia la **Project URL** y la clave
   **publishable** (o **anon** en proyectos antiguos).
2. Pégalas en `js/config.js` (`SUPABASE_URL`, `SUPABASE_KEY`).
3. En el mismo archivo cambia tu **nombre** y **presentación**, y reemplaza
   `img/perfil.jpg` por tu foto.

### 5. Publicar en GitHub Pages
```bash
cd MiPortafolio-Supabase
git init
git add .
git commit -m "Mi portafolio"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/mi-portafolio.git
git push -u origin main
```
En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → `main` / `(root)` → Save**. En un minuto tendrás tu enlace:

```
https://TU-USUARIO.github.io/mi-portafolio/
```

## Cómo se usa
1. Entra a `.../login.html` (o al enlace **Iniciar sesión** de la barra).
2. En **Subir tareas** elige curso, unidad, semana, título opcional y uno o
   varios archivos.
3. Tus compañeros ven todo en el enlace principal, sin iniciar sesión.

## Probarlo en tu computadora
Los módulos JavaScript no funcionan abriendo el HTML con doble clic:

```bash
python3 -m http.server 8000
```
y abre <http://localhost:8000>.

## Si algo falla
- **"Falta conectar Supabase"**: no pegaste la URL y la clave en `js/config.js`.
- **"Pusiste la clave SECRETA"**: cámbiala por la publishable/anon y resetea
  la secreta en Supabase.
- **"no tiene permiso"**: el UID de `supabase.sql` no es el de tu cuenta, o no
  ejecutaste el SQL. Corrige el UID y vuelve a ejecutarlo (se puede repetir).
- **No carga nada / "sin conexión"**: revisa si el proyecto está **pausado**
  (supabase.com → tu proyecto → Restore).
- **Un archivo no sube**: pesa más de 25 MB, o el bucket no se creó (revisa el
  paso 3).

## Estructura de los datos
```
tabla  public.tareas     id, curso, unidad, semana, titulo, nombre_original,
                         tipo_mime, tamano, ruta, fecha_subida
bucket portafolio-archivos/{curso}/unidad-N/semana-N/{uuid}.{ext}
```
