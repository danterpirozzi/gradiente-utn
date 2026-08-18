// ===========================================
// GRADIENTE UTN — Carrusel de fotos (Sumate)
// ===========================================

let fotosCarrusel = [];
let indiceActual = 0;

async function cargarCarrusel() {
  const contenedor = document.getElementById('carrusel-fotos');
  if (!contenedor) return;

  const { data, error } = await supabaseClient
    .from('fotos_equipo')
    .select('*')
    .order('orden', { ascending: true });

  if (error || !data || data.length === 0) {
    // Si no hay fotos cargadas, ocultamos el carrusel entero (no mostramos un hueco vacío)
    contenedor.style.display = 'none';
    return;
  }

  fotosCarrusel = data;
  indiceActual = 0;
  renderizarCarrusel();
}

function renderizarCarrusel() {
  const imagen = document.getElementById('carrusel-imagen');
  const indicador = document.getElementById('carrusel-indicador');

  const foto = fotosCarrusel[indiceActual];
  imagen.src = foto.imagen_url;
  imagen.alt = foto.descripcion || 'Equipo de Gradiente';

  indicador.textContent = `${indiceActual + 1} / ${fotosCarrusel.length}`;

  // Si solo hay una foto, no tiene sentido mostrar las flechas de navegación
  const flechas = document.querySelectorAll('.carrusel-flecha');
  flechas.forEach((f) => f.style.display = fotosCarrusel.length > 1 ? 'flex' : 'none');
}

function carruselSiguiente() {
  indiceActual = (indiceActual + 1) % fotosCarrusel.length;
  renderizarCarrusel();
}

function carruselAnterior() {
  indiceActual = (indiceActual - 1 + fotosCarrusel.length) % fotosCarrusel.length;
  renderizarCarrusel();
}

document.addEventListener('DOMContentLoaded', () => {
  cargarCarrusel();

  const btnSiguiente = document.getElementById('carrusel-siguiente');
  const btnAnterior = document.getElementById('carrusel-anterior');
  if (btnSiguiente) btnSiguiente.addEventListener('click', carruselSiguiente);
  if (btnAnterior) btnAnterior.addEventListener('click', carruselAnterior);
});
