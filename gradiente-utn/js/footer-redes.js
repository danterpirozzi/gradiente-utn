// ===========================================
// GRADIENTE UTN — Redes en el footer (todas las páginas)
// ===========================================
// Reutiliza la misma tabla 'links' que ya se usa en la página Links,
// así evitamos tener las redes hardcodeadas en 8 archivos distintos.

async function cargarRedesFooter() {
  const contenedor = document.getElementById('footer-redes');
  if (!contenedor) return; // por si alguna página no tiene el contenedor

  const { data, error } = await supabaseClient
    .from('links')
    .select('*')
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    return; // fallamos en silencio: mejor un footer sin redes que un error visible
  }

  contenedor.innerHTML = data
    .map((link) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.nombre}</a>`)
    .join(' · ');
}

document.addEventListener('DOMContentLoaded', cargarRedesFooter);
