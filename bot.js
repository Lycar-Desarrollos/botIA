// ============================================================
// 🤖 BOT DE WHATSAPP CON IA - CHIP RENT A CAR
// ============================================================
// Ejecutar: npm start
// Primera vez: escanear QR con el celular del chip dedicado
// ============================================================

import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
} from 'baileys';
import { GoogleGenerativeAI } from '@google/generative-ai';
import qrcode from 'qrcode-terminal';
import { CONFIG } from './config.js';
import fs from 'fs';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Validar API Key ───
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'PEGA_TU_API_KEY_AQUI') {
  console.error('\n❌ ERROR: No has configurado tu API key de Gemini.');
  console.error('📋 Pasos:');
  console.error('   1. Ve a https://aistudio.google.com/');
  console.error('   2. Crea una API key gratis');
  console.error('   3. Abre el archivo .env y pega tu key');
  console.error('   4. Vuelve a ejecutar: npm start\n');
  process.exit(1);
}

// ─── Inicializar Gemini ───
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Almacén de conversaciones ───
const conversaciones = new Map();

// ─── Rate limiter ───
let respuestasEnUltimoMinuto = 0;
setInterval(() => { respuestasEnUltimoMinuto = 0; }, 60_000);

// ─── Limpieza cada 30 min ───
setInterval(() => {
  const ahora = Date.now();
  for (const [jid, data] of conversaciones) {
    if (ahora - data.lastActivity > 2 * 60 * 60 * 1000) {
      conversaciones.delete(jid);
    }
  }
  console.log(`🧹 Limpieza: ${conversaciones.size} conversaciones activas`);
}, 30 * 60 * 1000);

// ─── Estado global del Bot ───
let botConnected = false;
let currentQRDataUrl = null;
let activeSock = null;

// ─── Leads ───
const LEADS_FILE = 'leads.json';
function cargarLeads() {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')); }
  catch { return []; }
}
function guardarLead(lead) {
  const leads = cargarLeads();
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`📋 Nuevo lead guardado: ${lead.nombre} - ${lead.auto}`);
}
function actualizarEstadoLead(timestamp, nuevoEstado) {
  const leads = cargarLeads();
  const lead = leads.find(l => l.timestamp === timestamp);
  if (lead) {
    lead.status = nuevoEstado;
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return true;
  }
  return false;
}

