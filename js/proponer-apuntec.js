// ===========================================
// GRADIENTE UTN — Proponer material (público)
// ===========================================
// A diferencia del panel de admin, esto lo puede usar cualquier estudiante,
// así que NO pide ningún token ni clave. El archivo se sube directo a un
// bucket de Supabase Storage (solo de "pendientes", no el storage grande de
// GitHub), y la fila en `apuntec` se crea con estado='pendiente'.
//
// Dos capas de seguridad hacen que esto sea seguro aunque sea público:
//   1. La política RLS de la tabla `apuntec` solo deja insertar filas con
//      estado='pendiente' (no se puede auto-aprobar nada desde acá).
//   2. `apuntec.js` (la página pública de APUNTEC) solo muestra filas con
//      estado='aprobado', así que nada de esto aparece hasta que el equipo
//      lo revise desde el panel de administración.

const TAMANIO_MAXIMO_MB = 40;

async function cargarCarpetasEnSelectorPublico() {
  const selector = document.getElementById('select-carpeta');

  const { data: carpetas, error } = await supabaseClient
    .from('carpetas')
    .select('*')
    .eq('seccion', 'apuntec')
    .order('orden');

  if (error || !carpetas) {
    selector.innerHTML = '<option value="">No se pudieron cargar las carpetas</option>';
    return;
  }

  const porPadre = {};
  carpetas.forEach((c) => {
    const clave = c.carpeta_padre_id ?? 'raiz';
    if (!porPadre[clave]) porPadre[clave] = [];
    porPadre[clave].push(c);
  });

  const opciones = [];
  function agregarNivel(padreId, profundidad) {
    const hijas = porPadre[padreId ?? 'raiz'] || [];
    hijas.forEach((carpeta) => {
      const prefijo = '— '.repeat(profundidad);
      opciones.push({ id: carpeta.id, texto: `${prefijo}${carpeta.nombre}` });
      agregarNivel(carpeta.id, profundidad + 1);
    });
  }
  agregarNivel(null, 0);

  if (opciones.length === 0) {
    selector.innerHTML = '<option value="">No hay carpetas disponibles todavía</option>';
    return;
  }

  selector.innerHTML = '<option value="">Elegí una carpeta...</option>' +
    opciones.map((op) => `<option value="${op.id}">${op.texto}</option>`).join('');
}

function slugificarPublico(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

document.addEventListener('DOMContentLoaded', () => {
  cargarCarpetasEnSelectorPublico();

  const form = document.getElementById('form-proponer');
  const mensaje = document.getElementById('mensaje-estado-propuesta');
  const boton = document.getElementById('btn-proponer');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('input-nombre').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const carpetaId = document.getElementById('select-carpeta').value;
    const materia = document.getElementById('input-materia').value.trim();
    const carrera = document.getElementById('input-carrera').value.trim();
    const categoria = document.getElementById('input-categoria').value.trim();
    const titulo = document.getElementById('input-titulo').value.trim();
    const archivo = document.getElementById('input-archivo').files[0];

    if (!nombre || !carpetaId || !materia || !categoria || !titulo || !archivo) {
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = 'Completá todos los campos obligatorios.';
      return;
    }

    if (archivo.size > TAMANIO_MAXIMO_MB * 1024 * 1024) {
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = `El archivo pesa más de ${TAMANIO_MAXIMO_MB}MB. Si es un libro escaneado muy pesado, escribinos por Sumate y lo coordinamos aparte.`;
      return;
    }

    boton.disabled = true;
    mensaje.style.color = 'var(--texto-mutado)';
    mensaje.textContent = 'Subiendo tu material...';

    try {
      // 1. Subimos el archivo al bucket de pendientes en Supabase Storage
      const extension = archivo.name.split('.').pop();
      const rutaStorage = `pendientes/${Date.now()}-${slugificarPublico(titulo) || 'material'}.${extension}`;

      const { error: errorStorage } = await supabaseClient
        .storage
        .from('propuestas')
        .upload(rutaStorage, archivo, { contentType: archivo.type });

      if (errorStorage) {
        throw new Error(`No se pudo subir el archivo: ${errorStorage.message}`);
      }

      // 2. Creamos la fila en `apuntec` con estado='pendiente'
      //    (la política RLS es la que impide que esto pueda insertarse como 'aprobado')
      const { error: errorInsert } = await supabaseClient
        .from('apuntec')
        .insert({
          carpeta_id: Number(carpetaId),
          materia,
          carrera: carrera || null,
          categoria,
          titulo,
          archivo_url: rutaStorage, // ruta temporal en Storage; se reemplaza por la URL final al aprobar
          estado: 'pendiente',
          propuesto_por_nombre: nombre,
          propuesto_por_email: email || null,
        });

      if (errorInsert) {
        throw new Error(`No se pudo registrar la propuesta: ${errorInsert.message}`);
      }

      mensaje.style.color = 'var(--celeste)';
      mensaje.textContent = '¡Gracias! Tu material quedó enviado para revisión. Te avisamos si lo publicamos (o si necesitamos consultarte algo).';
      form.reset();
    } catch (error) {
      console.error(error);
      mensaje.style.color = 'var(--rosa)';
      mensaje.textContent = `Error: ${error.message}`;
    } finally {
      boton.disabled = false;
    }
  });
});
