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

// Escapa HTML antes de insertar cualquier texto que venga de una carga de
// contenido (títulos, materias, nombres, etc.) dentro de innerHTML. Esto es
// lo que evita que alguien pueda "inyectar" código malicioso escribiendo,
// por ejemplo, un <script> como si fuera el título de un apunte — sin esto,
// ese código se ejecutaría en el navegador de quien vea esa tarjeta
// (incluido el admin revisando propuestas, con su token de GitHub tipeado
// en la misma pantalla).
function escaparHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- PROTECCIÓN ANTI-SPAM PARA FORMULARIOS PÚBLICOS ----------
// Combina dos capas simples, sin depender de ningún servicio externo (nada
// de reCAPTCHA/hCaptcha, no hace falta crear cuentas en ningún lado):
//
//  1. Honeypot: un campo invisible para personas pero visible para bots que
//     completan formularios automáticamente. Si llega lleno, es un bot.
//  2. Tiempo mínimo + límite de frecuencia: nadie llena un formulario real
//     en menos de un par de segundos, y nadie manda el mismo formulario
//     dos veces seguidas en menos de un minuto.

// Llamar al cargar la página, guarda el momento en que se mostró el form
function inicializarProteccionAntiSpam(form) {
  form.dataset.cargadoEn = Date.now();
}

// Devuelve true si el envío tiene pinta de ser un bot (no de una persona)
function esEnvioSospechoso(form, tiempoMinimoMs = 2500) {
  const honeypot = form.querySelector('[name="sitio_web"]');
  if (honeypot && honeypot.value) return true;

  const tiempoTranscurrido = Date.now() - Number(form.dataset.cargadoEn || 0);
  if (tiempoTranscurrido < tiempoMinimoMs) return true;

  return false;
}

// Límite de frecuencia por navegador: evita que se mande el mismo
// formulario en loop. `clave` identifica el formulario (ej: "contacto").
function limiteDeEnvioAlcanzado(clave, minSegundos = 60) {
  const ultimo = Number(localStorage.getItem(`ultimo-envio-${clave}`) || 0);
  const segundosDesdeElUltimo = (Date.now() - ultimo) / 1000;
  return segundosDesdeElUltimo < minSegundos;
}

function registrarEnvio(clave) {
  localStorage.setItem(`ultimo-envio-${clave}`, String(Date.now()));
}

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
