// Contenido del prototipo funcional de OptimaGuía · Basílica de San Juan de Dios.
// Textos PROVISIONALES: salen de la audioguía antigua y de la documentación revisada,
// reescritos para el prototipo. La propuesta de contenido y narrativa está pendiente.
// Marcado de términos dentro de las frases: [texto visible](id-del-término)

const IMG = 'assets/img/';
// Foto con encuadre: src, posición del recorte y zoom (para sacar detalles de una misma foto).
const ph = (f, pos = '50% 50%', zoom = 1) => ({ src: IMG + f + '.jpg', pos, zoom });

export const PHOTOS = {
  nave: ph('sjd-8', '50% 45%'),
  naveAltar: ph('sjd-8', '50% 55%', 2.1),
  naveCupula: ph('sjd-8', '50% 6%', 1.9),
  naveIzq: ph('sjd-8', '12% 55%', 2),
  naveDer: ph('sjd-8', '88% 55%', 2),
  naveLamparas: ph('sjd-8', '30% 20%', 2.2),
  sacristia: ph('sjd-1', '50% 60%'),
  espejos: ph('sjd-1', '22% 74%', 2.1),
  mesa: ph('sjd-1', '52% 90%', 1.6),
  cajoneras: ph('sjd-1', '14% 92%', 1.9),
  boveda: ph('sjd-1', '42% 6%', 1.6),
  lavabos: ph('sjd-1', '92% 74%', 2),
  antecamarin: ph('sjd-12', '50% 60%'),
  suelo: ph('sjd-12', '60% 96%', 1.8),
  camarin: ph('sjd-15', '55% 55%'),
  templete: ph('sjd-15', '72% 40%', 1.5),
  urna: ph('sjd-13', '50% 62%', 1.25),
  urnaDetalle: ph('sjd-13', '50% 66%', 2.1),
  cupula: ph('sjd-14', '50% 40%'),
  linterna: ph('sjd-14', '50% 30%', 2.6),
};

