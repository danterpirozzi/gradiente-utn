// ===========================================
// GRADIENTE UTN — Panel de revisión de propuestas
// ===========================================
// Mismo espíritu que admin-apuntec.js: el archivo (al aprobar) se sube a
// GitHub directo desde el navegador, nunca pasa por Vercel. Las funciones
// serverless (/api/listar-propuestas y /api/gestionar-propuesta) solo mueven
// texto (usan la service_role key para saltarse las políticas RLS que
// bloquean la lectura pública de filas 'pendiente').

let carpetasCache = [];

async function cargarListaDeCarpetas() {
  const { data } = await supabaseClient
    .from('carpetas')
    .select('*')
    .eq('seccion', 'apuntec')
    .order('orden');
  carpetasCache = data || [];
}

function opcionesDeCarpetaHtml(carpetaSeleccionadaId) {
  const porPadre = {};
  carpetasCache.forEach((c) => {
    const clave = c.carpeta_padre_id ?? 'raiz';
    if (!porPadre[clave]) porPadre[clave] = [];
    porPadre[clave].push(c);
  });

  const opciones = [];
  function agregarNivel(padreId, profundidad) {
    const hijas = porPadre[padreId ?? 'raiz'] || [];
    hijas.forEach((carpeta) => {
      const prefijo = '— '.repeat(profundidad);
      const seleccionado = carpeta.id === carpetaSeleccionadaId ? 'selected' : '';
      opciones.push(`<option value="${carpeta.id}" ${seleccionado}>${prefijo}${carpeta.nombre}</option>`);
      agregarNivel(carpeta.id, profundidad + 1);
    });
  }
  agregarNivel(null, 0);
  return opciones.join('');
}

function slugificarAdmin(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function subirBlobAGithub({ token, owner, repo, carpetaId, titulo, blob, nombreArchivoOriginal }) {
  const extension = (nombreArchivoOriginal.split('.').pop() || 'pdf');
  const nombreSlug = slugificarAdmin(titulo) || 'material';
  const ruta = `material/carpeta-${carpetaId}/${nombreSlug}-${Date.now()}.${extension}`;

  const contenidoBase64 = await new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result.split(',')[1]);
    lector.onerror = reject;
    lector.readAsDataURL(blob);
  });

  const respuesta = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${ruta}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Aprobar propuesta: ${titulo}`,
      content: contenidoBase64,
      branch: 'main',
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}));
    throw new Error(`GitHub rechazó la subida (${respuesta.status}): ${detalle.message || 'sin detalle'}`);
  }

  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${ruta}`;
}

function renderizarPropuestas(propuestas) {
  const contenedor = document.getElementById('lista-propuestas');

  if (propuestas.length === 0) {
    contenedor.innerHTML = '<p>No hay propuestas pendientes por ahora. 🎉</p>';
    return;
  }

  contenedor.innerHTML = propuestas.map((p) => `
    <article class="tarjeta-propuesta" data-id="${p.id}">
      <h3>${p.titulo}</h3>
      <dl>
        <dt>Materia</dt><dd>${p.materia}${p.carrera ? ` (${p.carrera})` : ''}</dd>
        <dt>Categoría</dt><dd>${p.categoria}</dd>
        <dt>Propuesto por</dt><dd>${p.propuesto_por_nombre || 'sin nombre'}${p.propuesto_por_email ? ` — ${p.propuesto_por_email}` : ''}</dd>
        <dt>Fecha</dt><dd>${new Date(p.creado_en).toLocaleDateString('es-AR')}</dd>
        <dt>Archivo</dt><dd><a href="${p.urlFirmada}" target="_blank" rel="noopener noreferrer" class="btn-ver">Ver / descargar PDF →</a></dd>
      </dl>

      <label style="display: block; font-size: 0.85rem;">
        Carpeta destino
        <select class="campo-admin selector-carpeta-propuesta" style="margin-top: 0.3rem;">
          ${opcionesDeCarpetaHtml(p.carpeta_id)}
        </select>
      </label>

      <div class="fila-acciones">
        <button type="button" class="btn-aprobar" data-accion="aprobar">Aprobar y publicar</button>
        <button type="button" class="btn-rechazar" data-accion="rechazar">Rechazar</button>
        <span class="mensaje-propuesta" style="font-size: 0.85rem; font-weight: 600;"></span>
      </div>
    </article>
  `).join('');

  contenedor.querySelectorAll('.btn-aprobar').forEach((boton) => {
    boton.addEventListener('click', () => manejarAprobar(boton));
  });
  contenedor.querySelectorAll('.btn-rechazar').forEach((boton) => {
    boton.addEventListener('click', () => manejarRechazar(boton));
  });
}

