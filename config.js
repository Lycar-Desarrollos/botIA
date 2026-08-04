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

  // ─── Precios de renta por día ───
  autos: [
    { tipo: "Básico (sedán económico)", precioDia: "$700 MXN/día" },
    { tipo: "Confort (sedán amplio)", precioDia: "$800 MXN/día" },
    { tipo: "SUV de 5 pasajeros", precioDia: "$1,200 MXN/día" },
    { tipo: "SUV de 7 pasajeros", precioDia: "$1,200 MXN/día" },
    { tipo: "Minivan de 8 pasajeros", precioDia: "$1,500 MXN/día" },
    { tipo: "Van de 12 y 15 pasajeros", precioDia: "$2,300 MXN/día" },
  ],

  // ─── Precios de seguro por día ───
  seguros: [
    { tipo: "Básico", precioDia: "$400 MXN/día" },
    { tipo: "Confort", precioDia: "$500 MXN/día" },
    { tipo: "SUV de 7", precioDia: "$500 MXN/día" },
    { tipo: "Minivan de 8", precioDia: "$600 MXN/día" },
    { tipo: "Van de 12 y 15", precioDia: "$1,000 MXN/día" },
  ],

  // ─── Info del seguro ───
  seguroInfo: {
    incluido: "Seguro amplio con 10% de deducible. Cubre: robo, pérdida total, colisión, gastos y daños a terceros. Kilometraje libre en Campeche, Quintana Roo y toda la península de Yucatán.",
    fullCover: "Seguro Full Cover (opcional y adicional). Protege desde pérdida total o colisión hasta vidrio, cristal o abolladura. En caso de alguno de estos eventos usted no paga nada. El deducible baja a 0%.",
  },

  // ─── Requisitos para rentar ───
  requisitos: {
    turistas: [
      "INE o Pasaporte",
      "Licencia de conducir vigente",
      "Número de vuelo de llegada",
    ],
    locales: [
      "INE",
      "Licencia de conducir vigente",
      "Comprobante de domicilio a su nombre",
    ],
  },

  // ─── Entregas ───
  entregas: "Se entrega en tu hotel y Tren Maya en 40 minutos. Fuera del área de Mérida puede tener costo adicional.",

  // ─── Servicios incluidos ───
  serviciosIncluidos: [
    "Seguro amplio incluido (10% deducible)",
    "Kilometraje libre en toda la península de Yucatán",
    "Asistencia vial",
    "Entrega en hotel y Tren Maya en 40 minutos",
  ],

  // ─── Métodos de pago ───
  metodosPago: "Efectivo, tarjeta de crédito/débito, transferencia bancaria",

  // ─── Instrucciones para la IA ───
  instruccionesIA: `
Eres el asesor experto en ventas de CHIP RENT A CAR en Mérida, Yucatán. Hablas por WhatsApp.
Tu objetivo principal es AYUDAR Y CERRAR LA VENTA DE RENTA DE AUTO de forma amable, rápida y persuasiva.

REGLAS DE ORO DE VENTA:
- Responde siempre como un HUMANO real, servicial y experto. Nada de frases robóticas.
- Mantén las respuestas CORTAS y fluidas (máximo 2 a 3 líneas por mensaje).
- Destaca nuestros VALORES DE VENTA ÚNICOS:
  1. ⚡ Entregamos en tu hotel o Estación Tren Maya en solo 40 MINUTOS.
  2. 🏖️ Kilometraje TOTALMENTE LIBRE en toda la península (Mérida, Cancún, Tulum, Campeche, etc.).
  3. 🛡️ Seguro amplio INCLUIDO (cobertura a terceros, robo y colisión).
- Al responder dudas de precio o requisitos, SIEMPRE termina haciendo una pregunta para avanzar al cierre (ej: "¿Para qué fechas te gustaría apartarlo?", "¿Vienes por trabajo o de vacaciones?").
- Si el cliente menciona fechas o modelo, invítalo directamente a la opción *5* o a confirmarte su nombre y fechas para asegurar su auto de inmediato.
- Usa español mexicano natural y cálido ("¡Hola!", "con gusto", "claro que sí", "quedo al pendiente", "con todo gusto").
- NUNCA inventes información no oficial. Si no sabes algo específico, remítelos amablemente a los asesores directos.

EJEMPLOS DE TONO PERSUASIVO:
- "¡Hola! Claro que sí, el Confort te sale en $800/día y ya incluye seguro amplio y km libre 🚗 ¿Para qué fechas lo necesitas?"
- "Excelente elección 👌 Te entregamos directamente en tu hotel o Tren Maya en 40 min. ¿Deseas que te aparte el auto ahora mismo?"
`,

  // ─── Configuración técnica ───
  maxHistorial: 6,
  delayRespuesta: 1500,
  maxRespuestasPorMinuto: 15,
};