export const TERMS = {
  'espejos': { name: 'Espejos', kind: 'Objeto', stop: 'sacristia', cartela: 'Marcos tallados y dorados · sobre las cajoneras', def: 'Tres grandes espejos con marcos dorados. En una sala con poca luz servían para multiplicar la de las velas y la de la ventana.', photo: PHOTOS.espejos },
  'mesa-calicera': { name: 'Mesa calicera', kind: 'Objeto', stop: 'sacristia', cartela: 'Mármol de Sierra Elvira · en el centro de la sala', def: 'La mesa donde se preparaban los cálices y todo lo necesario para la misa. Sus columnas son de mármol de Sierra Elvira y el tablero, de mármol de Macael.', photo: PHOTOS.mesa },
  'sierra-elvira': { name: 'Mármol de Sierra Elvira', kind: 'Término', stop: 'sacristia', cartela: 'Piedra de las afueras de Granada', def: 'Una piedra gris oscura, casi negra cuando se pule. Sale de las canteras de Sierra Elvira, muy cerca de Granada, y se usó mucho en los edificios de la ciudad.', photo: PHOTOS.mesa },
  'cajoneras': { name: 'Cajoneras', kind: 'Objeto', stop: 'sacristia', cartela: 'Nogal tallado · tiradores de bronce', def: 'Muebles de grandes cajones donde se guardaban las vestiduras y los objetos del culto. Los cajones son de nogal, tallados en bajorrelieve.', photo: PHOTOS.cajoneras },
  'boveda-sacristia': { name: 'Bóveda pintada', kind: 'Objeto', stop: 'sacristia', cartela: 'Techo de la sacristía', def: 'La bóveda está pintada con un cielo abierto, rodeado de molduras doradas. Las lámparas de cristal cuelgan en el centro de la sala.', photo: PHOTOS.boveda },
  'lavabos': { name: 'Lavabos de jaspe', kind: 'Objeto', stop: 'sacristia', cartela: 'Jaspe de Lanjarón · junto a la ventana', def: 'Dos lavabos de gran tamaño, coronados por el escudo de la Orden. Allí se lavaban las manos los sacerdotes antes de la misa.', photo: PHOTOS.lavabos },
  'san-juan-de-dios': { name: 'San Juan de Dios', kind: 'Persona', stop: 'nave', cartela: '1495 – 1550 · fundador de la Orden Hospitalaria', def: 'Nació en Portugal y dedicó su vida, en Granada, a cuidar de los pobres y de los enfermos. De su obra nació la Orden Hospitalaria. Hoy es copatrón de la ciudad.', photo: PHOTOS.urna },
  'retablo-mayor': { name: 'Retablo mayor', kind: 'Objeto', stop: 'altar', cartela: 'Madera dorada · cabecera del templo', def: 'Ocupa todo el fondo del presbiterio. Su estructura dibuja una vela encendida, imagen del amor y de la caridad: la idea que guía todo el templo.', photo: PHOTOS.naveAltar },
  'camarin': { name: 'Camarín', kind: 'Lugar', stop: 'camarin', cartela: 'Planta 1 · detrás del retablo mayor', def: 'Una sala elevada, detrás y encima del retablo, donde se guarda lo más valioso del templo: la urna con los restos de San Juan de Dios.', photo: PHOTOS.camarin },
  'templete': { name: 'Templete', kind: 'Objeto', stop: 'camarin', cartela: 'Columnas pareadas · apóstoles de plata', def: 'Una pequeña construcción con columnas y cúpula que protege la urna. La rodean los doce apóstoles en plata, presididos por la figura de Cristo.', photo: PHOTOS.templete },
  'urna': { name: 'Urna de San Juan de Dios', kind: 'Objeto', stop: 'camarin', cartela: 'Plata repujada · cuatro medallones', def: 'Guarda los restos del santo. En sus cuatro frentes, medallones en relieve cuentan momentos de su vida, desde su nacimiento hasta su muerte.', photo: PHOTOS.urnaDetalle },
  'suelo-cubos': { name: 'Suelo de cubos', kind: 'Objeto', stop: 'camarin', cartela: 'Mármoles de tres colores', def: 'Las losas de tres tonos se combinan para que el suelo parezca hecho de cubos en relieve. Es un juego óptico muy del gusto barroco.', photo: PHOTOS.suelo },
  'cupula-camarin': { name: 'Cúpula del camarín', kind: 'Objeto', stop: 'cupula', cartela: 'Pintura al óleo · planta 1', def: 'Se abre justo encima de la urna. Sus pinturas muestran la gloria del cielo, con santos y ángeles entre nubes.', photo: PHOTOS.cupula },
  'linterna': { name: 'Linterna', kind: 'Término', stop: 'cupula', cartela: 'Remate de una cúpula', def: 'La pequeña torre con ventanas que corona una cúpula. Deja entrar la luz desde arriba, para que el cielo pintado parezca abrirse.', photo: PHOTOS.linterna },
  'pechinas': { name: 'Pechinas', kind: 'Término', stop: 'crucero', cartela: 'Arquitectura', def: 'Los triángulos curvos que unen los cuatro arcos del crucero con la base redonda de la cúpula. Suelen decorarse con figuras.', photo: PHOTOS.naveCupula },
  'bovedas': { name: 'Bóvedas', kind: 'Objeto', stop: 'crucero', cartela: 'Pintura al óleo', def: 'Los techos curvos de la iglesia. Están pintados al óleo con escenas de la Virgen y de la vida de San Juan de Dios.', photo: PHOTOS.naveCupula },
  'estipites': { name: 'Estípites', kind: 'Término', stop: 'altar', cartela: 'Barroco andaluz', def: 'Columnas que se estrechan hacia abajo, como una pirámide invertida. Son muy típicas del barroco andaluz del siglo XVIII.', photo: PHOTOS.naveAltar },
  'pulpito': { name: 'Púlpito', kind: 'Objeto', stop: 'rafael', cartela: 'Madera tallada y dorada', def: 'La tribuna elevada desde la que se predicaba, para que la voz llegara a toda la iglesia.', photo: PHOTOS.naveIzq },
  'lamparas': { name: 'Lámparas de los ángeles', kind: 'Objeto', stop: 'despedida', cartela: 'Ángeles portadores de luz', def: 'Ángeles tallados que sostienen las lámparas del templo. Juntan escultura y luz en un mismo efecto teatral.', photo: PHOTOS.naveLamparas },
};

