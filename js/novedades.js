// ===========================================
// GRADIENTE UTN — Novedades (conectado a Supabase)
// ===========================================

async function cargarNovedades() {
  const contenedor = document.getElementById('lista-novedades');
  mostrarSkeleton(contenedor, 3);

  // Pedimos todas las filas de la tabla "novedades",
  // ordenadas por fecha (la más nueva primero)
  const { data, error } = await supabaseClient
    .from('novedades')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al cargar novedades:', error);
    contenedor.innerHTML = '<p>No se pudieron cargar las novedades. Intentá de nuevo más tarde.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay novedades publicadas.</p>';
    return;
  }

  // Vaciamos el contenido de prueba y lo reemplazamos con datos reales
  contenedor.innerHTML = '';

  data.forEach((novedad) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card';

    const fechaFormateada = new Date(novedad.fecha + 'T00:00:00')
      .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

    tarjeta.innerHTML = `
      <h3>${novedad.titulo}</h3>
      <p>${novedad.cuerpo}</p>
      <p style="font-size: 0.8rem; color: #888; margin-top: 0.5rem;">${fechaFormateada}</p>
    `;

    contenedor.appendChild(tarjeta);
  });
}

// Ejecutamos apenas carga la página
document.addEventListener('DOMContentLoaded', cargarNovedades);
