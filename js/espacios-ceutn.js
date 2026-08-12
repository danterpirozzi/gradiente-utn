// ===========================================
// GRADIENTE UTN — Espacios CEUTN (conectado a Supabase)
// ===========================================

async function cargarEspacios() {
  const contenedorRecomendaciones = document.getElementById('lista-recomendaciones');
  const contenedorEspacios = document.getElementById('lista-espacios');

  const { data, error } = await supabaseClient
    .from('espacios_ceutn')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar espacios:', error);
    contenedorEspacios.innerHTML = '<p>No se pudieron cargar los espacios.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedorEspacios.innerHTML = '<p>Todavía no hay espacios cargados.</p>';
    contenedorRecomendaciones.parentElement.style.display = 'none';
    return;
  }

  const recomendaciones = data.filter((e) => e.es_recomendacion);
  const resto = data.filter((e) => !e.es_recomendacion);

  // Si no hay ninguna recomendación cargada, ocultamos ese bloque entero
  if (recomendaciones.length === 0) {
    contenedorRecomendaciones.parentElement.style.display = 'none';
  } else {
    contenedorRecomendaciones.innerHTML = '';
    recomendaciones.forEach((e) => contenedorRecomendaciones.appendChild(crearTarjeta(e)));
  }

  contenedorEspacios.innerHTML = '';
  if (resto.length === 0) {
    contenedorEspacios.innerHTML = '<p>No hay más espacios para mostrar.</p>';
  } else {
    resto.forEach((e) => contenedorEspacios.appendChild(crearTarjeta(e)));
  }
}

function crearTarjeta(espacio) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'card';
  tarjeta.innerHTML = `
    <h3>${espacio.nombre}</h3>
    <p>${espacio.descripcion ?? ''}</p>
  `;
  return tarjeta;
}

document.addEventListener('DOMContentLoaded', cargarEspacios);
