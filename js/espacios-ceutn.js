// ===========================================
// GRADIENTE UTN — Espacios CEUTN
// ===========================================

async function cargarEspacios() {
  const contenedor = document.getElementById('lista-espacios');
  mostrarSkeleton(contenedor, 3);

  const { data, error } = await supabaseClient
    .from('espacios_ceutn')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar espacios:', error);
    contenedor.innerHTML = '<p>No se pudieron cargar los espacios.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay espacios cargados.</p>';
    return;
  }

  contenedor.innerHTML = '';
  data.forEach((espacio) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card';

    const imagenHtml = espacio.imagen_url
      ? `<img src="${espacio.imagen_url}" alt="${espacio.nombre}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 0.8rem; display: block;">`
      : '';

    tarjeta.innerHTML = `
      ${imagenHtml}
      <h3>${espacio.nombre}</h3>
      <p>${espacio.descripcion ?? ''}</p>
      ${espacio.horario ? `<p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--celeste-claro);">🕒 ${espacio.horario}</p>` : ''}
      ${espacio.ubicacion ? `<p style="font-size: 0.85rem; color: var(--celeste-claro);">📍 ${espacio.ubicacion}</p>` : ''}
    `;
    contenedor.appendChild(tarjeta);
  });
}

// Formulario de recomendaciones: guarda el mensaje en Supabase (nadie más lo lee desde el navegador)
document.addEventListener('DOMContentLoaded', () => {
  cargarEspacios();

  const form = document.getElementById('form-recomendacion');
  const mensajeEstado = document.getElementById('mensaje-estado-recomendacion');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    const { error } = await supabaseClient
      .from('recomendaciones_espacios')
      .insert({ mensaje: form.mensaje.value });

    boton.disabled = false;
    boton.textContent = 'Enviar';

    if (error) {
      console.error('Error al enviar recomendación:', error);
      mensajeEstado.textContent = 'Hubo un problema al enviar. Intentá de nuevo.';
      mensajeEstado.style.color = 'crimson';
      return;
    }

    mensajeEstado.textContent = '¡Gracias por tu recomendación!';
    mensajeEstado.style.color = 'green';
    form.reset();
  });
});
