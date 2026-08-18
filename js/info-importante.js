// ===========================================
// GRADIENTE UTN — Info importante (con carpetas anidadas)
// ===========================================

// Guardamos en qué carpeta estamos parados. null = raíz (primer nivel)
let carpetaActualId = null;

// Guardamos el "camino" de carpetas para mostrar las migas de pan (breadcrumb)
// Ej: [ {id: 3, nombre: "Ingeniería en Sistemas"}, {id: 8, nombre: "Plan de estudios"} ]
let caminoCarpetas = [];

async function cargarInfoImportante() {
  const contenedor = document.getElementById('lista-info');
  mostrarSkeleton(contenedor, 6);

  // Pedimos, en paralelo, las subcarpetas Y los ítems de la carpeta actual.
  // "is('carpeta_padre_id', null)" cuando estamos en la raíz, o "eq(...)" si estamos adentro de una carpeta
  const filtroCarpetas = carpetaActualId === null
    ? supabaseClient.from('carpetas').select('*').eq('seccion', 'info_importante').is('carpeta_padre_id', null).order('orden')
    : supabaseClient.from('carpetas').select('*').eq('seccion', 'info_importante').eq('carpeta_padre_id', carpetaActualId).order('orden');

  const filtroItems = carpetaActualId === null
    ? supabaseClient.from('info_importante').select('*').is('carpeta_id', null).order('orden')
    : supabaseClient.from('info_importante').select('*').eq('carpeta_id', carpetaActualId).order('orden');

  const [{ data: subcarpetas, error: errorCarpetas }, { data: items, error: errorItems }] =
    await Promise.all([filtroCarpetas, filtroItems]);

  if (errorCarpetas || errorItems) {
    console.error('Error al cargar info importante:', errorCarpetas || errorItems);
    contenedor.innerHTML = '<p>No se pudo cargar la información.</p>';
    return;
  }

  renderizarBreadcrumb();
  renderizarContenido(subcarpetas || [], items || []);
}

function renderizarBreadcrumb() {
  const contenedor = document.getElementById('breadcrumb');

  let html = `<a href="#" data-id="raiz">Info importante</a>`;
  caminoCarpetas.forEach((carpeta) => {
    html += ` / <a href="#" data-id="${carpeta.id}">${carpeta.nombre}</a>`;
  });
  contenedor.innerHTML = html;

  // Click en cualquier eslabón del camino te lleva directo a esa carpeta
  contenedor.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.id;
      if (id === 'raiz') {
        irARaiz();
      } else {
        const idNum = Number(id);
        const indice = caminoCarpetas.findIndex((c) => c.id === idNum);
        caminoCarpetas = caminoCarpetas.slice(0, indice + 1);
        carpetaActualId = idNum;
        cargarInfoImportante();
      }
    });
  });
}

function renderizarContenido(subcarpetas, items) {
  const contenedor = document.getElementById('lista-info');
  contenedor.innerHTML = '';

  if (subcarpetas.length === 0 && items.length === 0) {
    contenedor.innerHTML = '<p>Esta carpeta está vacía.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid-cards';

  // Primero mostramos las carpetas (para que se vean arriba, como en cualquier explorador)
  subcarpetas.forEach((carpeta) => {
    const tarjeta = document.createElement('a');
    tarjeta.href = '#';
    tarjeta.className = 'card';
    tarjeta.innerHTML = `<h3>📁 ${carpeta.nombre}</h3>`;
    tarjeta.addEventListener('click', (e) => {
      e.preventDefault();
      entrarACarpeta(carpeta);
    });
    grid.appendChild(tarjeta);
  });

  // Después los ítems sueltos (archivos/links) de esta carpeta
  items.forEach((item) => {
    const tarjeta = document.createElement(item.archivo_url ? 'a' : 'div');
    tarjeta.className = 'card card-item';
    if (item.archivo_url) {
      tarjeta.href = item.archivo_url;
      tarjeta.target = '_blank';
      tarjeta.rel = 'noopener noreferrer';
    }
    tarjeta.innerHTML = `
      <h3>📄 ${item.titulo}</h3>
      <p>${item.descripcion ?? ''}</p>
    `;
    grid.appendChild(tarjeta);
  });

  contenedor.appendChild(grid);
}

function entrarACarpeta(carpeta) {
  caminoCarpetas.push({ id: carpeta.id, nombre: carpeta.nombre });
  carpetaActualId = carpeta.id;
  cargarInfoImportante();
}

function irARaiz() {
  caminoCarpetas = [];
  carpetaActualId = null;
  cargarInfoImportante();
}

document.addEventListener('DOMContentLoaded', cargarInfoImportante);