// Paradas. «min» es el tiempo aproximado en la sala (no la duración del audio).
// «map» es la posición en el plano: planta y coordenadas del SVG de planos.py.
export const STOPS = [
  {
    id: 'nave', n: 1, name: 'La nave', short: 'Nave', floor: 0, min: 4, cover: PHOTOS.nave,
    ask: 'Pregunta sobre la nave',
    howto: 'Estás en la entrada. Avanza por el centro de la nave, mirando al altar.',
    map: { x: 140.6, y: 447.7, r: 22 },
    ar: ['retablo-mayor', 'bovedas', 'pechinas', 'lamparas'],
    chapters: [
      { title: 'La basílica', photo: PHOTOS.nave, focus: 'retablo-mayor', lines: [
        'Bienvenido a la Basílica de [San Juan de Dios](san-juan-de-dios).',
        'Se empezó a construir en 1734 y se terminó en 1757, sin interrupciones.',
        'Es barroco en estado puro: todo está pensado para emocionar a quien entra.',
      ] },
      { title: 'Una sola idea', photo: PHOTOS.naveCupula, focus: 'bovedas', lines: [
        'Detrás de tanto oro hay una sola idea: el triunfo de la caridad.',
        'El templo se levantó para custodiar los restos de su fundador.',
      ] },
      { title: 'El retablo', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
        'Al fondo, el [retablo mayor](retablo-mayor) dibuja una vela encendida.',
        'Detrás de él, en lo alto, está el [camarín](camarin), al que subirás más tarde.',
      ] },
      { title: 'Cómo seguir', photo: PHOTOS.sacristia, focus: null, lines: [
        'Ahora camina hacia la cabecera y entra por la puerta de la derecha: allí está la sacristía.',
      ] },
    ],
    kids: 'Reto para los peques: busca un ángel que sostenga una lámpara. ¿Cuántos encuentras?',
    suggest: ['¿Cuándo se construyó?', '¿Quién fue San Juan de Dios?', '¿Qué es el barroco?'],
  },
  {
    id: 'sacristia', n: 2, name: 'La sacristía', short: 'Sacristía', floor: 0, min: 3, cover: PHOTOS.sacristia,
    ask: 'Pregunta sobre la sacristía',
    howto: 'Desde el crucero, entra por la puerta que hay a la derecha del altar mayor.',
    map: { x: 217.2, y: 81.4, r: 26 },
    ar: ['mesa-calicera', 'espejos', 'boveda-sacristia', 'cajoneras', 'lavabos'],
    chapters: [
      { title: 'Los espejos', photo: PHOTOS.espejos, focus: 'espejos', lines: [
        'Estás en la sacristía, donde se preparaba todo lo necesario para la misa.',
        'Fíjate primero en los grandes [espejos](espejos): multiplican la luz.',
      ] },
      { title: 'La mesa calicera', photo: PHOTOS.mesa, focus: 'mesa-calicera', lines: [
        'En el centro está la [mesa calicera](mesa-calicera), con columnas de mármol de [Sierra Elvira](sierra-elvira).',
        'Sobre su tablero se preparaban los cálices antes de cada celebración.',
      ] },
      { title: 'Las cajoneras', photo: PHOTOS.cajoneras, focus: 'cajoneras', lines: [
        'A los lados corren las [cajoneras](cajoneras) de nogal, talladas en bajorrelieve.',
        'En sus cajones se guardaban las vestiduras de los sacerdotes.',
      ] },
      { title: 'La bóveda', photo: PHOTOS.boveda, focus: 'boveda-sacristia', lines: [
        'Ahora levanta la vista hacia la [bóveda pintada](boveda-sacristia).',
        'Los marcos dorados, los cuadros y las lámparas convierten la sala en un pequeño tesoro.',
      ] },
    ],
    kids: 'Reto para los peques: cuenta los espejos de la sala. ¿Te ves reflejado en alguno?',
    suggest: ['¿De dónde viene el mármol de Sierra Elvira?', '¿Para qué servía la sacristía?', '¿Cómo subo al camarín?'],
  },
  {
    id: 'camarin', n: 3, name: 'El camarín', short: 'Camarín', floor: 1, min: 5, cover: PHOTOS.camarin,
    ask: 'Pregunta sobre el camarín',
    howto: 'Sube por la escalera que hay detrás del altar mayor. Está a un minuto.',
    map: { x: 163.8, y: 171.6, r: 27 },
    ar: ['templete', 'urna', 'suelo-cubos', 'cupula-camarin'],
    chapters: [
      { title: 'La subida', photo: PHOTOS.antecamarin, focus: 'suelo-cubos', lines: [
        'Has subido al antecamarín, la antesala del lugar más sagrado del templo.',
        'Mira el suelo: sus [losas de tres colores](suelo-cubos) parecen cubos en relieve.',
      ] },
      { title: 'El templete', photo: PHOTOS.templete, focus: 'templete', lines: [
        'En el centro se alza el [templete](templete), con columnas pareadas y capiteles corintios.',
        'Lo rodean los doce apóstoles en plata, presididos por la figura de Cristo.',
      ] },
      { title: 'La urna', photo: PHOTOS.urna, focus: 'urna', lines: [
        'Dentro está la [urna](urna) que guarda los restos de [San Juan de Dios](san-juan-de-dios).',
        'Sus cuatro medallones cuentan su vida, desde el nacimiento hasta la muerte.',
      ] },
      { title: 'Un momento de silencio', photo: PHOTOS.urnaDetalle, focus: null, lines: [
        'Es un lugar de oración. Si quieres, tómate un momento antes de seguir.',
      ] },
    ],
    kids: 'Reto para los peques: ¿cuántas columnas sostienen el templete? Pista: van de dos en dos.',
    suggest: ['¿Qué hay dentro de la urna?', '¿Quién fue San Juan de Dios?', '¿Qué es un templete?'],
  },
  {
    id: 'cupula', n: 4, name: 'La cúpula del camarín', short: 'Cúpula', floor: 1, min: 3, cover: PHOTOS.cupula,
    ask: 'Pregunta sobre la cúpula',
    howto: 'Justo después, en la misma sala del camarín.',
    map: { x: 163.8, y: 93.6, r: 24 },
    ar: ['cupula-camarin', 'linterna', 'templete'],
    chapters: [
      { title: 'Mira hacia arriba', photo: PHOTOS.cupula, focus: 'cupula-camarin', lines: [
        'Levanta la vista: la [cúpula](cupula-camarin) del camarín se abre sobre la urna.',
        'Sus pinturas muestran la gloria del cielo, con santos y ángeles entre nubes.',
      ] },
      { title: 'La luz', photo: PHOTOS.linterna, focus: 'linterna', lines: [
        'En lo alto, la [linterna](linterna) deja entrar la luz natural.',
        'Así, el cielo pintado parece abrirse al cielo de verdad.',
      ] },
      { title: 'Todo brilla', photo: PHOTOS.templete, focus: 'templete', lines: [
        'Las paredes están cubiertas de espejos, tallas doradas y relicarios.',
        'Todo está pensado para que la mirada suba, siempre, hacia lo alto.',
      ] },
    ],
    kids: 'Reto para los peques: busca en la cúpula un ángel que toque un instrumento.',
    suggest: ['¿Qué es la linterna?', '¿Quién pintó las bóvedas?', '¿Cómo bajo de nuevo?'],
  },
  {
    id: 'crucero', n: 5, name: 'El crucero', short: 'Crucero', floor: 0, min: 4, cover: PHOTOS.naveCupula,
    ask: 'Pregunta sobre el crucero',
    howto: 'Baja por la misma escalera y colócate en el centro, bajo la cúpula.',
    map: { x: 140.6, y: 179.4, r: 18 },
    ar: ['pechinas', 'bovedas', 'retablo-mayor'],
    chapters: [
      { title: 'Bajo la cúpula', photo: PHOTOS.naveCupula, focus: 'pechinas', lines: [
        'Ya de vuelta abajo, colócate en el centro del crucero, donde se cruzan las naves.',
        'Sobre ti se eleva la gran cúpula, apoyada en cuatro [pechinas](pechinas).',
        'Las [bóvedas](bovedas) se decoraron al óleo con escenas de la Virgen y de la vida del santo.',
      ] },
    ],
    suggest: ['¿Qué son las pechinas?', '¿Quién pintó las bóvedas?', '¿Qué es el barroco?'],
  },
  {
    id: 'altar', n: 6, name: 'El retablo mayor', short: 'Retablo', floor: 0, min: 5, cover: PHOTOS.naveAltar,
    ask: 'Pregunta sobre el retablo',
    howto: 'Acércate al presbiterio, frente al altar mayor.',
    map: { x: 140.6, y: 61.0, r: 18 },
    ar: ['retablo-mayor', 'estipites', 'camarin'],
    chapters: [
      { title: 'Una vela encendida', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
        'El [retablo mayor](retablo-mayor) ocupa toda la cabecera, en madera dorada.',
        'Sus [estípites](estipites) enmarcan el arco del camarín y dibujan una vela encendida.',
        'En la base brilla el sagrario de plata.',
      ] },
    ],
    suggest: ['¿Por qué una vela?', '¿Qué son los estípites?', '¿Quién hizo los retablos?'],
  },
  {
    id: 'sanjuan', n: 7, name: 'Capilla de San Juan de Dios', short: 'San Juan', floor: 0, min: 4, cover: PHOTOS.naveDer,
    ask: 'Pregunta sobre San Juan de Dios',
    howto: 'En el brazo derecho del crucero.',
    map: { x: 244.2, y: 201.7, r: 18 },
    ar: ['san-juan-de-dios', 'bovedas'],
    chapters: [
      { title: 'El santo', photo: PHOTOS.naveDer, focus: 'san-juan-de-dios', lines: [
        'En esta capilla preside [San Juan de Dios](san-juan-de-dios), en una escultura policromada.',
        'Sostiene un crucifijo que no mira, sino que enseña: así hay que tratar al enfermo.',
      ] },
    ],
    suggest: ['¿Quién fue San Juan de Dios?', '¿Dónde están sus restos?', '¿Qué es la Orden Hospitalaria?'],
  },
  {
    id: 'rafael', n: 8, name: 'San Rafael y el púlpito', short: 'San Rafael', floor: 0, min: 3, cover: PHOTOS.naveIzq,
    ask: 'Pregunta sobre San Rafael',
    howto: 'En el brazo izquierdo del crucero, frente a la capilla del santo.',
    map: { x: 37.0, y: 201.7, r: 18 },
    ar: ['pulpito', 'bovedas'],
    chapters: [
      { title: 'El arcángel', photo: PHOTOS.naveIzq, focus: 'pulpito', lines: [
        'El arcángel San Rafael está muy unido a la Orden Hospitalaria.',
        'Representa el cuidado y el acompañamiento a quien lo necesita.',
        'Junto a la capilla verás el [púlpito](pulpito), tallado y dorado.',
      ] },
    ],
    suggest: ['¿Qué es un púlpito?', '¿Por qué San Rafael?', '¿Quién fue San Juan de Dios?'],
  },
  {
    id: 'belen', n: 9, name: 'Belén y San José', short: 'Belén', floor: 0, min: 3, cover: PHOTOS.naveDer,
    ask: 'Pregunta sobre estas capillas',
    howto: 'En las capillas de la derecha de la nave.',
    map: { x: 199.8, y: 320.1, r: 18 },
    ar: ['bovedas', 'retablo-mayor'],
    chapters: [
      { title: 'Las capillas', photo: PHOTOS.naveDer, focus: null, lines: [
        'En las capillas de la nave están Nuestra Señora de Belén y San José.',
        'Fíjate en los zócalos: combinan mármoles de distintos colores.',
      ] },
    ],
    suggest: ['¿Qué es un zócalo?', '¿Cuándo se construyó?', '¿Cómo salgo?'],
  },
  {
    id: 'despedida', n: 10, name: 'Las lámparas y la despedida', short: 'Despedida', floor: 0, min: 3, cover: PHOTOS.naveLamparas,
    ask: 'Pregunta lo que te haya quedado',
    howto: 'Vuelve hacia la entrada por el centro de la nave.',
    map: { x: 75.8, y: 377.4, r: 18 },
    ar: ['lamparas', 'retablo-mayor', 'bovedas'],
    chapters: [
      { title: 'Hasta pronto', photo: PHOTOS.naveLamparas, focus: 'lamparas', lines: [
        'Antes de salir, mira las [lámparas](lamparas) que sostienen los ángeles.',
        'Has recorrido un monumento levantado a la caridad.',
        'Gracias por visitar la Basílica de San Juan de Dios.',
      ] },
    ],
    suggest: ['¿Qué significa la vela del retablo?', '¿Quién fue San Juan de Dios?', '¿Cuándo se construyó?'],
  },
];

