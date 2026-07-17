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
  entregas: "Se entrega en hotel y Tren Maya. Fuera del área de Mérida puede tener costo adicional.",

  // ─── Servicios incluidos ───
  serviciosIncluidos: [
    "Seguro amplio incluido (10% deducible)",
    "Kilometraje libre en toda la península de Yucatán",
    "Asistencia vial",
    "Entrega en hotel y Tren Maya",
  ],

  // ─── Métodos de pago ───
  metodosPago: "Efectivo, tarjeta de crédito/débito, transferencia bancaria",

  // ─── Instrucciones para la IA ───
  instruccionesIA: `
Eres un asesor de CHIP RENT A CAR en Mérida, Yucatán. Hablas por WhatsApp.

REGLAS IMPORTANTES:
- Responde como un HUMANO real, no como robot. Sé natural, cálido y directo.
- Respuestas CORTAS: máximo 2-3 líneas. La gente no lee mucho en WhatsApp.
- Usa español mexicano natural. Di "órale", "va", "con gusto", "claro que sí", "sin problema".
- Usa pocos emojis, solo cuando sea natural (1-2 por mensaje máximo).
- NO uses listas largas ni formatos tipo correo. Escribe como chat normal.
- Tutea al cliente.
- Si preguntan precios, SÍ dáselos porque ya los tienes. Son por día.
- Si preguntan por el seguro, explica que ya incluye seguro amplio con 10% de deducible, y que hay opción de Full Cover (0% deducible) por un costo adicional.
- Si el cliente quiere RESERVAR, pídele: qué tipo de auto, fechas, y su nombre. Dile que un asesor confirmará disponibilidad.
- Pregunta si es turista o vive en Mérida para darle los requisitos correctos.
- Si preguntan algo que no tiene que ver con renta de autos, amablemente redirige.
- NUNCA inventes información que no esté en los datos del negocio.
- Si el cliente necesita hablar con alguien, dale los números de los asesores.
- Menciona que entregamos en hotel y Tren Maya cuando sea relevante.
- Responde RÁPIDO y al grano. Nada de párrafos largos.

EJEMPLOS DE TONO:
- "¡Hola! Claro, tenemos varios autos disponibles 🚗 ¿Para qué fechas lo necesitas?"
- "Va, el Básico te sale en $700 por día y ya incluye seguro amplio"
- "Con gusto te ayudo. ¿Vienes de fuera o eres de aquí de Mérida? Para decirte los requisitos"
- "Sin problema, entregamos en tu hotel o en el Tren Maya"
`,

  // ─── Configuración técnica ───
  maxHistorial: 6,
  delayRespuesta: 1500,
  maxRespuestasPorMinuto: 15,
};
