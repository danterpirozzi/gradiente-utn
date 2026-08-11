// ===========================================
// GRADIENTE UTN — Info importante (conectado a Supabase)
// ===========================================

async function cargarInfoImportante() {
  const contenedor = document.getElementById('lista-info');

  const { data, error } = await supabaseClient
    .from('info_importante')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar info importante:', error);
    contenedor.innerHTML = '<p>No se pudo cargar la información.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay contenido cargado.</p>';
    return;
  }

  contenedor.innerHTML = '';

  data.forEach((item) => {
    const tarjeta = document.createElement(item.archivo_url ? 'a' : 'div');
    tarjeta.className = 'card';
    if (item.archivo_url) {
      tarjeta.href = item.archivo_url;
      tarjeta.target = '_blank';
      tarjeta.rel = 'noopener noreferrer';
    }

    tarjeta.innerHTML = `
      <span class="tag">${item.categoria}</span>
      <h3>${item.titulo}</h3>
      <p>${item.descripcion ?? ''}</p>
    `;

    contenedor.appendChild(tarjeta);
  });
}

document.addEventListener('DOMContentLoaded', cargarInfoImportante);