export const ESSENTIAL = ['nave', 'sacristia', 'camarin', 'cupula', 'altar'];

export const LANGS = [
  { code: 'ES', name: 'Español', sub: 'Idioma de tu móvil' },
  { code: 'EN', name: 'English', sub: 'Inglés' },
  { code: 'FR', name: 'Français', sub: 'Francés' },
  { code: 'DE', name: 'Deutsch', sub: 'Alemán' },
  { code: 'IT', name: 'Italiano', sub: 'Italiano' },
  { code: 'PT', name: 'Português', sub: 'Portugués' },
  { code: 'ZH', name: '中文', sub: 'Chino' },
  { code: 'JA', name: '日本語', sub: 'Japonés' },
];

export const SURVEY = [
  { key: 'lang', icon: 'i-globe', title: '¿En qué idioma?', lang: true },
  { key: 'company', icon: 'i-people', title: '¿Con quién vienes?', options: [
    { v: 'solo', t: 'Por mi cuenta' },
    { v: 'pareja', t: 'En pareja o con amigos' },
    { v: 'ninos', t: 'Con niños', s: 'La guía añade explicaciones para ellos' },
    { v: 'grupo', t: 'En grupo' },
  ] },
  { key: 'time', icon: 'i-hourglass', title: '¿Cuánto tiempo tienes?', options: [
    { v: '20', t: 'Unos 20 minutos', s: 'Lo esencial · 5 paradas' },
    { v: '50', t: 'Unos 50 minutos', s: 'La visita completa · 10 paradas' },
    { v: 'libre', t: 'Sin prisa', s: 'Todo, y con tiempo para preguntar al guía' },
  ] },
  { key: 'mode', icon: 'i-follow', title: '¿Cómo quieres seguirla?', options: [
    { v: 'both', t: 'Escuchar y leer a la vez', s: 'Con el texto de lo que suena', icon: 'i-both' },
    { v: 'listen', t: 'Solo escuchar', s: 'Botones grandes, sin texto en pantalla', icon: 'i-headph' },
    { v: 'read', t: 'Solo leer', s: 'Subtítulos y textos, sin audio', icon: 'i-text' },
    { v: 'voice', t: 'Con la voz', s: 'Manejas la guía hablando, sin mirar', icon: 'i-mic' },
    { v: 'ar', t: 'En realidad aumentada', s: 'Con el guía a tu lado y los puntos sobre la sala', icon: 'i-ar' },
  ] },
];

