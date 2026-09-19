// ===========================================
// GRADIENTE UTN — /api/listar-propuestas
// ===========================================
// Usa la service_role key para leer las filas con estado='pendiente' de
// `apuntec` (el resto del sitio, con la clave pública, solo puede leer
// 'aprobado'), y genera una URL firmada temporal por cada archivo en el
// bucket privado 'propuestas' de Storage, para que el admin pueda
// previsualizarlo sin exponer el bucket públicamente.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { adminClave } = req.body || {};

  if (adminClave !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Clave de administración incorrecta' });
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
    // 1. Traemos las filas pendientes
    const respuestaFilas = await fetch(
      `${SUPABASE_URL}/rest/v1/apuntec?estado=eq.pendiente&order=creado_en.asc`,
      { headers: encabezados }
    );
    const filas = await respuestaFilas.json();

    if (!respuestaFilas.ok) {
      res.status(respuestaFilas.status).json({ error: filas.message || 'Error al leer propuestas' });
      return;
    }

    // 2. Por cada fila, generamos una URL firmada (válida 1 hora) para su archivo
    const propuestas = await Promise.all(
      filas.map(async (fila) => {
        try {
          const respuestaFirma = await fetch(
            `${SUPABASE_URL}/storage/v1/object/sign/propuestas/${fila.archivo_url}`,
            {
              method: 'POST',
              headers: encabezados,
              body: JSON.stringify({ expiresIn: 3600 }),
            }
          );
          const datosFirma = await respuestaFirma.json();
          const urlFirmada = respuestaFirma.ok
            ? `${SUPABASE_URL}/storage/v1${datosFirma.signedURL}`
            : null;
          return { ...fila, urlFirmada };
        } catch {
          return { ...fila, urlFirmada: null };
        }
      })
    );

    res.status(200).json({ propuestas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
