// ===========================================
// GRADIENTE UTN — /api/gestionar-propuesta
// ===========================================
// Recibe la decisión del admin sobre UNA propuesta puntual:
//   - accion: 'aprobar'  → actualiza la fila (estado='aprobado', archivo_url
//     final de jsDelivr, carpeta_id definitivo) y borra el archivo temporal
//     de Storage (el navegador ya lo subió a GitHub antes de llamar acá).
//   - accion: 'rechazar' → borra la fila de `apuntec` y su archivo temporal.
//
// Como siempre, usa la service_role key (nunca expuesta al navegador) para
// poder tocar filas 'pendiente', que las políticas públicas no dejan leer/escribir.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { adminClave, accion, id, carpetaId, archivoUrl, rutaStorage } = req.body || {};

  if (adminClave !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Clave de administración incorrecta' });
    return;
  }

  if (!id || !accion || !['aprobar', 'rechazar'].includes(accion)) {
    res.status(400).json({ error: 'Faltan datos: id o accion inválida' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Faltan variables de entorno de Supabase en el servidor' });
    return;
  }

  const encabezados = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    if (accion === 'aprobar') {
      if (!carpetaId || !archivoUrl) {
        res.status(400).json({ error: 'Faltan datos para aprobar: carpetaId o archivoUrl' });
        return;
      }

      const respuestaUpdate = await fetch(`${SUPABASE_URL}/rest/v1/apuntec?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...encabezados, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          estado: 'aprobado',
          carpeta_id: carpetaId,
          archivo_url: archivoUrl,
        }),
      });
      const datos = await respuestaUpdate.json();

      if (!respuestaUpdate.ok) {
        res.status(respuestaUpdate.status).json({ error: datos.message || 'Error al aprobar' });
        return;
      }

      // Limpiamos el archivo temporal de Storage (ya vive en GitHub ahora)
      if (rutaStorage) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/propuestas`, {
          method: 'DELETE',
          headers: encabezados,
          body: JSON.stringify({ prefixes: [rutaStorage] }),
        }).catch(() => {}); // si falla la limpieza no es crítico, no bloqueamos la respuesta

        res.status(200).json({ ok: true, fila: datos });
        return;
      }

      res.status(200).json({ ok: true, fila: datos });
      return;
    }

    // accion === 'rechazar'
    const respuestaDelete = await fetch(`${SUPABASE_URL}/rest/v1/apuntec?id=eq.${id}`, {
      method: 'DELETE',
      headers: encabezados,
    });

    if (!respuestaDelete.ok) {
      const datos = await respuestaDelete.json().catch(() => ({}));
      res.status(respuestaDelete.status).json({ error: datos.message || 'Error al rechazar' });
      return;
    }

    if (rutaStorage) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/propuestas`, {
        method: 'DELETE',
        headers: encabezados,
        body: JSON.stringify({ prefixes: [rutaStorage] }),
      }).catch(() => {});
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
