// ===========================================
// GRADIENTE UTN — Lógica compartida
// ===========================================

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
