// ===========================================
// GRADIENTE UTN — Formulario de contacto (RF-01)
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto');
  const mensajeEstado = document.getElementById('mensaje-estado');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // evita que la página se recargue (comportamiento normal de un form)

    // Tomamos los valores escritos en cada input por su atributo "name"
    const datos = {
      nombre: form.nombre.value,
      email: form.email.value,
      telefono: form.telefono.value,
      carrera: form.carrera.value,
      mensaje: form.mensaje.value,
    };

    // Deshabilitamos el botón mientras se envía, para evitar doble-click
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    const { error } = await supabaseClient
      .from('contactos')
      .insert(datos);

    boton.disabled = false;
    boton.textContent = 'Enviar';

    if (error) {
      console.error('Error al enviar el formulario:', error);
      mensajeEstado.textContent = 'Hubo un problema al enviar. Intentá de nuevo.';
      mensajeEstado.style.color = 'crimson';
      return;
    }

    mensajeEstado.textContent = '¡Gracias! Ya recibimos tu mensaje.';
    mensajeEstado.style.color = 'green';
    form.reset(); // vacía el formulario
  });
});
