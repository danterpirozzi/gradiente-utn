// ===========================================
// GRADIENTE UTN — /api/editar-apuntec
// ===========================================
// Actualiza título/materia/carrera/categoría/carpeta de una fila de `apuntec`
// que ya existe. Usa la service_role key porque la tabla no tiene política de
// UPDATE para el público (con buena razón: nadie más que el equipo debería
// poder editar material ya publicado).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { adminClave, id, titulo, materia, carrera, categoria, carpetaId } = req.body || {};

  if (adminClave !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Clave de administración incorrecta' });
    return;
  }

  if (!id || !titulo || !materia || !categoria || !carpetaId) {
    res.status(400).json({ error: 'Faltan datos: id, titulo, materia, categoria o carpetaId' });
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
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        titulo,
        materia,
        carrera: carrera || null,
        categoria,
        carpeta_id: carpetaId,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      res.status(respuesta.status).json({ error: datos.message || 'Error al editar' });
      return;
    }

    res.status(200).json({ ok: true, fila: datos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
