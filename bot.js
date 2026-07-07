// ============================================================
// 🤖 BOT DE WHATSAPP CON IA - RENTA DE AUTOS
// ============================================================
// Ejecutar: npm start
// Primera vez: escanear QR con el celular del chip dedicado
// ============================================================

import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from 'baileys';
import { GoogleGenerativeAI } from '@google/generative-ai';
import qrcode from 'qrcode-terminal';
import { CONFIG } from './config.js';

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

// ─── Almacén de historial de conversaciones ───
const conversaciones = new Map();

// ─── Rate limiter simple ───
let respuestasEnUltimoMinuto = 0;
setInterval(() => {
  respuestasEnUltimoMinuto = 0;
}, 60_000);

// ─── Limpieza de conversaciones viejas (cada 30 min) ───
setInterval(() => {
  const ahora = Date.now();
  for (const [jid, data] of conversaciones) {
    // Si no hay mensajes o el último fue hace más de 2 horas, limpiar
    if (!data.length || (data._lastActivity && ahora - data._lastActivity > 2 * 60 * 60 * 1000)) {
      conversaciones.delete(jid);
    }
  }
  console.log(`🧹 Limpieza: ${conversaciones.size} conversaciones activas`);
}, 30 * 60 * 1000);

// ─── Construir el prompt del sistema con la info del negocio ───
function construirPromptSistema() {
  const autosTexto = CONFIG.autos
    .map(a => `• ${a.tipo}: ${a.precioDia}`)
    .join('\n');

  const requisitosTexto = CONFIG.requisitos
    .map(r => `• ${r}`)
    .join('\n');

  const serviciosTexto = CONFIG.serviciosIncluidos
    .map(s => `• ${s}`)
    .join('\n');

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
Métodos de pago: ${CONFIG.metodosPago}

=== VEHÍCULOS DISPONIBLES ===
${autosTexto}

=== REQUISITOS PARA RENTAR ===
${requisitosTexto}

=== SERVICIOS INCLUIDOS ===
${serviciosTexto}
`.trim();
}

const PROMPT_SISTEMA = construirPromptSistema();

// ─── Crear modelo con instrucciones del sistema ───
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: PROMPT_SISTEMA,
});

// ─── Obtener respuesta de la IA ───
async function obtenerRespuestaIA(mensajeUsuario, jid) {
  try {
    // Obtener o crear historial de esta conversación
    if (!conversaciones.has(jid)) {
      conversaciones.set(jid, []);
    }
    const historial = conversaciones.get(jid);

    // Agregar mensaje del usuario al historial
    historial.push({ role: 'user', parts: [{ text: mensajeUsuario }] });

    // Mantener solo los últimos N mensajes
    while (historial.length > CONFIG.maxHistorial * 2) {
      historial.shift();
    }

    // Llamar a Gemini con historial
    const chat = model.startChat({
      history: historial.slice(0, -1),
    });

    const result = await chat.sendMessage(mensajeUsuario);
    const respuesta = result.response.text();

    // Guardar respuesta en historial
    historial.push({ role: 'model', parts: [{ text: respuesta }] });

    return respuesta;
  } catch (error) {
    console.error('❌ Error con Gemini:', error.message);

    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return 'Ahorita tenemos mucha demanda, intenta en unos minutos o márcanos al ' + CONFIG.telefonos.asesor1 + ' 📞';
    }

    return 'Disculpa, no pude procesar tu mensaje. ¿Me lo repites? O si prefieres, márcanos al ' + CONFIG.telefonos.asesor1 + ' 📞';
  }
}

// ─── Función principal de conexión ───
async function iniciarBot() {
  console.log('\n🚗 ═══════════════════════════════════════════');
  console.log(`   ${CONFIG.nombreNegocio} - Bot de WhatsApp`);
  console.log('═══════════════════════════════════════════════\n');

  // Cargar o crear sesión
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  // Crear conexión
  const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false, // No marcar como "en línea" para recibir notificaciones
  });

  // ─── Evento: Actualización de conexión ───
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr: qrCode } = update;

    if (qrCode) {
      console.log('\n📱 Escanea este QR con el WhatsApp del chip dedicado:\n');
      qrcode.generate(qrCode, { small: true });
      console.log('\n   (Abre WhatsApp > Menú > Dispositivos vinculados > Vincular dispositivo)\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`\n⚠️  Conexión cerrada. Código: ${statusCode}`);

      if (shouldReconnect) {
        console.log('🔄 Reconectando en 5 segundos...\n');
        setTimeout(iniciarBot, 5000);
      } else {
        console.log('🚪 Sesión cerrada. Elimina la carpeta auth_info_baileys/ y vuelve a escanear el QR.\n');
      }
    }

    if (connection === 'open') {
      console.log('✅ ¡Conectado exitosamente a WhatsApp!');
      console.log('🤖 El bot está activo y respondiendo mensajes.');
      console.log('📊 Presiona Ctrl+C para detener.\n');
    }
  });

  // ─── Evento: Guardar credenciales ───
  sock.ev.on('creds.update', saveCreds);

  // ─── Evento: Mensajes entrantes ───
  sock.ev.on('messages.upsert', async (event) => {
    // Solo procesar mensajes nuevos (no historial)
    if (event.type !== 'notify') return;

    for (const msg of event.messages) {
      try {
        // ── Filtros: ignorar lo que no necesitamos ──
        const jid = msg.key.remoteJid;

        // Ignorar mensajes propios
        if (msg.key.fromMe) continue;

        // Ignorar mensajes de grupos (terminan en @g.us)
        if (jid?.endsWith('@g.us')) continue;

        // Ignorar estados/historias (status@broadcast)
        if (jid === 'status@broadcast') continue;

        // Ignorar mensajes sin contenido de texto
        const textoMensaje =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          null;

        if (!textoMensaje) {
          // Si envían audio, imagen sin texto, sticker, etc.
          await delay(CONFIG.delayRespuesta);
          await sock.sendMessage(jid, {
            text: '📝 Por el momento solo puedo leer mensajes de texto. ¿Podrías escribirme tu pregunta? 😊',
          });
          continue;
        }

        // ── Rate limiting ──
        if (respuestasEnUltimoMinuto >= CONFIG.maxRespuestasPorMinuto) {
          console.log(`⏳ Rate limit alcanzado, ignorando mensaje de ${jid}`);
          continue;
        }

        console.log(`📩 Mensaje de ${jid.split('@')[0]}: "${textoMensaje.substring(0, 50)}..."`);

        // ── Simular "escribiendo..." ──
        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate('composing', jid);

        // ── Esperar un poco (simula escritura natural) ──
        await delay(CONFIG.delayRespuesta);

        // ── Obtener respuesta de la IA ──
        const respuesta = await obtenerRespuestaIA(textoMensaje, jid);

        // ── Enviar respuesta ──
        await sock.sendPresenceUpdate('paused', jid);
        await sock.sendMessage(jid, { text: respuesta });

        respuestasEnUltimoMinuto++;
        console.log(`✅ Respondido a ${jid.split('@')[0]} (${respuestasEnUltimoMinuto}/${CONFIG.maxRespuestasPorMinuto} este minuto)`);

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);
      }
    }
  });
}

// ─── Utilidad: delay ───
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Arrancar el bot ───
console.log('🚀 Iniciando bot...');
iniciarBot().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});

// ─── Manejar cierre limpio ───
process.on('SIGINT', () => {
  console.log('\n\n👋 Bot detenido. ¡Hasta luego!\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Bot detenido por el sistema.\n');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Error no capturado:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Promesa rechazada:', err);
});
