// ===========================================
// GRADIENTE UTN — Mural de fotos continuo (Sumate)
// ===========================================
// A diferencia del carrusel anterior (una foto + flechas), esto arma una
// tira horizontal con todas las fotos, que se desplaza sola en loop infinito
// (tipo mural). Para que el loop sea perfecto sin "salto", duplicamos la
// lista de fotos una vez: cuando la tira llega a la mitad (donde termina la
// copia original), reinicia a 0 y como la copia es idéntica no se nota.

async function cargarCarrusel() {
  const contenedor = document.getElementById('carrusel-fotos');
  if (!contenedor) return;

  const { data, error } = await supabaseClient
    .from('fotos_equipo')
    .select('*')
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    // Si no hay fotos cargadas, ocultamos el mural entero (no mostramos un hueco vacío)
    contenedor.style.display = 'none';
    return;
  }

  renderizarMural(data);
}

function renderizarMural(fotos) {
  const pista = document.getElementById('mural-pista');
  if (!pista) return;

  // Si hay muy pocas fotos, duplicamos varias veces para que la tira sea
  // lo bastante larga y el desplazamiento se vea continuo desde ya
  let fotosParaMostrar = fotos;
  while (fotosParaMostrar.length < 6) {
    fotosParaMostrar = fotosParaMostrar.concat(fotos);
  }

  // Duplicamos la tira completa una vez más: es lo que permite el loop sin cortes
  const fotosDuplicadas = fotosParaMostrar.concat(fotosParaMostrar);

  pista.innerHTML = fotosDuplicadas
    .map((foto) => `<img class="mural-foto" src="${foto.imagen_url}" alt="${foto.descripcion || 'Equipo de Gradiente'}" loading="lazy">`)
    .join('');

  // Si hay pocas fotos únicas, el mural se mueve más lento (para que se disfrute cada una);
  // con más fotos, un poco más rápido para no hacerlo eterno
  const duracion = Math.max(18, fotosParaMostrar.length * 4.5);
  pista.style.animationDuration = `${duracion}s`;
}

document.addEventListener('DOMContentLoaded', cargarCarrusel);
