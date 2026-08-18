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

    // Armamos el texto para compartir: título + cuerpo + link a la página de Novedades
    const textoCompartir = `📢 ${novedad.titulo}\n\n${novedad.cuerpo}\n\nMás novedades en: ${window.location.href}`;
    const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(textoCompartir)}`;

    // La imagen es opcional: si no hay imagen_url cargada, no se muestra nada (sin huecos raros)
    const imagenHtml = novedad.imagen_url
      ? `<img src="${novedad.imagen_url}" alt="${novedad.titulo}" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 0.8rem; display: block;">`
      : '';

    // El botón de link también es opcional (ej: "Anotate acá" -> Google Form)
    const linkHtml = novedad.link_url
      ? `<a href="${novedad.link_url}" target="_blank" rel="noopener noreferrer"
           style="display: inline-block; margin-top: 0.6rem; padding: 0.5rem 1rem; background: var(--celeste); color: var(--azul-oscuro); border-radius: 6px; font-weight: 700; font-size: 0.85rem; text-decoration: none;">
           ${novedad.link_texto || 'Ver más'}
         </a>`
      : '';

    tarjeta.innerHTML = `
      ${imagenHtml}
      <h3>${novedad.titulo}</h3>
      <p>${novedad.cuerpo}</p>
      ${linkHtml}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem;">
        <p style="font-size: 0.8rem; color: #888;">${fechaFormateada}</p>
        <a href="${urlWhatsapp}" target="_blank" rel="noopener noreferrer"
           style="font-size: 0.8rem; color: var(--celeste); text-decoration: none; font-weight: 600;">
           ↗ Compartir
        </a>
      </div>
    `;

    contenedor.appendChild(tarjeta);
  });
}

// Ejecutamos apenas carga la página
document.addEventListener('DOMContentLoaded', cargarNovedades);