// ─── Contactos Excluidos (Personales / Familiares) ───
const EXCLUIDOS_FILE = 'contactos_excluidos.json';
function cargarContactosExcluidos() {
  try {
    if (!fs.existsSync(EXCLUIDOS_FILE)) {
      fs.writeFileSync(EXCLUIDOS_FILE, JSON.stringify(CONFIG.contactosExcluidosDefault || [], null, 2));
    }
    return JSON.parse(fs.readFileSync(EXCLUIDOS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
function guardarContactosExcluidos(lista) {
  try {
    fs.writeFileSync(EXCLUIDOS_FILE, JSON.stringify(lista, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
function esContactoExcluido(jid) {
  if (!jid) return false;
  const excluidos = cargarContactosExcluidos();
  const num = jid.replace(/\D/g, '');
  return excluidos.some(e => {
    const eNum = String(typeof e === 'object' ? (e.telefono || '') : e).replace(/\D/g, '');
    return eNum.length >= 7 && (num.endsWith(eNum) || num.includes(eNum));
  });
}

// ============================================================
// 🌐 SERVIDOR WEB EXPRESS & REST API (PANEL DE CONTROL)
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chip_rentacar_secret_key_2026_super_secure';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'chip2026';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware Autenticación
function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Rutas Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.json({ success: true, username });
  }
  return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
});

app.get('/api/auth/check', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true, user: decoded.username });
  } catch {
    return res.json({ authenticated: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// Rutas Protegidas API
app.get('/api/leads', requireAuth, (req, res) => {
  res.json(cargarLeads());
});

app.put('/api/leads/status', requireAuth, (req, res) => {
  const { timestamp, status } = req.body;
  const ok = actualizarEstadoLead(timestamp, status);
  if (ok) res.json({ success: true });
  else res.status(404).json({ error: 'Lead no encontrado' });
});

app.get('/api/contactos-excluidos', requireAuth, (req, res) => {
  res.json(cargarContactosExcluidos());
});

app.post('/api/contactos-excluidos', requireAuth, (req, res) => {
  const { telefono, nombre, nota } = req.body;
  if (!telefono) return res.status(400).json({ error: 'Teléfono requerido' });
  const lista = cargarContactosExcluidos();
  const limpio = telefono.replace(/\D/g, '');
  if (!lista.some(item => (typeof item === 'object' ? item.telefono : item).replace(/\D/g, '') === limpio)) {
    lista.push({ telefono, nombre: nombre || 'Contacto personal', nota: nota || '', fecha: new Date().toISOString() });
    guardarContactosExcluidos(lista);
  }
  res.json({ success: true, lista });
});

app.delete('/api/contactos-excluidos/:telefono', requireAuth, (req, res) => {
  const tel = req.params.telefono.replace(/\D/g, '');
  let lista = cargarContactosExcluidos();
  lista = lista.filter(item => (typeof item === 'object' ? item.telefono : item).replace(/\D/g, '') !== tel);
  guardarContactosExcluidos(lista);
  res.json({ success: true, lista });
});

app.get('/api/config', requireAuth, (req, res) => {
  res.json({ autos: CONFIG.autos, seguros: CONFIG.seguros });
});

app.put('/api/config', requireAuth, (req, res) => {
  const { autos, seguros } = req.body;
  if (autos) CONFIG.autos = autos;
  if (seguros) CONFIG.seguros = seguros;
  res.json({ autos: CONFIG.autos, seguros: CONFIG.seguros });
});

app.get('/api/bot/status', requireAuth, (req, res) => {
  res.json({ connected: botConnected, qr: currentQRDataUrl, activeConversations: conversaciones.size });
});

app.post('/api/bot/restart', requireAuth, (req, res) => {
  botConnected = false;
  currentQRDataUrl = null;
  if (activeSock) {
    try { activeSock.ev.removeAllListeners(); activeSock.end(); } catch {}
    activeSock = null;
  }
  setTimeout(iniciarBot, 1000);
  res.json({ success: true, message: 'Reiniciando bot...' });
});

app.post('/api/bot/logout-whatsapp', requireAuth, (req, res) => {
  try {
    botConnected = false;
    currentQRDataUrl = null;
    if (activeSock) {
      try { activeSock.ev.removeAllListeners(); activeSock.end(); } catch {}
      activeSock = null;
    }
    try {
      fs.rmSync('auth_info_baileys', { recursive: true, force: true });
    } catch {}
    console.log('🗑️  Sesión WhatsApp eliminada desde la web. Generando nuevo QR...');
    setTimeout(iniciarBot, 1500);
    res.json({ success: true, message: 'Sesión eliminada. Generando nuevo QR...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Panel de Control Web activo en: http://localhost:${PORT}`);
});


// ============================================================
// 📋 MENÚS Y PLANTILLAS
// ============================================================

const MENU_PRINCIPAL = `👋 ¡Hola! Bienvenido a *CHIP RENT A CAR* 🚗
_Renta de autos en Mérida, Yucatán_

─────────────────────
¿En qué te podemos ayudar hoy?
─────────────────────

*1.* 🚗 Catálogo de autos y precios
*2.* 🛡️ Seguros y coberturas
*3.* 📋 Requisitos para rentar
*4.* 📍 Ubicación y contacto
*5.* 📅 Quiero reservar
*6.* 👨‍💼 Hablar con el asesor Oscar

_Escribe el número de la opción o tu pregunta_ ⬇️`;

const MENU_AUTOS = `🚗 *CATÁLOGO DE AUTOS Y PRECIOS*
─────────────────────

*1. Básico (sedán económico)* — *$700/día*
   • March / Aveo o similar
   • 4 pasajeros | 2 maletas | A/C | Gran rendimiento

*2. Confort (sedán amplio)* — *$800/día*
   • Versa / Vento / Onix
   • 5 pasajeros | 3 maletas | Cajuela amplia | Confort

*3. SUV de 5 pasajeros* — *$1,200/día*
   • Creta / Duster / Soul
   • 5 pasajeros | Mayor altura para caminos y cenotes

*4. SUV de 7 pasajeros* — *$1,200/día*
   • Toyota Rush / Ertiga XL7
   • 7 pasajeros | 3 filas de asientos | Familiar

*5. Minivan de 8 pasajeros* — *$1,500/día*
   • Avanza / Sienna / Odyssey
   • 8 pasajeros | Doble A/C | Gran espacio

*6. Van de 12-15 pasajeros* — *$2,300/día*
   • Toyota Hiace / Nissan Urvan
   • 12 a 15 pasajeros | Ideal para grupos y excursiones

─────────────────────
✅ *Todos incluyen:* Seguro amplio + Km TOTALMENTE LIBRE 🏖️
💳 *Sin bloqueos forzosos de tarjeta de crédito*
📍 *Entrega en sucursal:* C. 28 × 25 y 23, Manuel Crescencio Rejón
_(Entrega en hotel/Airbnb/Tren Maya con costo extra accesible)_

_Escribe *5* o *reservar* para apartar tu auto_
_Escribe *0* para volver al menú_`;

const MENU_SEGUROS = `🛡️ *SEGUROS Y COBERTURAS*
─────────────────────

✅ *Seguro amplio INCLUIDO en tu tarifa:*
• 10% de deducible
• Cubre: robo total, pérdida total, colisión
• Daños a terceros y gastos médicos a ocupantes
• Km TOTALMENTE LIBRE en toda la península

💎 *Seguro Full Cover (opcional):*
• Deducible baja a *0%*
• Cubre cristales, llantas y abolladuras
• En caso de cualquier eventualidad, *no pagas nada*

💰 *Costo del Full Cover por día:*
• Básico — $400/día
• Confort — $500/día
• SUV de 5 y 7 — $500/día
• Minivan de 8 — $600/día
• Van de 12-15 — $1,000/día

_Escribe *5* o *reservar* para apartar_
_Escribe *0* para volver al menú_`;

const MENU_REQUISITOS = `📋 *REQUISITOS PARA RENTAR*
─────────────────────

✈️ *Turistas (vienen de fuera de Mérida):*
• INE, Pasaporte o Identificación oficial vigente
• Licencia de conducir vigente (Nacional, Digital o Extranjera)
• Número de vuelo o comprobante de llegada

🏠 *Locales (residentes en Mérida):*
• INE vigente
• Licencia de conducir vigente
• Comprobante de domicilio a su nombre (luz, agua o teléfono)

─────────────────────
💳 *Pagos:* Efectivo, tarjeta de débito/crédito o transferencia.
🚫 *Sin bloqueos obligatorios de tarjeta de crédito.*

_Escribe *5* o *reservar* para apartar tu auto_
_Escribe *0* para volver al menú_`;

const MENU_UBICACION = `📍 *UBICACIÓN Y CONTACTO*
─────────────────────

🏢 *Oficina y Entrega Base:*
📌 *C. 28 × 25 y 23, Manuel Crescencio Rejón, CP 97255, Mérida, Yucatán* (cerca de la zona del aeropuerto).
🕐 Abierto *24/7*, los 365 días del año.

🚗 *Entrega a Domicilio / Hotel:*
• La entrega y devolución estándar se realiza en nuestra oficina.
• Si requieres que te llevemos el vehículo a tu *Hotel*, *Airbnb*, *Aeropuerto* o *Estación del Tren Maya*, te lo llevamos directamente con un *costo extra accesible*.

📞 *Asesores Directos:*
• Oscar: ${CONFIG.telefonos.asesor1}
• Asesoría 24/7: ${CONFIG.telefonos.asesor2}

🌐 ${CONFIG.web}
📧 ${CONFIG.email}

_Escribe *0* para volver al menú principal_`;

const MENSAJE_ASESOR_OSCAR = `👨‍💼 *Atención Personalizada*
─────────────────────

En un momento te contacta el asesor *Oscar* para atenderte personalmente 📞

📱 *Teléfonos directos:*
• Oscar: ${CONFIG.telefonos.asesor1}
• Asesoría 24/7: ${CONFIG.telefonos.asesor2}

_Escribe *0* para ver el menú principal_`;

const MENU_ELEGIR_AUTO = `🚗 *¿Qué auto te interesa?*
─────────────────────

*1.* Básico (sedán económico) — *$700/día*
*2.* Confort (sedán amplio) — *$800/día*
*3.* SUV de 5 pasajeros — *$1,200/día*
*4.* SUV de 7 pasajeros — *$1,200/día*
*5.* Minivan de 8 pasajeros — *$1,500/día*
*6.* Van de 12-15 pasajeros — *$2,300/día*

_Escribe el número o el nombre del auto_
_Escribe *0* para cancelar_`;

// ============================================================
// 🔧 HELPERS PARA EL FLUJO DE RESERVA
// ============================================================

// Detectar auto por número O por nombre
function detectarAuto(texto) {
  const t = texto.trim().toLowerCase();

  // Por número
  const num = parseInt(t, 10);
  if (num >= 1 && num <= 6) return CONFIG.autos[num - 1];

  // Por nombre (flexible)
  if (t.includes('basic') || t.includes('básic') || t.includes('basico') || t.includes('económi') || t.includes('economi') || t.includes('sedan')) {
    return CONFIG.autos[0]; // Básico
  }
  if (t.includes('confor') || t.includes('comfort') || t.includes('amplio')) {
    return CONFIG.autos[1]; // Confort
  }
  if (t.includes('suv') && (t.includes('5') || t.includes('cinco'))) {
    return CONFIG.autos[2]; // SUV 5
  }
  if (t.includes('suv') && (t.includes('7') || t.includes('siete'))) {
    return CONFIG.autos[3]; // SUV 7
  }
  if (t.includes('suv')) {
    return CONFIG.autos[2]; // SUV default
  }
  if (t.includes('minivan') || t.includes('mini van') || t.includes('8') && t.includes('pasaj')) {
    return CONFIG.autos[4]; // Minivan
  }
  if (t.includes('van') || t.includes('12') || t.includes('15')) {
    return CONFIG.autos[5]; // Van
  }
  return null;
}

// Obtener precio de seguro Full Cover según el auto
function precioFullCover(auto) {
  const nombre = auto.tipo.toLowerCase();
  if (nombre.includes('básico') || nombre.includes('basico')) return CONFIG.seguros[0];
  if (nombre.includes('confort')) return CONFIG.seguros[1];
  if (nombre.includes('suv')) return CONFIG.seguros[2]; // SUV 7 = $500
  if (nombre.includes('minivan')) return CONFIG.seguros[3];
  if (nombre.includes('van')) return CONFIG.seguros[4];
  return CONFIG.seguros[0]; // default
}

// Parsear fechas naturales en español
// Acepta: "del 11 al 15 de julio", "11 al 15 julio", "julio 11-15",
//         "2026-07-11 a 2026-07-15", "11/07 al 15/07", etc.
const MESES = {
  enero: 0, ene: 0,
  febrero: 1, feb: 1,
  marzo: 2, mar: 2,
  abril: 3, abr: 3,
  mayo: 4, may: 4,
  junio: 5, jun: 5,
  julio: 6, jul: 6,
  agosto: 7, ago: 7,
  septiembre: 8, sep: 8, sept: 8,
  octubre: 9, oct: 9,
  noviembre: 10, nov: 10,
  diciembre: 11, dic: 11,
};

function parsearFechas(texto) {
  const t = texto.trim().toLowerCase();
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  // Formato ISO: 2026-07-11 a 2026-07-15
  const isoMatch = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*(?:a|al|-)\s*(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const inicio = new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    const fin = new Date(+isoMatch[4], +isoMatch[5] - 1, +isoMatch[6]);
    if (!isNaN(inicio) && !isNaN(fin) && fin > inicio) return { inicio, fin };
  }

  // "del 11 al 15 de julio", "11 al 15 de julio", "11 a 15 julio"
  const mesNombre = Object.keys(MESES).join('|');
  const regNatural = new RegExp(
    `(?:del?\\s+)?(\\d{1,2})\\s*(?:al?|-)\\s*(\\d{1,2})\\s*(?:de\\s+)?(${mesNombre})(?:\\s+(\\d{4}))?`,
    'i'
  );
  const natMatch = t.match(regNatural);
  if (natMatch) {
    const dia1 = +natMatch[1];
    const dia2 = +natMatch[2];
    const mes = MESES[natMatch[3].toLowerCase()];
    const anio = natMatch[4] ? +natMatch[4] : anioActual;
    const inicio = new Date(anio, mes, dia1);
    const fin = new Date(anio, mes, dia2);
    if (!isNaN(inicio) && !isNaN(fin) && fin > inicio) return { inicio, fin };
  }

  // "julio 11 al 15", "julio 11-15"
  const regMesPrimero = new RegExp(
    `(${mesNombre})\\s+(\\d{1,2})\\s*(?:al?|-)\\s*(\\d{1,2})(?:\\s+(\\d{4}))?`,
    'i'
  );
  const mesPrimMatch = t.match(regMesPrimero);
  if (mesPrimMatch) {
    const mes = MESES[mesPrimMatch[1].toLowerCase()];
    const dia1 = +mesPrimMatch[2];
    const dia2 = +mesPrimMatch[3];
    const anio = mesPrimMatch[4] ? +mesPrimMatch[4] : anioActual;
    const inicio = new Date(anio, mes, dia1);
    const fin = new Date(anio, mes, dia2);
    if (!isNaN(inicio) && !isNaN(fin) && fin > inicio) return { inicio, fin };
  }

  // dd/mm al dd/mm
  const regSlash = t.match(/(\d{1,2})\/(\d{1,2})\s*(?:al?|-)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (regSlash) {
    const anio = regSlash[5] ? +regSlash[5] : anioActual;
    const inicio = new Date(anio, +regSlash[2] - 1, +regSlash[1]);
    const fin = new Date(anio, +regSlash[4] - 1, +regSlash[3]);
    if (!isNaN(inicio) && !isNaN(fin) && fin > inicio) return { inicio, fin };
  }

  return null;
}

function formatFecha(date) {
  const dia = date.getDate();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dia} de ${meses[date.getMonth()]} ${date.getFullYear()}`;
}

function diasEntre(inicio, fin) {
  return Math.ceil(Math.abs(fin - inicio) / (1000 * 60 * 60 * 24));
}

// ============================================================
// 🤖 CONFIGURACIÓN DE IA
// ============================================================

function construirPromptSistema() {
  const autosTexto = CONFIG.autos.map(a => `• ${a.tipo}: ${a.precioDia}${a.desc ? ` - ${a.desc}` : ''}`).join('\n');
  const segurosTexto = CONFIG.seguros.map(s => `• ${s.tipo}: ${s.precioDia}`).join('\n');
  const faqsTexto = (CONFIG.faqs || []).map(f => `P: ${f.q}\nR: ${f.a}`).join('\n\n');

  return `
${CONFIG.instruccionesIA}

=== DATOS DEL NEGOCIO ===
Nombre: ${CONFIG.nombreNegocio}
Horarios: ${CONFIG.horarios}
Ubicación: ${CONFIG.ubicacion}
Asesor 1: ${CONFIG.telefonos.asesor1}
Asesor 2: ${CONFIG.telefonos.asesor2}
Email: ${CONFIG.email}
Web: ${CONFIG.web}
Entregas: ${CONFIG.entregas}
Métodos de pago: ${CONFIG.metodosPago}

=== PRECIOS DE RENTA POR DÍA ===
${autosTexto}

=== PRECIOS DE SEGURO FULL COVER POR DÍA ===
${segurosTexto}

=== SEGURO INCLUIDO ===
${CONFIG.seguroInfo.incluido}

=== SEGURO FULL COVER (OPCIONAL) ===
${CONFIG.seguroInfo.fullCover}

=== REQUISITOS - TURISTAS ===
${CONFIG.requisitos.turistas.map(r => `• ${r}`).join('\n')}

=== REQUISITOS - RESIDENTES DE MÉRIDA ===
${CONFIG.requisitos.locales.map(r => `• ${r}`).join('\n')}

=== PREGUNTAS FRECUENTES Y POLÍTICAS DE RENTA ===
${faqsTexto}

IMPORTANTE: Responde de forma breve, amable y natural. Si el cliente pregunta algo del menú, responde directo.
`.trim();
}

const PROMPT_SISTEMA = construirPromptSistema();
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: PROMPT_SISTEMA,
});

// ============================================================
// 🔄 MÁQUINA DE ESTADOS - FLUJO DE RESERVA
// ============================================================

function getConv(jid) {
  if (!conversaciones.has(jid)) {
    conversaciones.set(jid, {
      historial: [],
      lastActivity: Date.now(),
      reserva: { step: null, data: {} },
    });
  }
  const c = conversaciones.get(jid);
  c.lastActivity = Date.now();
  if (!c.reserva) c.reserva = { step: null, data: {} };
  return c;
}

function cancelarReserva(jid) {
  const c = getConv(jid);
  c.reserva = { step: null, data: {} };
}

// ============================================================
// 🧠 LÓGICA PRINCIPAL
// ============================================================

function esSaludo(texto) {
  const saludos = ['hola', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches',
    'buenas', 'hey', 'hi', 'hello', 'que tal', 'qué tal', 'ola', 'buen día',
    'buenos días', 'inicio', 'empezar'];
  return saludos.includes(texto.toLowerCase().trim());
}

function esMenuVolver(texto) {
  const t = texto.trim().toLowerCase();
  return t === '0' || t === 'menu' || t === 'menú' || t === 'cancelar' || t === 'salir';
}

async function obtenerRespuestaIA(mensajeUsuario, jid) {
  try {
    const conv = getConv(jid);
    conv.historial.push({ role: 'user', parts: [{ text: mensajeUsuario }] });

    while (conv.historial.length > CONFIG.maxHistorial * 2) {
      conv.historial.shift();
    }

    const chat = model.startChat({ history: conv.historial.slice(0, -1) });
    const result = await chat.sendMessage(mensajeUsuario);
    const respuesta = result.response.text();

    conv.historial.push({ role: 'model', parts: [{ text: respuesta }] });
    return respuesta;
  } catch (error) {
    console.error('❌ Error con Gemini:', error.message);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return 'Ahorita tenemos mucha demanda, intenta en unos minutos o márcanos al ' + CONFIG.telefonos.asesor1 + ' 📞';
    }
    return 'Disculpa, no pude procesar tu mensaje. Márcanos al ' + CONFIG.telefonos.asesor1 + ' 📞';
  }
}

// ─── Respuesta principal ───
async function obtenerRespuesta(textoMensaje, jid) {
  const conv = getConv(jid);
  const reserva = conv.reserva;
  const limpio = textoMensaje.trim().toLowerCase();

  // ── SIEMPRE: si escribe 0/menu/cancelar → volver al menú ──
  if (esMenuVolver(limpio)) {
    cancelarReserva(jid);
    return MENU_PRINCIPAL;
  }

  // ── SIEMPRE: si es saludo → menú ──
  if (esSaludo(textoMensaje)) {
    cancelarReserva(jid);
    return MENU_PRINCIPAL;
  }

  // ══════════════════════════════════════════
  // FLUJO DE RESERVA (si hay paso activo)
  // ══════════════════════════════════════════
  if (reserva.step) {

    // ── Paso 1: Elegir auto ──
    if (reserva.step === 'elegirAuto') {
      const auto = detectarAuto(textoMensaje);
      if (!auto) {
        return '❌ No reconocí ese auto. Escribe el *número* (1-6) o el *nombre* (Básico, Confort, SUV, etc.)\n\n' + MENU_ELEGIR_AUTO;
      }
      reserva.data.auto = auto;
      const seguro = precioFullCover(auto);
      reserva.data.seguroInfo = seguro;
      reserva.step = 'elegirFechas';
      return `✅ *${auto.tipo}* — ${auto.precioDia}\n\n📅 ¿Para qué fechas lo necesitas?\n\n_Ejemplo: del 11 al 15 de julio_`;
    }

    // ── Paso 2: Fechas ──
    if (reserva.step === 'elegirFechas') {
      const fechas = parsearFechas(textoMensaje);
      if (!fechas) {
        return '❌ No entendí las fechas. Intenta así:\n• _del 11 al 15 de julio_\n• _julio 11 al 15_\n• _11/07 al 15/07_';
      }
      const dias = diasEntre(fechas.inicio, fechas.fin);
      reserva.data.fechaInicio = fechas.inicio;
      reserva.data.fechaFin = fechas.fin;
      reserva.data.dias = dias;

      const precioAuto = parseInt(reserva.data.auto.precioDia.replace(/[^0-9]/g, ''), 10);
      const totalSinSeguro = precioAuto * dias;

      reserva.step = 'elegirSeguro';
      return `✅ *${dias} día(s)*: ${formatFecha(fechas.inicio)} al ${formatFecha(fechas.fin)}

💰 Renta: ${reserva.data.auto.precioDia} × ${dias} días = *$${totalSinSeguro.toLocaleString()} MXN*

🛡️ ¿Quieres agregar el *Full Cover*? (${reserva.data.seguroInfo.precioDia}/día extra, deducible 0%)

*1.* ✅ Sí, agregar Full Cover
*2.* ❌ No, con el seguro amplio incluido está bien`;
    }

    // ── Paso 3: Seguro ──
    if (reserva.step === 'elegirSeguro') {
      const quiereFC = limpio === '1' || limpio === 'sí' || limpio === 'si' || limpio === 'yes' || limpio.includes('full') || limpio.includes('cover');
      reserva.data.fullCover = quiereFC;
      reserva.step = 'pedirNombre';
      return '👤 Para completar tu reserva, escríbeme tu *nombre completo*:';
    }

    // ── Paso 4: Nombre ──
    if (reserva.step === 'pedirNombre') {
      reserva.data.nombre = textoMensaje.trim();
      reserva.step = 'pedirTelefono';
      return '📞 Tu *número de teléfono* (con lada, ej: 999 123 4567):';
    }

    // ── Paso 5: Teléfono ──
    if (reserva.step === 'pedirTelefono') {
      reserva.data.telefono = textoMensaje.trim();
      reserva.step = 'confirmar';

      // Calcular totales
      const precioAuto = parseInt(reserva.data.auto.precioDia.replace(/[^0-9]/g, ''), 10);
      const precioSeg = reserva.data.fullCover
        ? parseInt(reserva.data.seguroInfo.precioDia.replace(/[^0-9]/g, ''), 10)
        : 0;
      const totalRenta = precioAuto * reserva.data.dias;
      const totalSeguro = precioSeg * reserva.data.dias;
      const totalFinal = totalRenta + totalSeguro;

      reserva.data.totalRenta = totalRenta;
      reserva.data.totalSeguro = totalSeguro;
      reserva.data.totalFinal = totalFinal;

      let resumen = `📝 *RESUMEN DE TU RESERVA*\n─────────────────────\n\n`;
      resumen += `🚗 Auto: *${reserva.data.auto.tipo}*\n`;
      resumen += `📅 ${formatFecha(reserva.data.fechaInicio)} → ${formatFecha(reserva.data.fechaFin)}\n`;
      resumen += `📆 Días: *${reserva.data.dias}*\n`;
      resumen += `💰 Renta: $${totalRenta.toLocaleString()} MXN\n`;
      if (reserva.data.fullCover) {
        resumen += `🛡️ Full Cover: $${totalSeguro.toLocaleString()} MXN\n`;
      } else {
        resumen += `🛡️ Seguro: Amplio incluido (10% deducible)\n`;
      }
      resumen += `\n─────────────────────\n💵 *TOTAL: $${totalFinal.toLocaleString()} MXN*\n`;
      resumen += `\n👤 ${reserva.data.nombre}\n📞 ${reserva.data.telefono}\n\n`;
      resumen += `¿Todo correcto?\n\n*1.* ✅ Confirmar reserva\n*2.* ❌ Cancelar`;

      return resumen;
    }

    // ── Paso 6: Confirmar ──
    if (reserva.step === 'confirmar') {
      if (limpio === '1' || limpio === 'sí' || limpio === 'si' || limpio === 'yes' || limpio.includes('confirma')) {
        // Guardar lead
        const lead = {
          jid,
          auto: reserva.data.auto.tipo,
          precioAutoDia: reserva.data.auto.precioDia,
          fullCover: reserva.data.fullCover,
          dias: reserva.data.dias,
          fechaInicio: formatFecha(reserva.data.fechaInicio),
          fechaFin: formatFecha(reserva.data.fechaFin),
          nombre: reserva.data.nombre,
          telefono: reserva.data.telefono,
          totalRenta: `$${reserva.data.totalRenta.toLocaleString()} MXN`,
          totalSeguro: reserva.data.fullCover ? `$${reserva.data.totalSeguro.toLocaleString()} MXN` : 'Incluido',
          totalFinal: `$${reserva.data.totalFinal.toLocaleString()} MXN`,
          timestamp: new Date().toISOString(),
        };
        guardarLead(lead);

        // Reset
        cancelarReserva(jid);

        return `🎉 *¡Reserva registrada exitosamente!*
─────────────────────

Un asesor te contactará pronto al *${lead.telefono}* para confirmar disponibilidad y coordinar la entrega.

📞 *¿Algo urgente?*
• ${CONFIG.telefonos.asesor1}
• ${CONFIG.telefonos.asesor2}

¡Gracias por elegir *Chip Rent a Car*! 🚗✨

_Escribe *0* para volver al menú_`;
      } else {
        cancelarReserva(jid);
        return '❌ Reserva cancelada. Sin problema, cuando quieras la hacemos de nuevo 👍\n\n_Escribe *0* para ver el menú_';
      }
    }
  }

// ─── Detector Inteligente de Intenciones ───
function detectarIntencion(texto) {
  const t = texto.toLowerCase().trim();

  // 1. Requisitos (Prioridad alta para no confundir con "rentar")
  if (
    t.includes('requisito') ||
    t.includes('papeles') ||
    t.includes('documento') ||
    t.includes('licencia') ||
    t.includes('edad') ||
    t.includes('pasaporte') ||
    t.includes('ine') ||
    t.includes('que necesito') ||
    t.includes('qué necesito') ||
    t.includes('que piden') ||
    t.includes('qué piden') ||
    t.includes('que ocupo') ||
    t.includes('qué ocupo')
  ) {
    return 'requisitos';
  }

  // 2. Precios / Cotización / Catálogo / Autos
  if (
    t.includes('precio') ||
    t.includes('cuanto cuesta') ||
    t.includes('cuánto cuesta') ||
    t.includes('cuanto sale') ||
    t.includes('cuánto sale') ||
    t.includes('cotiza') ||
    t.includes('catalogo') ||
    t.includes('catálogo') ||
    t.includes('que autos') ||
    t.includes('qué autos') ||
    t.includes('que carros') ||
    t.includes('qué carros') ||
    t.includes('modelos') ||
    t.includes('flota') ||
    t.includes('coches') ||
    t.includes('carros') ||
    t.includes('tarifas') ||
    t.includes('costo')
  ) {
    return 'autos';
  }

  // 3. Ubicación / Dónde están / Contacto / Dirección
  if (
    t.includes('ubicacion') ||
    t.includes('ubicación') ||
    t.includes('donde estan') ||
    t.includes('dónde están') ||
    t.includes('donde quedan') ||
    t.includes('dónde quedan') ||
    t.includes('donde se encuentran') ||
    t.includes('dónde se encuentran') ||
    t.includes('direccion') ||
    t.includes('dirección') ||
    t.includes('sucursal') ||
    t.includes('oficina') ||
    t.includes('telefono') ||
    t.includes('teléfono') ||
    t.includes('contacto') ||
    t.includes('como llego') ||
    t.includes('cómo llego')
  ) {
    return 'ubicacion';
  }

  // 4. Seguros / Coberturas
  if (
    t.includes('seguro') ||
    t.includes('cobertura') ||
    t.includes('full cover') ||
    t.includes('deducible') ||
    t.includes('poliza') ||
    t.includes('póliza') ||
    t.includes('choque') ||
    t.includes('danos a terceros') ||
    t.includes('daños a terceros')
  ) {
    return 'seguros';
  }

  // 5. Contactar al asesor Oscar / Humano
  if (
    t.includes('asesor') ||
    t.includes('oscar') ||
    t.includes('humano') ||
    t.includes('persona') ||
    t.includes('hablar con alguien') ||
    t.includes('agente') ||
    t.includes('llamar')
  ) {
    return 'asesor';
  }

  // 6. Reservar / Apartar explícito
  if (
    t === '5' ||
    t === 'reservar' ||
    t === 'quiero reservar' ||
    t === 'hacer reserva' ||
    t === 'apartar' ||
    t === 'quiero apartar' ||
    t === 'rentar' ||
    t === 'rentar auto' ||
    t.startsWith('reservar ') ||
    t.startsWith('apartar ')
  ) {
    return 'reservar';
  }

  return null;
}

  // ══════════════════════════════════════════
  // MENÚ Y ENRUTAMIENTO INTELIGENTE
  // ══════════════════════════════════════════

  const intencion = detectarIntencion(textoMensaje);

  // Opción 1 o intención Autos/Precios/Cotización
  if (limpio === '1' || intencion === 'autos') {
    cancelarReserva(jid);
    return MENU_AUTOS;
  }

  // Opción 2 o intención Seguros
  if (limpio === '2' || intencion === 'seguros') {
    cancelarReserva(jid);
    return MENU_SEGUROS;
  }

  // Opción 3 o intención Requisitos
  if (limpio === '3' || intencion === 'requisitos') {
    cancelarReserva(jid);
    return MENU_REQUISITOS;
  }

  // Opción 4 o intención Ubicación/Contacto
  if (limpio === '4' || intencion === 'ubicacion') {
    cancelarReserva(jid);
    return MENU_UBICACION;
  }

  // Opción 6 o intención Asesor Oscar
  if (limpio === '6' || intencion === 'asesor') {
    cancelarReserva(jid);
    return MENSAJE_ASESOR_OSCAR;
  }

  // Opción 5 o intención Reservar
  if (limpio === '5' || intencion === 'reservar') {
    reserva.step = 'elegirAuto';
    return '📅 *¡Vamos a reservar!*\n\n' + MENU_ELEGIR_AUTO;
  }

  // Cualquier otra consulta libre o pregunta compleja → Asesor IA (Gemini)
  const respuestaIA = await obtenerRespuestaIA(textoMensaje, jid);
  return respuestaIA + '\n\n_Escribe *0* para ver el menú_';
}

// ============================================================
// 📱 CONEXIÓN WHATSAPP
// ============================================================

let isConnecting = false;
let reconnectTimer = null;

async function iniciarBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (isConnecting) return;
  isConnecting = true;

  if (activeSock) {
    try {
      activeSock.ev.removeAllListeners();
      activeSock.end();
    } catch (e) {}
    activeSock = null;
  }

  console.log('\n🚗 ═══════════════════════════════════════════');
  console.log(`   ${CONFIG.nombreNegocio} - Bot de WhatsApp`);
  console.log('═══════════════════════════════════════════════\n');

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📱 Usando versión de WhatsApp Web v${version.join('.')}`);

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      markOnlineOnConnect: false,
    });
    activeSock = sock;
    isConnecting = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr: qrCode } = update;

      if (qrCode) {
        console.log('📱 Generando QR para la pantalla web y terminal...');
        qrcode.generate(qrCode, { small: true });

        try {
          currentQRDataUrl = await QRCode.toDataURL(qrCode, { margin: 2, scale: 8 });
          console.log('✅ QR generado exitosamente.');
        } catch (err) {
          console.error('Error generando QR:', err);
        }
      }

      if (connection === 'close') {
        botConnected = false;
        activeSock = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`⚠️ Conexión cerrada. Código: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          console.log('🚪 Sesión cerrada (401). Limpiando credenciales...');
          try {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
          } catch (err) {}
          currentQRDataUrl = null;
        }

        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            iniciarBot();
          }, 5000);
        }
      }

      if (connection === 'open') {
        botConnected = true;
        currentQRDataUrl = null;
        console.log('✅ ¡Conectado exitosamente a WhatsApp!');
        console.log('🤖 Bot activo y respondiendo.\n');
      }
    });

    sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return;

    for (const msg of event.messages) {
      try {
        const jid = msg.key.remoteJid;
        if (msg.key.fromMe) continue;
        if (jid?.endsWith('@g.us')) continue;
        if (jid === 'status@broadcast') continue;

        // 🚫 Si es contacto personal / excluido, ignorar para permitir chat manual
        if (esContactoExcluido(jid)) {
          console.log(`🔇 Contacto personal / excluido (${jid.split('@')[0]}): bot en silencio.`);
          continue;
        }

        const textoMensaje =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          null;

        if (!textoMensaje) {
          await delay(CONFIG.delayRespuesta);
          await sock.sendMessage(jid, {
            text: '📝 Por el momento solo puedo leer mensajes de texto. ¿Podrías escribirme tu pregunta? 😊',
          });
          continue;
        }

        if (respuestasEnUltimoMinuto >= CONFIG.maxRespuestasPorMinuto) {
          console.log(`⏳ Rate limit alcanzado, ignorando mensaje de ${jid}`);
          continue;
        }

        console.log(`📩 Mensaje de ${jid.split('@')[0]}: "${textoMensaje.substring(0, 50)}..."`);

        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate('composing', jid);
        await delay(CONFIG.delayRespuesta);

        const respuesta = await obtenerRespuesta(textoMensaje, jid);

        await sock.sendPresenceUpdate('paused', jid);
        await sock.sendMessage(jid, { text: respuesta });

        respuestasEnUltimoMinuto++;
        console.log(`✅ Respondido a ${jid.split('@')[0]} (${respuestasEnUltimoMinuto}/${CONFIG.maxRespuestasPorMinuto} min)`);

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);
      }
    }
  });
  } catch (err) {
    isInitializing = false;
    console.error('⚠️ Error iniciando socket:', err.message);
  }
}

// ─── Utilidades y arranque ───
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🚀 Iniciando bot...');
iniciarBot().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});

process.on('SIGINT', () => { console.log('\n\n👋 Bot detenido.\n'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n\n👋 Bot detenido por el sistema.\n'); process.exit(0); });
process.on('uncaughtException', (err) => { console.error('💥 Error no capturado:', err.message); });
process.on('unhandledRejection', (err) => { console.error('💥 Promesa rechazada:', err); });
