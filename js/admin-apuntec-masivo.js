// ===========================================
// GRADIENTE UTN — Carga masiva de APUNTEC
// ===========================================
// Mismo circuito que admin-apuntec.js (archivo va directo del navegador a
// GitHub, después se registra en Supabase vía /api/registrar-apuntec), pero
// repetido en secuencia para varios archivos que comparten carpeta, materia,
// carrera y categoría — pensado para cargar de una vez todo el material
// viejo que ya tienen guardado.
//
// Se procesa uno por uno (no en paralelo) para no saturar la API de GitHub
// y para poder mostrar el progreso archivo por archivo. Si uno falla, se
// sigue con el resto del lote — al final se muestra un resumen de qué
// se subió bien y qué no, para reintentar solo lo que falló.

let archivosDelLote = []; // [{ archivo, tituloSugerido, id }]

function slugificarLote(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Convierte "resumen_unidad-3_final.pdf" en "resumen unidad 3 final"
function tituloDesdeNombreDeArchivo(nombreArchivo) {
  const sinExtension = nombreArchivo.replace(/\.[^/.]+$/, '');
  const conEspacios = sinExtension.replace(/[_-]+/g, ' ').trim();
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}

// La carga de carpetas ahora la maneja js/selector-carpetas.js.

function renderizarListaDeArchivos() {
  const contenedor = document.getElementById('lista-archivos');

  if (archivosDelLote.length === 0) {
    contenedor.innerHTML = '<p style="color: var(--texto-mutado); font-size: 0.9rem;">Todavía no elegiste archivos.</p>';
    return;
  }

  contenedor.innerHTML = archivosDelLote.map((entrada) => `
    <div class="fila-archivo" data-id="${entrada.id}">
      <input type="text" class="campo-admin input-titulo-lote" value="${entrada.tituloSugerido.replace(/"/g, '&quot;')}">
      <span class="nombre-original" title="${entrada.archivo.name}">${entrada.archivo.name} (${(entrada.archivo.size / 1024 / 1024).toFixed(1)}MB)</span>
      <span class="estado-fila" style="color: var(--texto-mutado);">Pendiente</span>
      <button type="button" class="btn-quitar" title="Quitar del lote">✕</button>
    </div>
  `).join('');

  contenedor.querySelectorAll('.btn-quitar').forEach((boton) => {
    boton.addEventListener('click', () => {
      const id = boton.closest('.fila-archivo').dataset.id;
      archivosDelLote = archivosDelLote.filter((e) => e.id !== id);
      renderizarListaDeArchivos();
    });
  });
}

async function subirUnArchivoDelLote({ token, owner, repo, carpetaId, titulo, archivo }) {
  const extension = archivo.name.split('.').pop();
  const nombreSlug = slugificarLote(titulo) || 'material';
  const ruta = `material/carpeta-${carpetaId}/${nombreSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

  const contenidoBase64 = await new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result.split(',')[1]);
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });

  const respuestaGithub = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${ruta}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Subir material (lote): ${titulo}`,
      content: contenidoBase64,
      branch: 'main',
    }),
  });

  if (!respuestaGithub.ok) {
    const detalle = await respuestaGithub.json().catch(() => ({}));
    throw new Error(`GitHub: ${detalle.message || respuestaGithub.status}`);
  }

  const archivoUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${ruta}`;

  const respuestaRegistro = await fetch('/api/registrar-apuntec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminClave: document.getElementById('input-admin-clave').value,
      carpetaId: Number(carpetaId),
      materia: document.getElementById('input-materia').value.trim(),
      carrera: document.getElementById('input-carrera').value.trim() || null,
      titulo,
      categoria: document.getElementById('input-categoria').value.trim(),
      archivoUrl,
    }),
  });

  const resultado = await respuestaRegistro.json().catch(() => ({}));
  if (!respuestaRegistro.ok) {
    throw new Error(resultado.error || `Supabase (${respuestaRegistro.status})`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('input-archivos').addEventListener('change', (e) => {
    const nuevos = Array.from(e.target.files).map((archivo, indice) => ({
      archivo,
      tituloSugerido: tituloDesdeNombreDeArchivo(archivo.name),
      id: `${Date.now()}-${indice}`,
    }));
    archivosDelLote = archivosDelLote.concat(nuevos);
    renderizarListaDeArchivos();
  });

  document.getElementById('btn-subir-lote').addEventListener('click', async () => {
    const token = document.getElementById('input-github-token').value.trim();
    const owner = document.getElementById('input-github-owner').value.trim();
    const repo = document.getElementById('input-github-repo').value.trim();
    const adminClave = document.getElementById('input-admin-clave').value;
    const carpetaId = document.getElementById('select-carpeta').value;
    const materia = document.getElementById('input-materia').value.trim();
    const categoria = document.getElementById('input-categoria').value.trim();

    const resumen = document.getElementById('resumen-lote');
    const botonSubir = document.getElementById('btn-subir-lote');

    if (!token || !owner || !repo || !adminClave) {
      resumen.style.color = 'var(--rosa)';
      resumen.textContent = 'Completá las credenciales de la sesión antes de subir.';
      return;
    }
    if (!carpetaId || !materia || !categoria) {
      resumen.style.color = 'var(--rosa)';
      resumen.textContent = 'Completá carpeta, materia y categoría (son compartidas por todo el lote).';
      return;
    }
    if (archivosDelLote.length === 0) {
      resumen.style.color = 'var(--rosa)';
      resumen.textContent = 'Elegí al menos un archivo.';
      return;
    }

    // Tomamos el título editado de cada fila (por si el admin lo corrigió)
    document.querySelectorAll('.fila-archivo').forEach((fila) => {
      const id = fila.dataset.id;
      const entrada = archivosDelLote.find((e) => e.id === id);
      if (entrada) entrada.tituloSugerido = fila.querySelector('.input-titulo-lote').value.trim();
    });

    botonSubir.disabled = true;
    let exitosos = 0;
    let fallidos = 0;
    const idsExitosos = [];

    for (const entrada of archivosDelLote) {
      const fila = document.querySelector(`.fila-archivo[data-id="${entrada.id}"] .estado-fila`);
      fila.textContent = 'Subiendo...';
      fila.style.color = 'var(--celeste)';

      try {
        await subirUnArchivoDelLote({
          token, owner, repo,
          carpetaId,
          titulo: entrada.tituloSugerido,
          archivo: entrada.archivo,
        });
        fila.textContent = '✔ Listo';
        fila.style.color = 'var(--celeste)';
        idsExitosos.push(entrada.id);
        exitosos++;
      } catch (error) {
        console.error(entrada.archivo.name, error);
        fila.textContent = `✕ ${error.message}`;
        fila.style.color = 'var(--rosa)';
        fallidos++;
      }

      resumen.style.color = 'var(--texto-mutado)';
      resumen.textContent = `Procesando... ${exitosos + fallidos}/${archivosDelLote.length}`;
    }

    // Sacamos del lote los que ya subieron bien: si el admin reintenta
    // (por los que fallaron), no se vuelven a subir duplicados
    archivosDelLote = archivosDelLote.filter((e) => !idsExitosos.includes(e.id));

    botonSubir.disabled = false;
    resumen.style.color = fallidos === 0 ? 'var(--celeste)' : 'var(--rosa)';
    resumen.textContent = `Listo: ${exitosos} subidos correctamente, ${fallidos} con error.` +
      (fallidos > 0 ? ' Los que fallaron siguen tildados en rojo arriba — corregilos y volvé a intentar solo esos.' : '');
  });
});
