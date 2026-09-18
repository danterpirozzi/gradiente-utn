// ===========================================
// GRADIENTE UTN — Preguntas frecuentes (FAQ)
// ===========================================

async function cargarFaqs() {
  const contenedor = document.getElementById('lista-faqs');
  mostrarSkeleton(contenedor, 4);

  const { data, error } = await supabaseClient
    .from('faqs')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar FAQ:', error);
    contenedor.innerHTML = '<p>No se pudieron cargar las preguntas frecuentes.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>Todavía no hay preguntas cargadas.</p>';
    return;
  }

  contenedor.innerHTML = '';
  contenedor.className = ''; // sacamos el grid-cards, acá va una lista vertical

  data.forEach((faq) => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <button class="faq-pregunta">
        <span>${faq.pregunta}</span>
        <span class="faq-icono">+</span>
      </button>
      <div class="faq-respuesta">
        <p>${faq.respuesta}</p>
      </div>
    `;

    // Al clickear la pregunta, se abre/cierra la respuesta (acordeón)
    const boton = item.querySelector('.faq-pregunta');
    boton.addEventListener('click', () => {
      item.classList.toggle('abierta');
    });

    contenedor.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', cargarFaqs);
