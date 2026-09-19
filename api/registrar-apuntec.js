// ===========================================
// GRADIENTE UTN — /api/registrar-apuntec
// ===========================================
// Función serverless de Vercel. Recibe SOLO texto (título, carpeta, y la URL
// del archivo que el navegador ya subió directo a GitHub) — nunca recibe el
// archivo en sí, así no pega contra el límite de 4.5MB por request que tienen
// las funciones serverless de Vercel.
//
// Usa la SERVICE_ROLE key de Supabase (nunca expuesta al navegador) para
// insertar en la tabla `apuntec` saltándose las políticas RLS de solo-lectura
// que usa el resto del sitio con la clave pública.
//
// Variables de entorno necesarias (configurar en Vercel → Settings → Environment Variables):
//   - SUPABASE_URL              (la misma URL pública que ya usa el sitio)
//   - SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → "service_role", SECRETA)
//   - ADMIN_PASSWORD            (clave elegida por ustedes para el panel de carga)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { adminClave, carpetaId, titulo, archivoUrl } = req.body || {};

  if (adminClave !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Clave de administración incorrecta' });
    return;
  }

  if (!carpetaId || !titulo || !archivoUrl) {
    res.status(400).json({ error: 'Faltan datos: carpetaId, titulo o archivoUrl' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Faltan variables de entorno de Supabase en el servidor' });
    return;
  }

  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/apuntec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        carpeta_id: carpetaId,
        titulo,
        archivo_url: archivoUrl,
        estado: 'aprobado', // lo sube el admin, así que ya queda publicado
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      res.status(respuesta.status).json({ error: datos.message || 'Supabase rechazó la inserción' });
      return;
    }

    res.status(200).json({ ok: true, fila: datos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
