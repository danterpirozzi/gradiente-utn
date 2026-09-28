// ===========================================
// GRADIENTE UTN — /api/eliminar-apuntec
// ===========================================
// Borra una fila de `apuntec`. El archivo en GitHub se borra ANTES desde el
// navegador del admin (necesita su token, que nunca llega a este servidor);
// esta función solo se encarga de la fila en la base de datos, con la
// service_role key (el público no tiene permiso de DELETE sobre esta tabla).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { adminClave, id } = req.body || {};

  if (adminClave !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Clave de administración incorrecta' });
    return;
  }

  if (!id) {
    res.status(400).json({ error: 'Falta el id del material a eliminar' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Faltan variables de entorno de Supabase en el servidor' });
    return;
  }

  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/apuntec?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      res.status(respuesta.status).json({ error: datos.message || 'Error al eliminar' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
