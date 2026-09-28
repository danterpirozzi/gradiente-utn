// ===========================================
// GRADIENTE UTN — Gestionar material publicado
// ===========================================
// Buscar funciona con la clave pública (leer material 'aprobado' ya es
// público). Editar y Eliminar sí necesitan la clave de admin, porque tocan
// la base de datos con la service_role key del lado del servidor. Eliminar
// además borra el archivo real en GitHub, directo desde el navegador con el
// token del admin (mismo motivo de siempre: evitar el límite de tamaño de
// las funciones serverless de Vercel).

let carpetasCacheGestion = [];
let resultadosActuales = [];
let temporizadorBusquedaGestion = null;

async function cargarCarpetasCacheGestion() {
  const { data } = await supabaseClient
    .from('carpetas')
    .select('*')
    .eq('seccion', 'apuntec');
  carpetasCacheGestion = data || [];
}

function rutaCompletaGestion(carpetaId) {
  const porId = {};
  carpetasCacheGestion.forEach((c) => { porId[c.id] = c; });
  const partes = [];
  let actual = porId[carpetaId];
  while (actual) {
    partes.unshift(actual.nombre);
    actual = actual.carpeta_padre_id ? porId[actual.carpeta_padre_id] : null;
  }
  return partes.join(' / ') || '(carpeta desconocida)';
}

// Extrae la rama y la ruta de un archivo dentro del repo a partir de su URL
// de jsDelivr, para poder borrarlo vía la API de GitHub.
function extraerRutaGithub(url, owner, repo) {
  const marcador = `/gh/${owner}/${repo}@`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;

  const resto = url.slice(indice + marcador.length);
  const primeraBarra = resto.indexOf('/');
  if (primeraBarra === -1) return null;

  return { rama: resto.slice(0, primeraBarra), ruta: resto.slice(primeraBarra + 1) };
}

async function buscarMaterialGestion(consulta) {
  const contenedor = document.getElementById('resultados-gestion');
  mostrarSkeleton(contenedor, 4);

  const textoBusqueda = consulta.replace(/[%,]/g, '');
  const { data, error } = await supabaseClient
    .from('apuntec')
    .select('*')
    .eq('estado', 'aprobado')
    .or(`titulo.ilike.%${textoBusqueda}%,materia.ilike.%${textoBusqueda}%,categoria.ilike.%${textoBusqueda}%`)
    .order('titulo')
    .limit(30);

  if (error) {
    contenedor.innerHTML = '<p style="color: var(--rosa);">Error al buscar.</p>';
    return;
  }

  resultadosActuales = data || [];
  renderizarResultadosGestion();
}

function renderizarResultadosGestion() {
  const contenedor = document.getElementById('resultados-gestion');

  if (resultadosActuales.length === 0) {
    contenedor.innerHTML = '<p>No se encontró nada con esa búsqueda.</p>';
    return;
  }

  contenedor.innerHTML = resultadosActuales.map((item) => `
    <article class="tarjeta-material" data-id="${item.id}" data-carpeta-id="${item.carpeta_id}">
      <p class="ruta-carpeta">📁 <span class="texto-ruta-carpeta">${escaparHtml(rutaCompletaGestion(item.carpeta_id))}</span></p>

      <div class="fila-editable">
        <input type="text" class="campo-admin campo-titulo" value="${escaparHtml(item.titulo)}" placeholder="Título">
        <input type="text" class="campo-admin campo-materia" value="${escaparHtml(item.materia)}" placeholder="Materia">
      </div>
      <div class="fila-editable">
        <input type="text" class="campo-admin campo-carrera" value="${escaparHtml(item.carrera || '')}" placeholder="Carrera (opcional)">
        <input type="text" class="campo-admin campo-categoria" value="${escaparHtml(item.categoria)}" placeholder="Categoría">
      </div>

      <p style="font-size: 0.78rem;"><a href="${item.archivo_url}" target="_blank" rel="noopener noreferrer" style="color: var(--celeste);">Ver archivo actual →</a></p>

      <div class="fila-acciones-material">
        <button type="button" class="btn-guardar" data-accion="guardar">Guardar cambios</button>
        <button type="button" class="btn-mover" data-accion="mover">Mover de carpeta</button>
        <button type="button" class="btn-eliminar" data-accion="eliminar">Eliminar</button>
        <span class="mensaje-material" style="font-size: 0.85rem; font-weight: 600;"></span>
      </div>
    </article>
  `).join('');

  contenedor.querySelectorAll('[data-accion="guardar"]').forEach((b) => b.addEventListener('click', () => guardarCambiosMaterial(b)));
  contenedor.querySelectorAll('[data-accion="mover"]').forEach((b) => b.addEventListener('click', () => moverMaterial(b)));
  contenedor.querySelectorAll('[data-accion="eliminar"]').forEach((b) => b.addEventListener('click', () => eliminarMaterial(b)));
}

