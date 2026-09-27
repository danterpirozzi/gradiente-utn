// ===========================================
// GRADIENTE UTN — Selector de carpetas (widget reutilizable)
// ===========================================
// Reemplaza el <select> con "— — —" de indentación por un explorador visual:
// se puede navegar carpeta por carpeta (como en el sitio real) o buscar por
// nombre y saltar directo. Se usa en admin-apuntec.html, admin-apuntec-
// masivo.html y proponer-apuntec.html.
//
// CÓMO SE ENGANCHA (sin tocar el resto del código de cada página):
// Buscamos un <div data-selector-carpetas="apuntec"> en la página. Adentro
// de ese div inyectamos todo el widget, y al elegir una carpeta actualizamos
// un <input type="hidden" id="select-carpeta"> — el mismo id que ya usaban
// los <select> viejos. Así admin-apuntec.js, admin-apuntec-masivo.js y
// proponer-apuntec.js siguen leyendo `document.getElementById('select-carpeta').value`
// exactamente igual que antes, sin ningún cambio.

async function inicializarSelectorDeCarpetas() {
  const contenedor = document.querySelector('[data-selector-carpetas]');
  if (!contenedor) return;

  const seccion = contenedor.dataset.selectorCarpetas;

  const { data: carpetas, error } = await supabaseClient
    .from('carpetas')
    .select('*')
    .eq('seccion', seccion)
    .order('orden');

  if (error || !carpetas) {
    contenedor.innerHTML = '<p style="color: var(--rosa);">No se pudieron cargar las carpetas.</p>';
    return;
  }

  // Armamos el árbol y un índice por id, para poder calcular la ruta completa
  // de cualquier carpeta ("Análisis II / Parciales") sin recorrer todo de nuevo
  const porId = {};
  carpetas.forEach((c) => { porId[c.id] = { ...c, hijos: [] }; });
  const raiz = [];
  carpetas.forEach((c) => {
    if (c.carpeta_padre_id && porId[c.carpeta_padre_id]) {
      porId[c.carpeta_padre_id].hijos.push(porId[c.id]);
    } else {
      raiz.push(porId[c.id]);
    }
  });

  function rutaCompleta(id) {
    const partes = [];
    let actual = porId[id];
    while (actual) {
      partes.unshift(actual.nombre);
      actual = actual.carpeta_padre_id ? porId[actual.carpeta_padre_id] : null;
    }
    return partes.join(' / ');
  }

  let nivelActual = raiz; // lista de carpetas que se ven en el panel ahora mismo
  let migaDePan = []; // [{id, nombre}] de dónde venimos, para el botón "atrás"

  contenedor.innerHTML = `
    <button type="button" class="boton-selector-carpeta" id="boton-selector-carpeta">
      <span id="texto-selector-carpeta">Elegí una carpeta...</span>
      <span aria-hidden="true">▾</span>
    </button>
    <input type="hidden" id="select-carpeta" required>

    <div class="panel-selector-carpeta" id="panel-selector-carpeta" hidden>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <strong style="font-size: 0.85rem;">Elegir carpeta</strong>
        <button type="button" id="btn-cerrar-selector-carpeta" aria-label="Cerrar"
                style="background: transparent; border: none; color: var(--texto-mutado); font-size: 1.2rem; line-height: 1; cursor: pointer; padding: 0.2rem 0.4rem;">✕</button>
      </div>
      <input type="search" id="buscador-selector-carpeta" class="input-buscador" style="margin-bottom: 0.6rem;"
             placeholder="Buscar carpeta por nombre...">
      <p id="migas-selector-carpeta" style="font-size: 0.78rem; color: var(--texto-mutado); margin-bottom: 0.5rem;"></p>
      <div id="lista-selector-carpeta"></div>
    </div>
  `;

  const boton = contenedor.querySelector('#boton-selector-carpeta');
  const panel = contenedor.querySelector('#panel-selector-carpeta');
  const inputOculto = contenedor.querySelector('#select-carpeta');
  const textoBoton = contenedor.querySelector('#texto-selector-carpeta');
  const buscador = contenedor.querySelector('#buscador-selector-carpeta');
  const migas = contenedor.querySelector('#migas-selector-carpeta');
  const lista = contenedor.querySelector('#lista-selector-carpeta');

  function elegirCarpeta(carpeta) {
    inputOculto.value = carpeta.id;
    textoBoton.textContent = rutaCompleta(carpeta.id);
    panel.hidden = true;
  }

  function renderizarNivel() {
    migas.innerHTML = migaDePan.length === 0
      ? 'Carpetas principales'
      : `<a href="#" data-volver="raiz">Carpetas principales</a>` +
        migaDePan.map((m, i) => ` / <a href="#" data-volver="${i}">${escaparHtml(m.nombre)}</a>`).join('');

    if (nivelActual.length === 0) {
      lista.innerHTML = '<p style="font-size: 0.85rem; color: var(--texto-mutado); padding: 0.5rem;">No hay subcarpetas acá.</p>';
    } else {
      lista.innerHTML = nivelActual.map((c) => `
        <div class="fila-carpeta-selector" data-id="${c.id}">
          <span>${ICONO_CARPETA}</span>
          <span class="nombre-fila-carpeta">${escaparHtml(c.nombre)}</span>
          ${c.hijos.length > 0 ? '<span class="entrar-fila-carpeta">Entrar →</span>' : ''}
          <button type="button" class="btn-usar-carpeta" data-id="${c.id}">Usar esta</button>
        </div>
      `).join('');
    }

    // Clic en el nombre de la carpeta (si tiene hijos, entra; si no, se elige directo)
    lista.querySelectorAll('.nombre-fila-carpeta, .entrar-fila-carpeta').forEach((el) => {
      el.addEventListener('click', () => {
        const fila = el.closest('.fila-carpeta-selector');
        const carpeta = porId[fila.dataset.id];
        if (carpeta.hijos.length > 0) {
          migaDePan.push({ id: carpeta.id, nombre: carpeta.nombre });
          nivelActual = carpeta.hijos;
          renderizarNivel();
        } else {
          elegirCarpeta(carpeta);
        }
      });
    });

    lista.querySelectorAll('.btn-usar-carpeta').forEach((btn) => {
      btn.addEventListener('click', () => elegirCarpeta(porId[btn.dataset.id]));
    });

    migas.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const volver = a.dataset.volver;
        if (volver === 'raiz') {
          migaDePan = [];
          nivelActual = raiz;
        } else {
          const indice = Number(volver);
          migaDePan = migaDePan.slice(0, indice + 1);
          nivelActual = indice === 0 ? porId[migaDePan[0].id].hijos : porId[migaDePan[indice].id].hijos;
        }
        renderizarNivel();
      });
    });
  }

  function buscarPlano(consulta) {
    const consultaMin = consulta.toLowerCase();
    const coincidencias = carpetas.filter((c) => c.nombre.toLowerCase().includes(consultaMin));

    if (coincidencias.length === 0) {
      lista.innerHTML = '<p style="font-size: 0.85rem; color: var(--texto-mutado); padding: 0.5rem;">Ninguna carpeta coincide.</p>';
      migas.textContent = `Resultados para "${consulta}"`;
      return;
    }

    migas.textContent = `Resultados para "${consulta}"`;
    lista.innerHTML = coincidencias.map((c) => `
      <div class="fila-carpeta-selector" data-id="${c.id}">
        <span>${ICONO_CARPETA}</span>
        <span class="nombre-fila-carpeta" style="cursor: pointer;">${escaparHtml(rutaCompleta(c.id))}</span>
        <button type="button" class="btn-usar-carpeta" data-id="${c.id}">Usar esta</button>
      </div>
    `).join('');

    lista.querySelectorAll('.nombre-fila-carpeta, .btn-usar-carpeta').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.closest('.fila-carpeta-selector').dataset.id;
        elegirCarpeta(porId[id]);
      });
    });
  }

  boton.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) buscador.focus();
  });

  contenedor.querySelector('#btn-cerrar-selector-carpeta').addEventListener('click', () => {
    panel.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) panel.hidden = true;
  });

  // Cerrar el panel si se hace clic afuera
  document.addEventListener('click', (e) => {
    if (!contenedor.contains(e.target)) panel.hidden = true;
  });

  buscador.addEventListener('input', () => {
    const consulta = buscador.value.trim();
    if (consulta.length === 0) {
      renderizarNivel();
    } else {
      buscarPlano(consulta);
    }
  });

  renderizarNivel();
}

document.addEventListener('DOMContentLoaded', inicializarSelectorDeCarpetas);
