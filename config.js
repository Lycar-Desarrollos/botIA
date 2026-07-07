// ============================================================
// 📋 CONFIGURACIÓN DE CHIP RENT A CAR
// ============================================================

export const CONFIG = {

  // ─── Nombre del negocio ───
  nombreNegocio: "CHIP RENT A CAR",

  // ─── Horarios de atención ───
  horarios: "Siempre abierto - 24/7, los 365 días del año",

  // ─── Ubicación ───
  ubicacion: "Manuel Crecencio Rejón, Mérida, Yucatán, México, CP 97255",

  // ─── Teléfonos de contacto ───
  telefonos: {
    asesor1: "+52 999 958 8566",
    asesor2: "+52 999 552 6896",
  },

  // ─── Email ───
  email: "oscarcallin1978@icloud.com",

  // ─── Sitio web ───
  web: "https://chiprentacar.com",

  // ─── Facebook ───
  facebook: "https://www.facebook.com/p/Renta-de-autos-merida-yucatan-100063970773334/",

  // ─── Autos disponibles y precios (EDITA CON TUS PRECIOS REALES) ───
  autos: [
    { tipo: "Sedán económico (Nissan Versa, Chevrolet Aveo o similar)", precioDia: "Consultar disponibilidad" },
    { tipo: "SUV compacta (Nissan Kicks, Honda HR-V o similar)", precioDia: "Consultar disponibilidad" },
    { tipo: "Camioneta (Nissan NP300 o similar)", precioDia: "Consultar disponibilidad" },
    { tipo: "Auto compacto (Toyota Yaris, Suzuki Swift o similar)", precioDia: "Consultar disponibilidad" },
  ],

  // ─── Requisitos para rentar ───
  requisitos: [
    "Identificación oficial vigente (INE o Pasaporte)",
    "Licencia de conducir vigente",
    "Tarjeta de crédito o débito para garantía",
    "Ser mayor de 21 años",
  ],

  // ─── Servicios incluidos ───
  serviciosIncluidos: [
    "Seguro básico incluido",
    "Kilometraje ilimitado",
    "Asistencia vial",
    "Entrega y recolección (consultar zonas)",
  ],

  // ─── Métodos de pago ───
  metodosPago: "Efectivo, tarjeta de crédito/débito, transferencia bancaria",

  // ─── Instrucciones para la IA ───
  instruccionesIA: `
Eres un asesor de CHIP RENT A CAR en Mérida, Yucatán. Hablas por WhatsApp.

REGLAS IMPORTANTES:
- Responde como un HUMANO real, no como robot. Sé natural, cálido y directo.
- Respuestas CORTAS: máximo 2-3 líneas. La gente no lee mucho en WhatsApp.
- Usa español mexicano natural. Di "órale", "va", "con gusto", "claro que sí".
- Usa pocos emojis, solo cuando sea natural (1-2 por mensaje máximo).
- NO uses listas largas ni formatos tipo correo. Escribe como chat normal.
- Tutea al cliente.
- Si preguntan precios exactos que NO tengas, di algo como "déjame checarlo y te confirmo en un momento" o dales el rango general.
- Si el cliente quiere RESERVAR, pídele: qué tipo de auto, fechas, y su nombre. Dile que un asesor confirmará disponibilidad y precio final.
- Si preguntan algo que no tiene que ver con renta de autos, amablemente redirige.
- NUNCA inventes precios específicos si no los tienes.
- Si el cliente necesita hablar con alguien, dale los números de los asesores.
- Menciona que estamos en Mérida, Yucatán cuando sea relevante.
- Responde RÁPIDO y al grano. Nada de párrafos largos.

EJEMPLOS DE TONO:
- "¡Hola! Claro, tenemos varios autos disponibles 🚗 ¿Para qué fechas lo necesitas?"
- "Va, déjame checarte la disponibilidad. ¿Sedán o SUV?"
- "Con gusto te ayudo. ¿Es para uso en la ciudad o vas a salir a carretera?"
`,

  // ─── Configuración técnica ───
  maxHistorial: 6,               // Mensajes a recordar por conversación
  delayRespuesta: 1500,          // Milisegundos de espera (más rápido y natural)
  maxRespuestasPorMinuto: 15,    // Límite de respuestas por minuto
};
