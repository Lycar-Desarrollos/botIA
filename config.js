// ============================================================
// 📋 CONFIGURACIÓN Y CONOCIMIENTO COMPLETO - CHIP RENT A CAR
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
    { tipo: "Básico (sedán económico)", precioDia: "$700 MXN/día", desc: "Económico y eficiente, ideal para 4 personas y ciudad/carretera." },
    { tipo: "Confort (sedán amplio)", precioDia: "$800 MXN/día", desc: "Espacioso, cajuela amplia, ideal para 5 personas y viajes largos." },
    { tipo: "SUV de 5 pasajeros", precioDia: "$1,200 MXN/día", desc: "Caminos altos, mayor comodidad y visibilidad en carretera." },
    { tipo: "SUV de 7 pasajeros", precioDia: "$1,200 MXN/día", desc: "Ideal para familias medianas con equipaje." },
    { tipo: "Minivan de 8 pasajeros", precioDia: "$1,500 MXN/día", desc: "Excelente espacio interior y confort para viajes grupales." },
    { tipo: "Van de 12 y 15 pasajeros", precioDia: "$2,300 MXN/día", desc: "Para grupos grandes o tours por toda la península." },
  ],

  // ─── Precios de seguro por día ───
  seguros: [
    { tipo: "Básico", precioDia: "$400 MXN/día" },
    { tipo: "Confort", precioDia: "$500 MXN/día" },
    { tipo: "SUV de 5 y 7", precioDia: "$500 MXN/día" },
    { tipo: "Minivan de 8", precioDia: "$600 MXN/día" },
    { tipo: "Van de 12 y 15", precioDia: "$1,000 MXN/día" },
  ],

  // ─── Info del seguro ───
  seguroInfo: {
    incluido: "Seguro amplio incluido en la tarifa diaria con 10% de deducible. Cubre: robo total, pérdida total, colisión, gastos médicos a ocupantes y daños a terceros. Kilometraje TOTALMENTE LIBRE en Campeche, Quintana Roo y toda la península.",
    fullCover: "Seguro Full Cover (opcional). Protege contra cualquier eventualidad (cristales, llantas, abolladuras o choques) bajando el deducible a 0%. ¡En caso de cualquier percance usted no paga nada!",
  },

  // ─── Requisitos para rentar ───
  requisitos: {
    turistas: [
      "INE, Pasaporte o Identificación oficial",
      "Licencia de conducir vigente (Nacional, Extranjera o Digital)",
      "Número de vuelo de llegada o itinerario",
    ],
    locales: [
      "INE vigente",
      "Licencia de conducir vigente",
      "Comprobante de domicilio a su nombre (Luz, agua o teléfono)",
    ],
  },

  // ─── Entregas ───
  entregas: "Entrega express en 40 minutos en tu Hotel, Airbnb, Aeropuerto de Mérida o Estación del Tren Maya (Teya/Aeropuerto). Sin demoras ni filas.",

  // ─── Servicios incluidos ───
  serviciosIncluidos: [
    "Seguro amplio incluido (10% deducible)",
    "Kilometraje libre en toda la península de Yucatán",
    "Asistencia vial 24/7 en carretera",
    "Entrega express en hotel, aeropuerto y Tren Maya en 40 minutos",
    "Sillas para bebé o conductor adicional previa solicitud",
  ],

  // ─── Métodos de pago y depósito ───
  metodosPago: "Efectivo, transferencia bancaria, tarjeta de débito y crédito (Visa, Mastercard, AMEX). Depósitos de garantía flexibles.",

  // ─── Preguntas Frecuentes (Base de Conocimiento para la IA) ───
  faqs: [
    { q: "¿Se puede viajar a Cancún, Tulum o Holbox?", a: "¡Sí! Todos nuestros vehículos cuentan con KILOMETRAJE LIBRE sin costo extra para viajar por todo Yucatán, Quintana Roo (Cancún, Playa del Carmen, Tulum, Bacalar, Holbox) y Campeche." },
    { q: "¿Piden tarjeta de crédito obligatoria para depósito?", a: "Aceptamos tarjeta de crédito, débito o depósito accesible según la categoría del auto. ¡Nos adaptamos para brindarte la mejor atención!" },
    { q: "¿Aceptan licencia de otro país o digital?", a: "Sí, aceptamos licencias vigentes nacionales de México, licencias extranjeras (EEUU, Canadá, Europa, etc.) y licencias digitales oficiales." },
    { q: "¿Cuál es la edad mínima?", a: "A partir de 21 años con licencia vigente. Si tienes entre 18 y 20 años pregúntanos por las condiciones especiales." },
    { q: "¿Cómo es la entrega del vehículo?", a: "Te llevamos el auto directamente a donde estés (Hotel, Airbnb, Aeropuerto o Estación Tren Maya) en 40 minutos. Un asesor te entrega llaves, contrato impreso y revisan el auto juntos." },
    { q: "¿Política de gasolina?", a: "Justo por justo: te entregamos el auto con nivel de gasolina e inspeccionado, y lo devuelves con la misma cantidad." },
    { q: "¿Recomiendan lugares para visitar en auto en Yucatán?", a: "¡Claro! En auto propio con km libre puedes ir cómodamente a Chichén Itzá, Cenotes de Homún/San Ignacio, Izamal, Valladolid, Las Coloradas, Celestún o la ruta de cenotes de Cuzamá." }
  ],

  // ─── Instrucciones avanzadas para la IA ───
  instruccionesIA: `
Eres el asesor experto en ventas de CHIP RENT A CAR en Mérida, Yucatán. Tu objetivo es AYUDAR Y CERRAR LA VENTA de renta de autos en WhatsApp de forma sumamente servicial, profesional y persuasiva.

REGLAS DE ORO DE VENTA Y CONVERSIÓN:
1. 🗣️ **Tono Humano y Cálido:** Responde con la calidez y amabilidad de un yucateco servicial. Evita sonar como un bot o plantilla tiesa. Usa respuestas directas y cortas (máximo 2 a 4 líneas por mensaje).
2. ⚡ **Destaca nuestros 3 Beneficios Estrella:**
   - **Entrega en 40 minutos** en Hotel, Airbnb o Tren Maya.
   - **Kilometraje TOTALMENTE LIBRE** para recorrer Mérida, Cancún, Tulum, Bacalar y toda la península.
   - **Seguro amplio INCLUIDO** en la tarifa diaria (cobertura a terceros, robo y colisión).
3. 🎯 **Técnica de Cierre Constante:** Toda respuesta debe terminar con una pregunta amable orientada a concretar o avanzar la reserva (ejemplo: "¿Para qué fechas te gustaría apartarlo?", "¿En qué hotel te hospedarás para llevártelo?").
4. 🌴 **Recomendaciones Locales:** Si el usuario menciona que va a cenotes, Chichén Itzá o Cancún, felicítalo y recomiéndale el auto ideal para su trayecto (Sedán Confort o SUV).
5. 💳 **Facilidad de Pago:** Destaca que aceptamos efectivo, transferencia o tarjeta, sin trabas difíciles.
6. 🚫 **Cero Inventos:** Usa únicamente la información y precios oficiales. Si preguntan por algo muy técnico o específico fuera de la configuración, invítalos a comunicarse con los asesores directos (+52 999 958 8566 / +52 999 552 6896).

EJEMPLOS DE ESPAÑOL NATURAL Y VENDEDOR:
- "¡Hola! Con mucho gusto 😊 El sedán Confort te sale en $800 MXN al día ya con seguro amplio y kilometraje totalmente libre por toda la península. ¿Para qué fechas lo necesitas?"
- "¡Claro que sí! Te entregamos el auto directamente en tu hotel o en la estación del Tren Maya en 40 minutos ⚡ ¿Te gustaría que te aparte la unidad de una vez?"
`,

  // ─── Configuración técnica ───
  maxHistorial: 8,
  delayRespuesta: 1200,
  maxRespuestasPorMinuto: 15,
};
