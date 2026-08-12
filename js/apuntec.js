// ===========================================
// GRADIENTE UTN — APUNTEC (con carpetas anidadas)
// ===========================================
// Mismo patrón que info-importante.js, pero filtrando siempre
// las carpetas con seccion = 'apuntec', para no mezclarse con
// las carpetas de Info Importante.

let carpetaActualIdApuntec = null;
let caminoCarpetasApuntec = [];

async function cargarApuntec() {
  const contenedor = document.getElementById('lista-apuntec');
  mostrarSkeleton(contenedor, 6);

  const filtroCarpetas = carpetaActualIdApuntec === null
    ? supabaseClient.from('carpetas').select('*').eq('seccion', 'apuntec').is('carpeta_padre_id', null).order('orden')
    : supabaseClient.from('carpetas').select('*').eq('seccion', 'apuntec').eq('carpeta_padre_id', carpetaActualIdApuntec).order('orden');

  const filtroItems = carpetaActualIdApuntec === null
    ? supabaseClient.from('apuntec').select('*').is('carpeta_id', null).eq('estado', 'aprobado').order('titulo')
    : supabaseClient.from('apuntec').select('*').eq('carpeta_id', carpetaActualIdApuntec).eq('estado', 'aprobado').order('titulo');

  const [{ data: subcarpetas, error: errorCarpetas }, { data: items, error: errorItems }] =
    await Promise.all([filtroCarpetas, filtroItems]);

  if (errorCarpetas || errorItems) {
    console.error('Error al cargar apuntec:', errorCarpetas || errorItems);
    contenedor.innerHTML = '<p>No se pudo cargar el material.</p>';
    return;
  }

  renderizarBreadcrumbApuntec();
  renderizarContenidoApuntec(subcarpetas || [], items || []);
}

function renderizarBreadcrumbApuntec() {
  const contenedor = document.getElementById('breadcrumb-apuntec');

  let html = `<a href="#" data-id="raiz">APUNTEC</a>`;
  caminoCarpetasApuntec.forEach((carpeta) => {
    html += ` / <a href="#" data-id="${carpeta.id}">${carpeta.nombre}</a>`;
  });
  contenedor.innerHTML = html;

  contenedor.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.id;
      if (id === 'raiz') {
        irARaizApuntec();
      } else {
        const idNum = Number(id);
        const indice = caminoCarpetasApuntec.findIndex((c) => c.id === idNum);
        caminoCarpetasApuntec = caminoCarpetasApuntec.slice(0, indice + 1);
        carpetaActualIdApuntec = idNum;
        cargarApuntec();
      }
    });
  });
}

function renderizarContenidoApuntec(subcarpetas, items) {
  const contenedor = document.getElementById('lista-apuntec');
  contenedor.innerHTML = '';

  if (subcarpetas.length === 0 && items.length === 0) {
    contenedor.innerHTML = '<p>Esta carpeta está vacía.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid-cards';

  subcarpetas.forEach((carpeta) => {
    const tarjeta = document.createElement('a');
    tarjeta.href = '#';
    tarjeta.className = 'card';
    tarjeta.innerHTML = `<h3>📁 ${carpeta.nombre}</h3>`;
    tarjeta.addEventListener('click', (e) => {
      e.preventDefault();
      caminoCarpetasApuntec.push({ id: carpeta.id, nombre: carpeta.nombre });
      carpetaActualIdApuntec = carpeta.id;
      cargarApuntec();
    });
    grid.appendChild(tarjeta);
  });

  items.forEach((item) => {
    const tarjeta = document.createElement(item.archivo_url ? 'a' : 'div');
    tarjeta.className = 'card';
    if (item.archivo_url) {
      tarjeta.href = item.archivo_url;
      tarjeta.target = '_blank';
      tarjeta.rel = 'noopener noreferrer';
    }
    tarjeta.innerHTML = `<h3>📄 ${item.titulo}</h3>`;
    grid.appendChild(tarjeta);
  });

  contenedor.appendChild(grid);
}

function irARaizApuntec() {
  caminoCarpetasApuntec = [];
  carpetaActualIdApuntec = null;
  cargarApuntec();
}

document.addEventListener('DOMContentLoaded', cargarApuntec);