async function manejarAprobar(boton) {
  const tarjeta = boton.closest('.tarjeta-propuesta');
  const mensaje = tarjeta.querySelector('.mensaje-propuesta');
  const id = tarjeta.dataset.id;
  const propuesta = window.PROPUESTAS_ACTUALES.find((p) => String(p.id) === id);
  const carpetaId = tarjeta.querySelector('.selector-carpeta-propuesta').value;

  const token = document.getElementById('input-github-token').value.trim();
  const owner = document.getElementById('input-github-owner').value.trim();
  const repo = document.getElementById('input-github-repo').value.trim();
  const adminClave = document.getElementById('input-admin-clave').value;

  if (!token || !owner || !repo || !adminClave) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Faltan las credenciales de arriba.';
    return;
  }

  tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = true));
  mensaje.style.color = 'var(--texto-mutado)';
  mensaje.textContent = 'Descargando archivo...';

  try {
    const respuestaArchivo = await fetch(propuesta.urlFirmada);
    if (!respuestaArchivo.ok) throw new Error('No se pudo descargar el archivo desde Storage');
    const blob = await respuestaArchivo.blob();

    mensaje.textContent = 'Subiendo a GitHub...';
    const archivoUrl = await subirBlobAGithub({
      token, owner, repo,
      carpetaId,
      titulo: propuesta.titulo,
      blob,
      nombreArchivoOriginal: propuesta.archivo_url,
    });

    mensaje.textContent = 'Publicando...';
    const respuesta = await fetch('/api/gestionar-propuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminClave,
        accion: 'aprobar',
        id: propuesta.id,
        carpetaId: Number(carpetaId),
        archivoUrl,
        rutaStorage: propuesta.archivo_url,
      }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || 'Error al publicar');

    tarjeta.style.opacity = '0.5';
    mensaje.style.color = 'var(--celeste)';
    mensaje.textContent = '✔ Publicado';
    setTimeout(() => tarjeta.remove(), 900);
  } catch (error) {
    console.error(error);
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = `Error: ${error.message}`;
    tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = false));
  }
}

async function manejarRechazar(boton) {
  const tarjeta = boton.closest('.tarjeta-propuesta');
  const mensaje = tarjeta.querySelector('.mensaje-propuesta');
  const id = tarjeta.dataset.id;
  const propuesta = window.PROPUESTAS_ACTUALES.find((p) => String(p.id) === id);

  const adminClave = document.getElementById('input-admin-clave').value;
  if (!adminClave) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Falta la clave de administración de arriba.';
    return;
  }

  if (!confirm(`¿Seguro que querés rechazar "${propuesta.titulo}"? Se borra la propuesta y el archivo.`)) return;

  tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = true));
  mensaje.style.color = 'var(--texto-mutado)';
  mensaje.textContent = 'Rechazando...';

  try {
    const respuesta = await fetch('/api/gestionar-propuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminClave,
        accion: 'rechazar',
        id: propuesta.id,
        rutaStorage: propuesta.archivo_url,
      }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || 'Error al rechazar');

    tarjeta.style.opacity = '0.5';
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Rechazado';
    setTimeout(() => tarjeta.remove(), 700);
  } catch (error) {
    console.error(error);
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = `Error: ${error.message}`;
    tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = false));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const boton = document.getElementById('btn-cargar-propuestas');

  boton.addEventListener('click', async () => {
    const adminClave = document.getElementById('input-admin-clave').value;
    if (!adminClave) {
      alert('Completá la clave de administración primero.');
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Cargando...';
    document.getElementById('lista-propuestas').innerHTML = '<p>Cargando propuestas...</p>';

    try {
      await cargarListaDeCarpetas();

      const respuesta = await fetch('/api/listar-propuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminClave }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error || 'Error al listar propuestas');

      window.PROPUESTAS_ACTUALES = resultado.propuestas;
      renderizarPropuestas(resultado.propuestas);
    } catch (error) {
      console.error(error);
      document.getElementById('lista-propuestas').innerHTML = `<p style="color: var(--rosa);">Error: ${error.message}</p>`;
    } finally {
      boton.disabled = false;
      boton.textContent = 'Cargar propuestas pendientes';
    }
  });
});
