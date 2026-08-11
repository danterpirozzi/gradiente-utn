// ===========================================
// GRADIENTE UTN — Configuración de Supabase
// ===========================================
// Estas dos credenciales son PÚBLICAS a propósito (por eso "publishable"/"anon").
// La seguridad real la dan las políticas (RLS) que configuramos en Supabase,
// no el hecho de que estas claves estén ocultas.

const SUPABASE_URL = "https://sxuhvzznptjcxewaqhml.supabase.co";
const SUPABASE_KEY = "sb_publishable_LtPLZJsECEa2oCTTJ534og_kgwO55Mj";

// Creamos un "cliente" reutilizable en toda la página
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
