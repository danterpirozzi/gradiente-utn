// ===========================================
// GRADIENTE UTN — Lógica compartida
// ===========================================

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
