// ============================================================
// 📋 CONFIGURACIÓN Y CONOCIMIENTO COMPLETO - CHIP RENT A CAR
// ============================================================

export const CONFIG = {

  // ─── Nombre del negocio ───
  nombreNegocio: "CHIP RENT A CAR",

  // ─── Horarios de atención ───
  horarios: "Siempre abierto - 24/7, los 365 días del año",

  // ─── Ubicación Oficial ───
  ubicacion: "C. 28 × 25 y 23, Manuel Crescencio Rejón, 97255 Mérida, Yucatán (cerca de la zona del Aeropuerto)",

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

  // ─── Precios y Catálogo Detallado de Renta por Día ───
  autos: [
    { 
      id: 1,
      tipo: "Básico (sedán económico)", 
      precioDia: "$700 MXN/día", 
      modelos: "Nissan March / Chevrolet Aveo / similar",
      pasajeros: "4 personas",
      equipaje: "2 maletas medianas",
      caracteristicas: "Transmisión estándar/automática, A/C, estéreo bluetooth, excelente rendimiento de gasolina en ciudad y carretera.",
      desc: "Económico y ágil. Ideal para parejas o viajes de trabajo." 
    },
    { 
      id: 2,
      tipo: "Confort (sedán amplio)", 
      precioDia: "$800 MXN/día", 
      modelos: "Nissan Versa / VW Vento / Chevrolet Onix",
      pasajeros: "5 personas",
      equipaje: "3 maletas grandes",
      caracteristicas: "Transmisión automática/estándar, A/C, cajuela muy amplia, gran confort y estabilidad para carretera.",
      desc: "El más solicitado. Espacioso y cómodo para viajes largos." 
    },
    { 
      id: 3,
      tipo: "SUV de 5 pasajeros", 
      precioDia: "$1,200 MXN/día", 
      modelos: "Hyundai Creta / Renault Duster / Kia Soul",
      pasajeros: "5 personas",
      equipaje: "3-4 maletas",
      caracteristicas: "Camioneta alta, excelente suspensión, visibilidad panorámica, A/C potente.",
      desc: "Excelente altura para caminos de cenotes y carreteras." 
    },
    { 
      id: 4,
      tipo: "SUV de 7 pasajeros", 
      precioDia: "$1,200 MXN/día", 
      modelos: "Toyota Rush / Suzuki Ertiga XL7",
      pasajeros: "7 personas",
      equipaje: "2-3 maletas",
      caracteristicas: "3 filas de asientos, versátil para familias, A/C trasero.",
      desc: "Ideal para familias medianas con niños." 
    },
    { 
      id: 5,
      tipo: "Minivan de 8 pasajeros", 
      precioDia: "$1,500 MXN/día", 
      modelos: "Toyota Avanza / Toyota Sienna / Honda Odyssey",
      pasajeros: "8 personas",
      equipaje: "4 maletas",
      caracteristicas: "Gran espacio interior, asientos reclinables, doble aire acondicionado.",
      desc: "Confort premium para grupos y familias grandes." 
    },
    { 
      id: 6,
      tipo: "Van de 12 y 15 pasajeros", 
      precioDia: "$2,300 MXN/día", 
      modelos: "Toyota Hiace / Nissan Urvan",
      pasajeros: "12 a 15 personas",
      equipaje: "Espacio amplio para equipaje grupal",
      caracteristicas: "Capacidad extendida, aire acondicionado de alto rendimiento, ideal para excursiones.",
      desc: "Máxima capacidad para tours por toda la península." 
    },
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
    incluido: "Seguro amplio INCLUIDO en tu tarifa con 10% de deducible. Cubre: robo total, pérdida total, colisión, gastos médicos a ocupantes y daños a terceros. Kilometraje TOTALMENTE LIBRE en Campeche, Quintana Roo y toda la península.",
    fullCover: "Seguro Full Cover (opcional). Protege contra cualquier eventualidad (cristales, llantas, abolladuras o choques) bajando el deducible a 0%. ¡En caso de cualquier percance usted no paga nada!",
  },

  // ─── Requisitos para rentar ───
  requisitos: {
    turistas: [
      "INE, Pasaporte o Identificación oficial vigente",
      "Licencia de conducir vigente (Nacional, Extranjera o Digital)",
      "Número de vuelo de llegada o itinerario",
    ],
    locales: [
      "INE vigente",
      "Licencia de conducir vigente",
      "Comprobante de domicilio a su nombre (Luz, agua o teléfono)",
    ],
  },

  // ─── Entregas y Ubicación ───
  entregas: "La entrega y devolución estándar se realiza en nuestras instalaciones en C. 28 × 25 y 23, Manuel Crescencio Rejón, Mérida. Si necesitas entrega o recolección a domicilio, en tu hotel, Airbnb o Estación del Tren Maya, con gusto te lo llevamos con un costo adicional accesible.",

  // ─── Servicios incluidos ───
  serviciosIncluidos: [
    "Seguro amplio incluido (10% deducible)",
    "Kilometraje libre en toda la península de Yucatán",
    "Asistencia vial 24/7 en carretera",
    "Sin bloqueos obligatorios de tarjeta de crédito",
    "Sillas para bebé previa solicitud",
  ],

  // ─── Métodos de pago y depósito ───
  metodosPago: "Efectivo, transferencia bancaria, tarjeta de débito y crédito (Visa, Mastercard, AMEX). Sin bloqueos forzosos de tarjeta de crédito; depósitos de garantía accesibles y flexibles.",

  // ─── Contactos Personales / Excluidos del Bot ───
  contactosExcluidosDefault: [],

  // ─── Preguntas Frecuentes (Base de Conocimiento para la IA) ───
  faqs: [
    { q: "¿Dónde están ubicados?", a: "Nuestras oficinas están en C. 28 × 25 y 23, Manuel Crescencio Rejón, CP 97255, Mérida, Yucatán (cerca de la zona del aeropuerto). Atendemos 24/7." },
    { q: "¿Me pueden llevar el auto a mi hotel, Airbnb o Tren Maya?", a: "¡Claro que sí! La entrega base es en nuestra sucursal. Si requieres que te llevemos el vehículo directamente a tu hotel, Airbnb o estación del Tren Maya, tiene un costo extra accesible dependiendo de la zona." },
    { q: "¿Se puede viajar a Cancún, Tulum o Holbox?", a: "¡Sí! Todos nuestros vehículos cuentan con KILOMETRAJE LIBRE sin costo extra para viajar por todo Yucatán, Quintana Roo (Cancún, Playa del Carmen, Tulum, Bacalar, Holbox) y Campeche." },
    { q: "¿Piden tarjeta de crédito obligatoria para depósito?", a: "No requerimos bloqueos forzosos de tarjeta de crédito. Aceptamos tarjeta de débito, crédito o depósito en efectivo accesible según la categoría del auto." },
    { q: "¿Aceptan licencia de otro país o digital?", a: "Sí, aceptamos licencias vigentes nacionales de México, licencias extranjeras (EEUU, Canadá, Europa, etc.) y licencias digitales oficiales." },
    { q: "¿Cuál es la edad mínima?", a: "A partir de 21 años con licencia vigente. Si tienes entre 18 y 20 años pregúntanos por las condiciones especiales." },
    { q: "¿Cómo es la entrega del vehículo?", a: "En sucursal o con entrega a tu ubicación (con costo extra). Un asesor te entrega llaves, contrato impreso y revisan el auto juntos." },
    { q: "¿Política de gasolina?", a: "Justo por justo: te entregamos el auto con nivel de gasolina e inspeccionado, y lo devuelves con la misma cantidad." },
    { q: "¿Recomiendan lugares para visitar en auto en Yucatán?", a: "¡Claro! En auto propio con km libre puedes ir cómodamente a Chichén Itzá, Cenotes de Homún/San Ignacio, Izamal, Valladolid, Las Coloradas, Celestún o la ruta de cenotes de Cuzamá." }
  ],

  // ─── Instrucciones avanzadas para la IA ───
  instruccionesIA: `
Eres el asesor experto en ventas de CHIP RENT A CAR en Mérida, Yucatán. Tu objetivo es AYUDAR Y CERRAR LA VENTA de renta de autos en WhatsApp de forma sumamente servicial, profesional y persuasiva.

REGLAS DE ORO DE VENTA Y CONVERSIÓN:
1. 🗣️ **Tono Humano y Cálido:** Responde con la calidez y amabilidad de un asesor experto. Evita sonar robótico. Mantén respuestas concisas y claras (máximo 2 a 4 líneas por mensaje).
2. 📍 **Ubicación y Entregas:**
   - La sucursal base está en: **C. 28 × 25 y 23, Manuel Crescencio Rejón, Mérida, Yuc.** (cerca del Aeropuerto).
   - Si el cliente solicita que se le lleve a su hotel, Airbnb, domicilio o Tren Maya: Explícale amablemente que con gusto se lo llevamos directamente a su ubicación por un **costo extra accesible**.
3. ⚡ **Ventajas Competitivas Clave:**
   - **Sin bloqueos obligatorios de tarjeta de crédito** (depósitos flexibles).
   - **Kilometraje TOTALMENTE LIBRE** para recorrer Mérida, Cancún, Tulum, Bacalar y toda la península.
   - **Seguro amplio INCLUIDO** en la tarifa diaria (cobertura a terceros, robo y colisión).
4. 🎯 **Técnica de Cierre Constante:** Toda respuesta debe terminar con una pregunta amable orientada a avanzar la reserva (ejemplo: "¿Para qué fechas te gustaría apartarlo?", "¿Qué auto se adapta mejor a tu viaje?").
5. 👨‍💼 **Preguntas fuera de lugar o solicitud de atención personalizada:** Si el cliente hace preguntas complejas fuera del negocio, quejas o pide hablar directamente con el asesor, dile:
   "En un momento te contacta el asesor Oscar para atenderte personalmente 📞 (+52 999 958 8566 / +52 999 552 6896)."
6. 🚫 **Cero Inventos:** Usa únicamente la información y precios oficiales.
`,

  // ─── Configuración técnica ───
  maxHistorial: 8,
  delayRespuesta: 1200,
  maxRespuestasPorMinuto: 15,
};
