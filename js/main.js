// ===========================================
// GRADIENTE UTN — Lógica compartida
// ===========================================

// Iconos SVG livianos y prolijos (reemplazan a los emojis 📁📄🔗 en las tarjetas).
// Usan stroke="currentColor" para heredar el color celeste/rosa definido en el CSS.
const ICONO_CARPETA = `
  <svg class="icono-carpeta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.6.8L12 7.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
  </svg>`;

const ICONO_ARCHIVO = `
  <svg class="icono-item" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
    <path d="M14 3v5h5"/>
  </svg>`;

const ICONO_LINK = `
  <svg class="icono-item" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 14a4 4 0 0 0 5.7.3l3-3a4 4 0 0 0-5.7-5.7l-1.6 1.5"/>
    <path d="M14 10a4 4 0 0 0-5.7-.3l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>
  </svg>`;

// Muestra N tarjetas "skeleton" (efecto de carga) dentro de un contenedor.
// Se usa en novedades.js, apuntec.js, links.js, info-importante.js y espacios-ceutn.js
// para reemplazar el texto plano "Cargando..." por algo más prolijo.
function mostrarSkeleton(contenedor, cantidad = 3) {
  contenedor.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    const div = document.createElement('div');
    div.className = 'skeleton-card';
    contenedor.appendChild(div);
  }
}

// Menú hamburguesa (mobile): muestra/oculta la navegación
document.addEventListener('DOMContentLoaded', () => {
  const boton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');

  if (boton && nav) {
    boton.addEventListener('click', () => {
      nav.classList.toggle('abierto');
    });
  }
});