async function guardarCambiosMaterial(boton) {
  const tarjeta = boton.closest('.tarjeta-material');
  const mensaje = tarjeta.querySelector('.mensaje-material');
  const id = tarjeta.dataset.id;

  const adminClave = document.getElementById('input-admin-clave').value;
  if (!adminClave) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Falta la clave de administración de arriba.';
    return;
  }

  const titulo = tarjeta.querySelector('.campo-titulo').value.trim();
  const materia = tarjeta.querySelector('.campo-materia').value.trim();
  const carrera = tarjeta.querySelector('.campo-carrera').value.trim();
  const categoria = tarjeta.querySelector('.campo-categoria').value.trim();
  const carpetaId = Number(tarjeta.dataset.carpetaId);

  if (!titulo || !materia || !categoria) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Título, materia y categoría no pueden quedar vacíos.';
    return;
  }

  boton.disabled = true;
  mensaje.style.color = 'var(--texto-mutado)';
  mensaje.textContent = 'Guardando...';

  try {
    const respuesta = await fetch('/api/editar-apuntec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminClave, id, titulo, materia, carrera, categoria, carpetaId }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || 'Error al guardar');

    mensaje.style.color = 'var(--celeste)';
    mensaje.textContent = '✔ Guardado';
  } catch (error) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = `Error: ${error.message}`;
  } finally {
    boton.disabled = false;
  }
}

function moverMaterial(boton) {
  const tarjeta = boton.closest('.tarjeta-material');

  abrirSelectorCarpetasModal('apuntec', (carpetaElegida) => {
    tarjeta.dataset.carpetaId = carpetaElegida.id;
    tarjeta.querySelector('.texto-ruta-carpeta').textContent = carpetaElegida.ruta;

    const mensaje = tarjeta.querySelector('.mensaje-material');
    mensaje.style.color = 'var(--celeste)';
    mensaje.textContent = 'Carpeta actualizada — no olvides apretar "Guardar cambios" para confirmarlo.';
  });
}

async function eliminarMaterial(boton) {
  const tarjeta = boton.closest('.tarjeta-material');
  const mensaje = tarjeta.querySelector('.mensaje-material');
  const id = tarjeta.dataset.id;
  const item = resultadosActuales.find((r) => String(r.id) === id);

  const adminClave = document.getElementById('input-admin-clave').value;
  const token = document.getElementById('input-github-token').value.trim();
  const owner = document.getElementById('input-github-owner').value.trim();
  const repo = document.getElementById('input-github-repo').value.trim();

  if (!adminClave || !token || !owner || !repo) {
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Para eliminar hacen falta las 4 credenciales de arriba (clave + token de GitHub).';
    return;
  }

  if (!confirm(`¿Seguro que querés eliminar "${item.titulo}"? Esto borra el archivo de GitHub y no se puede deshacer.`)) return;

  tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = true));
  mensaje.style.color = 'var(--texto-mutado)';
  mensaje.textContent = 'Buscando el archivo en GitHub...';

  try {
    const info = extraerRutaGithub(item.archivo_url, owner, repo);

    if (info) {
      const respuestaGet = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${info.ruta}?ref=${info.rama}`,
        { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' } }
      );

      if (respuestaGet.ok) {
        const datosArchivo = await respuestaGet.json();
        mensaje.textContent = 'Borrando de GitHub...';

        const respuestaDelete = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${info.ruta}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Eliminar material: ${item.titulo}`,
            sha: datosArchivo.sha,
            branch: info.rama,
          }),
        });

        if (!respuestaDelete.ok) {
          const detalle = await respuestaDelete.json().catch(() => ({}));
          throw new Error(`No se pudo borrar el archivo de GitHub: ${detalle.message || respuestaDelete.status}`);
        }
      } else if (respuestaGet.status !== 404) {
        throw new Error('No se pudo verificar el archivo en GitHub antes de borrar.');
      }
      // Si da 404, el archivo ya no existe en GitHub — seguimos igual para borrar la fila
    }

    mensaje.textContent = 'Borrando de la base de datos...';
    const respuestaRegistro = await fetch('/api/eliminar-apuntec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminClave, id }),
    });
    const resultado = await respuestaRegistro.json();
    if (!respuestaRegistro.ok) throw new Error(resultado.error || 'Error al eliminar de la base de datos');

    resultadosActuales = resultadosActuales.filter((r) => String(r.id) !== id);
    tarjeta.style.opacity = '0.5';
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = 'Eliminado';
    setTimeout(() => tarjeta.remove(), 700);
  } catch (error) {
    console.error(error);
    mensaje.style.color = 'var(--rosa)';
    mensaje.textContent = `Error: ${error.message}`;
    tarjeta.querySelectorAll('button').forEach((b) => (b.disabled = false));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarCarpetasCacheGestion();

  const buscador = document.getElementById('buscador-gestion');
  buscador.addEventListener('input', () => {
    clearTimeout(temporizadorBusquedaGestion);
    const consulta = buscador.value.trim();

    temporizadorBusquedaGestion = setTimeout(() => {
      if (consulta.length >= 2) {
        buscarMaterialGestion(consulta);
      } else {
        document.getElementById('resultados-gestion').innerHTML = '';
      }
    }, 350);
  });
});
