// ===========================================
// GRADIENTE UTN — APUNTEC (conectado a Supabase)
// ===========================================

let materialApuntec = []; // guardamos todo acá para poder filtrar sin volver a pedir a Supabase

async function cargarApuntec() {
  const { data, error } = await supabaseClient
    .from('apuntec')
    .select('*')
    .order('materia', { ascending: true });

  if (error) {
    console.error('Error al cargar apuntec:', error);
    document.getElementById('lista-apuntec').innerHTML = '<p>No se pudo cargar el material.</p>';
    return;
  }

  materialApuntec = data || [];
  renderizarApuntec(materialApuntec);
}

function renderizarApuntec(items) {
  const contenedor = document.getElementById('lista-apuntec');
  contenedor.innerHTML = '';

  if (items.length === 0) {
    contenedor.innerHTML = '<p>No se encontró material con ese filtro.</p>';
    return;
  }

  // Agrupamos por categoría para mantener las 3 secciones del documento de requisitos
  const categorias = ['Parciales y finales', 'Resúmenes', 'Libros y apuntes'];

  categorias.forEach((categoria) => {
    const items_categoria = items.filter((i) => i.categoria === categoria);
    if (items_categoria.length === 0) return;

    const titulo = document.createElement('h2');
    titulo.textContent = categoria;
    titulo.style.marginTop = '2rem';
    contenedor.appendChild(titulo);

    const grid = document.createElement('section');
    grid.className = 'grid-cards';

    items_categoria.forEach((item) => {
      const tarjeta = document.createElement(item.archivo_url ? 'a' : 'div');
      tarjeta.className = 'card';
      if (item.archivo_url) {
        tarjeta.href = item.archivo_url;
        tarjeta.target = '_blank';
        tarjeta.rel = 'noopener noreferrer';
      }
      tarjeta.innerHTML = `
        <h3>${item.titulo}</h3>
        <p>${item.materia}${item.carrera ? ' — ' + item.carrera : ''}</p>
      `;
      grid.appendChild(tarjeta);
    });

    contenedor.appendChild(grid);
  });
}

// Filtro simple por materia (busca coincidencia parcial, sin importar mayúsculas)
function filtrarApuntec(texto) {
  const busqueda = texto.trim().toLowerCase();
  if (busqueda === '') {
    renderizarApuntec(materialApuntec);
    return;
  }
  const filtrados = materialApuntec.filter((item) =>
    item.materia.toLowerCase().includes(busqueda)
  );
  renderizarApuntec(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
  cargarApuntec();

  const inputBusqueda = document.getElementById('buscador-apuntec');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => filtrarApuntec(e.target.value));
  }
});
