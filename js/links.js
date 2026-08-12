// ===========================================
// GRADIENTE UTN — Links (conectado a Supabase)
// ===========================================

async function cargarLinks() {
  const contenedor = document.getElementById('lista-links');
  mostrarSkeleton(contenedor, 4);

  const { data, error } = await supabaseClient
    .from('links')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar links:', error);
    contenedor.innerHTML = '<p>No se pudieron cargar los links.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay links cargados.</p>';
    return;
  }

  contenedor.innerHTML = '';

  data.forEach((link) => {
    const tarjeta = document.createElement('a');
    tarjeta.className = 'card';
    tarjeta.href = link.url;
    tarjeta.target = '_blank'; // abre en pestaña nueva
    tarjeta.rel = 'noopener noreferrer';

    tarjeta.innerHTML = `<h3>${link.nombre}</h3>`;

    contenedor.appendChild(tarjeta);
  });
}

document.addEventListener('DOMContentLoaded', cargarLinks);
