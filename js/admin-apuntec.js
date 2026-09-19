// ===========================================
// GRADIENTE UTN — Panel de carga de APUNTEC
// ===========================================
// Flujo (pensado para esquivar el límite de 4.5MB que tienen las funciones
// serverless de Vercel):
//
//   1. El archivo va DIRECTO del navegador a la API de GitHub (Contents API),
//      usando el token que el admin pega en esta misma página. Así el archivo
//      nunca pasa por nuestro servidor.
//   2. Una vez que GitHub confirma el commit, armamos la URL pública del
//      archivo vía jsDelivr (el CDN que sirve repos de GitHub con el
//      Content-Type correcto).
//   3. Recién ahí mandamos un pedido chiquito (sin el archivo, solo texto)
//      a nuestra función serverless /api/registrar-apuntec, que inserta la
//      fila en Supabase usando la service_role key (con permiso para
//      saltarse las políticas RLS de solo-lectura que tiene el resto del sitio).

// Carga las carpetas de APUNTEC en el <select>, respetando la jerarquía
// (carpeta_padre_id) para mostrar indentado "Materia > Subcarpeta".
async function cargarCarpetasEnSelector() {
  const selector = document.getElementById('select-carpeta');

  const { data: carpetas, error } = await supabaseClient
    .from('carpetas')
    .select('*')
    .eq('seccion', 'apuntec')
    .order('orden');

  if (error || !carpetas) {
    selector.innerHTML = '<option value="">Error al cargar carpetas</option>';
    return;
  }

  // Armamos las opciones en orden jerárquico: cada raíz, seguida de sus hijas
  const porPadre = {};
  carpetas.forEach((c) => {
    const clave = c.carpeta_padre_id ?? 'raiz';
    if (!porPadre[clave]) porPadre[clave] = [];
    porPadre[clave].push(c);
  });

  const opciones = [];
  function agregarNivel(padreId, profundidad) {
    const hijas = porPadre[padreId ?? 'raiz'] || [];
    hijas.forEach((carpeta) => {
      const prefijo = '— '.repeat(profundidad);
      opciones.push({ id: carpeta.id, texto: `${prefijo}${carpeta.nombre}` });
      agregarNivel(carpeta.id, profundidad + 1);
    });
  }
  agregarNivel(null, 0);

  if (opciones.length === 0) {
    selector.innerHTML = '<option value="">No hay carpetas creadas todavía</option>';
    return;
  }

  selector.innerHTML = opciones
    .map((op) => `<option value="${op.id}">${op.texto}</option>`)
    .join('');
}

// Convierte un archivo a base64 puro (sin el prefijo "data:...;base64,")
function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result;
      const base64 = resultado.split(',')[1];
      resolve(base64);
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

// Genera un nombre de archivo "seguro" para la URL (sin espacios ni tildes)
function slugificar(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function subirArchivoAGithub({ token, owner, repo, carpetaId, titulo, archivo }) {
  const extension = archivo.name.split('.').pop();
  const nombreSlug = slugificar(titulo) || 'material';
  const marcaTiempo = Date.now();
  const ruta = `material/carpeta-${carpetaId}/${nombreSlug}-${marcaTiempo}.${extension}`;

  const contenidoBase64 = await archivoABase64(archivo);

  const respuesta = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${ruta}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Subir material: ${titulo}`,
      content: contenidoBase64,
      branch: 'main',
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}));
    throw new Error(`GitHub rechazó la subida (${respuesta.status}): ${detalle.message || 'sin detalle'}`);
  }

  // La URL pública, servida por jsDelivr (no por raw.githubusercontent.com)
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${ruta}`;
}

async function registrarEnSupabase({ adminClave, carpetaId, titulo, categoria, archivoUrl }) {
  const respuesta = await fetch('/api/registrar-apuntec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminClave,
      carpetaId: Number(carpetaId),
      titulo,
      categoria,
      archivoUrl,
    }),
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(resultado.error || `Error al registrar en la base de datos (${respuesta.status})`);
  }

  return resultado;
}

function actualizarProgreso(porcentaje, texto) {
  const cont = document.getElementById('cont-progreso');
  const barra = document.getElementById('barra-progreso');
  cont.style.display = 'block';
  barra.style.width = `${porcentaje}%`;
  document.getElementById('mensaje-estado-admin').textContent = texto;
}

document.addEventListener('DOMContentLoaded', () => {
  cargarCarpetasEnSelector();

  const form = document.getElementById('form-subir-apuntec');
  const mensaje = document.getElementById('mensaje-estado-admin');
  const boton = document.getElementById('btn-subir');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = document.getElementById('input-github-token').value.trim();
    const owner = document.getElementById('input-github-owner').value.trim();
    const repo = document.getElementById('input-github-repo').value.trim();
    const adminClave = document.getElementById('input-admin-clave').value;
    const carpetaId = document.getElementById('select-carpeta').value;
    const titulo = document.getElementById('input-titulo').value.trim();
    const categoria = document.getElementById('input-categoria').value.trim();
    const archivo = document.getElementById('input-archivo').files[0];

    if (!token || !owner || !repo || !adminClave) {
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = 'Completá las credenciales de la sesión antes de subir.';
      return;
    }
    if (!carpetaId || !titulo || !categoria || !archivo) {
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = 'Completá carpeta, título, categoría y archivo.';
      return;
    }

    boton.disabled = true;
    mensaje.style.color = 'var(--texto-mutado)';

    try {
      actualizarProgreso(30, 'Subiendo archivo a GitHub...');
      const archivoUrl = await subirArchivoAGithub({ token, owner, repo, carpetaId, titulo, archivo });

      actualizarProgreso(70, 'Registrando en la base de datos...');
      await registrarEnSupabase({ adminClave, carpetaId, titulo, categoria, archivoUrl });

      actualizarProgreso(100, '✔ Material subido y publicado correctamente.');
      mensaje.style.color = 'var(--celeste)';
      form.reset();
    } catch (error) {
      console.error(error);
      document.getElementById('cont-progreso').style.display = 'none';
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = `Error: ${error.message}`;
    } finally {
      boton.disabled = false;
    }
  });
});
