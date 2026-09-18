// ===========================================
// GRADIENTE UTN — Novedades (conectado a Supabase)
// ===========================================
// Esta función se usa en dos lugares:
//  - En la home (index.html), mostrando solo las últimas (limite=3)
//  - En paginas/novedades.html, mostrando el archivo completo (sin límite)

async function cargarNovedades(idContenedor = 'lista-novedades', limite = null) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  mostrarSkeleton(contenedor, limite || 3);

  let consulta = supabaseClient
    .from('novedades')
    .select('*')
    .order('fecha', { ascending: false });

  if (limite) {
    consulta = consulta.limit(limite);
  }

  const { data, error } = await consulta;

  if (error) {
    console.error('Error al cargar novedades:', error);
    contenedor.innerHTML = '<p>No se pudieron cargar las novedades. Intentá de nuevo más tarde.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay novedades publicadas.</p>';
    return;
  }

  contenedor.innerHTML = '';

  data.forEach((novedad) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card';

    const fechaFormateada = new Date(novedad.fecha + 'T00:00:00')
      .toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Armamos el texto para compartir: título + cuerpo + link a la página de Novedades
    const textoCompartir = `📢 ${novedad.titulo}\n\n${novedad.cuerpo}\n\nMás novedades en: ${window.location.origin}${window.location.pathname.includes('/paginas/') ? '' : '/paginas'}/novedades.html`;
    const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(textoCompartir)}`;

    // La imagen es opcional: si no hay imagen_url cargada, no se muestra nada (sin huecos raros)
    const imagenHtml = novedad.imagen_url
      ? `<img src="${novedad.imagen_url}" alt="${novedad.titulo}" class="media-estandar" loading="lazy">`
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

// En la home mostramos solo las 3 últimas; en la página de Novedades, todas
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('inicio-novedades')) {
    cargarNovedades('inicio-novedades', 3);
  }
  if (document.getElementById('lista-novedades')) {
    cargarNovedades('lista-novedades');
  }
});