// Asistente: respuestas cerradas al contenido de la visita (en el producto, un modelo
// limitado a este contenido). Cada respuesta cita la parada de la que sale.
export const KB = [
  { keys: ['sierra elvira', 'marmol', 'mármol', 'piedra'], a: 'De las canteras de Sierra Elvira, a las afueras de Granada. Es una piedra gris oscura, casi negra cuando se pule, que se usó mucho en los edificios de la ciudad.', stop: 'sacristia' },
  { keys: ['sacristia', 'sacristía', 'para que servia', 'para qué servía', 'servia esta sala', 'servía esta sala'], a: 'Era la sala donde se preparaba la misa: los sacerdotes se vestían, se guardaban los objetos del culto y se preparaban los cálices sobre la mesa calicera.', stop: 'sacristia' },
  { keys: ['pinto', 'pintó', 'pintor', 'pinturas', 'boveda', 'bóveda', 'bovedas', 'bóvedas'], a: 'Las bóvedas de la iglesia se decoraron al óleo con escenas de la Virgen y de la vida del santo. Según la audioguía antigua, son obra de Sánchez Sarabia; es un dato que aún estamos verificando.', stop: 'crucero' },
  { keys: ['subo', 'subir', 'llego', 'llegar', 'escalera', 'como voy', 'cómo voy'], a: 'Sube por la escalera que hay detrás del altar mayor. El camarín está en la planta 1, a un minuto.', stop: 'camarin', action: 'map' },
  { keys: ['bajo', 'bajar', 'salgo', 'salir', 'salida'], a: 'Baja por la misma escalera hasta el crucero. La salida está al fondo de la nave, por donde entraste.', stop: 'crucero', action: 'map' },
  { keys: ['cuando', 'cuándo', 'construyo', 'construyó', 'construido', 'año', 'siglo', 'antiguo', 'antigua'], a: 'Las obras empezaron en 1734 y terminaron en 1757, sin interrupciones. Es uno de los grandes ejemplos del barroco del siglo XVIII en Granada.', stop: 'nave' },
  { keys: ['quien fue', 'quién fue', 'san juan de dios', 'fundador', 'santo'], a: 'Juan Ciudad nació en Portugal en 1495 y dedicó su vida, en Granada, a cuidar de los pobres y de los enfermos. De su obra nació la Orden Hospitalaria. Murió en 1550.', stop: 'sanjuan' },
  { keys: ['restos', 'urna', 'enterrado', 'reliquias', 'dentro'], a: 'Sus restos se guardan en la urna de plata del camarín, en la planta 1. Sus cuatro medallones cuentan escenas de su vida.', stop: 'camarin' },
  { keys: ['mesa calicera', 'calicera', 'calices', 'cálices'], a: 'Es la mesa donde se preparaban los cálices para la misa. Tiene columnas de mármol de Sierra Elvira y un tablero de mármol de Macael.', stop: 'sacristia' },
  { keys: ['espejo', 'espejos'], a: 'Son tres grandes espejos con marcos tallados y dorados. En una sala con poca luz, multiplicaban la de las velas y la de la ventana.', stop: 'sacristia' },
  { keys: ['retablo', 'vela', 'cirio'], a: 'El retablo mayor dibuja una vela encendida: es la imagen del amor y de la caridad, la idea que guía todo el templo.', stop: 'altar' },
  { keys: ['arquitecto', 'diseño', 'diseñó', 'quien hizo', 'quién hizo', 'retablos'], a: 'La unidad del templo se atribuye a José de Bada, y los retablos a José Francisco Guerrero. Son datos de la audioguía antigua, pendientes de verificar.', stop: 'nave' },
  { keys: ['barroco'], a: 'El barroco busca emocionar: luz, oro, movimiento y efectos de teatro para provocar un movimiento interior en quien mira.', stop: 'nave' },
  { keys: ['cupula', 'cúpula', 'linterna'], a: 'La cúpula del camarín se abre sobre la urna. En lo alto, la linterna deja entrar la luz para que el cielo pintado parezca abrirse.', stop: 'cupula' },
  { keys: ['pechina', 'pechinas'], a: 'Son los triángulos curvos que unen los arcos del crucero con la base redonda de la cúpula.', stop: 'crucero' },
  { keys: ['estipite', 'estípite', 'estipites', 'estípites'], a: 'Columnas que se estrechan hacia abajo, como una pirámide invertida. Son muy típicas del barroco andaluz.', stop: 'altar' },
  { keys: ['templete'], a: 'Es la pequeña construcción con columnas y cúpula que protege la urna, rodeada por los doce apóstoles de plata.', stop: 'camarin' },
  { keys: ['pulpito', 'púlpito'], a: 'Es la tribuna elevada desde la que se predicaba, para que la voz llegara a toda la iglesia.', stop: 'rafael' },
  { keys: ['rafael'], a: 'El arcángel San Rafael está muy unido a la Orden Hospitalaria: representa el cuidado y el acompañamiento.', stop: 'rafael' },
  { keys: ['orden hospitalaria', 'hospitalaria', 'orden'], a: 'Es la orden religiosa que nació de la obra de San Juan de Dios. Hoy sigue cuidando de enfermos en hospitales de todo el mundo.', stop: 'sanjuan' },
  { keys: ['zocalo', 'zócalo', 'zocalos', 'zócalos'], a: 'El zócalo es la franja baja de las paredes. Aquí combina mármoles de distintos colores.', stop: 'belen' },
];

export const FALLBACK = 'Eso no lo sé con la información de esta visita. Puedo contarte sobre la sacristía, el camarín o la vida de San Juan de Dios.';
