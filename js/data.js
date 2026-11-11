// Contenido del prototipo funcional de OptimaGuía · Basílica de San Juan de Dios · v5
// Textos PROVISIONALES para el prototipo: la propuesta de contenido definitiva está pendiente.
// Dos recorridos sobre las mismas 10 pistas por espacio:
//   historica · San Juan de Dios te guía en primera persona
//   arte      · un narrador te describe lo que tienes alrededor
// Marcado de términos dentro de las frases: [texto visible](id-del-término)

const IMG = 'assets/img/';
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

// Recorridos
export const ROUTES = {
  historica: {
    id: 'historica', name: 'Histórica', long: 'Visita histórica', who: 'San Juan de Dios', whoShort: 'San Juan de Dios', toWho: 'a San Juan de Dios',
    tagline: 'Con San Juan de Dios', desc: 'Él mismo te cuenta su vida y la fe que levantó este templo, en primera persona.',
    ask: 'Pregúntale a San Juan de Dios', avatar: 'escultura', photo: PHOTOS.urna,
    avatarNote: 'Las esculturas de la basílica cobran vida y te hablan desde la app.',
  },
  arte: {
    id: 'arte', name: 'Arte y arquitectura', long: 'Visita de arte y arquitectura', who: 'El narrador', whoShort: 'Narrador', toWho: 'al narrador',
    tagline: 'Retablos, cúpulas y materiales', desc: 'Un narrador te explica lo que tienes alrededor, sala a sala.',
    ask: 'Pregunta al narrador', avatar: 'narrador', photo: PHOTOS.cupula,
    avatarNote: 'Tu guía es un avatar dentro de la app: le hablas cuando quieras.',
  },
};

// Obras y términos. model: tipo de modelo 3D provisional para el visor (en producción, el CGI de la obra).
// detail: pista ampliada que se escucha desde la ficha, sin cortar la pista de la sala.
export const TERMS = {
  'espejos': { name: 'Espejos', kind: 'Obra', stop: 'sacristia', cartela: 'Marcos tallados y dorados · sobre las cajoneras', def: 'Tres grandes espejos con marcos dorados. En una sala con poca luz servían para multiplicar la de las velas y la de la ventana.', photo: PHOTOS.espejos, model: 'panel',
    detail: ['Los tres espejos tienen marcos tallados y dorados con sus terminaciones originales.', 'Entre ellos, sobre repisas, descansan dos tallas de santos padres de la Iglesia.', 'Fíjate en cómo cada espejo devuelve la luz hacia el centro de la sala, sobre la mesa calicera.'] },
  'mesa-calicera': { name: 'Mesa calicera', kind: 'Obra', stop: 'sacristia', cartela: 'Mármol de Sierra Elvira · en el centro de la sala', def: 'La mesa donde se preparaban los cálices y todo lo necesario para la misa. Sus columnas son de mármol de Sierra Elvira y el tablero, de mármol de Macael.', photo: PHOTOS.mesa, model: 'mesa',
    detail: ['La mesa calicera se apoya en dos columnas de mármol gris de Sierra Elvira, la piedra de Granada.', 'Su gran tablero es de mármol blanco de Macael, en Almería, de una sola pieza.', 'Sobre ella se preparaban los cálices y los objetos de la misa, por eso recibe su nombre.'] },
  'sierra-elvira': { name: 'Mármol de Sierra Elvira', kind: 'Término', stop: 'sacristia', cartela: 'Piedra de las afueras de Granada', def: 'Una piedra gris oscura, casi negra cuando se pule. Sale de las canteras de Sierra Elvira, muy cerca de Granada, y se usó mucho en los edificios de la ciudad.', photo: PHOTOS.mesa },
  'cajoneras': { name: 'Cajoneras', kind: 'Obra', stop: 'sacristia', cartela: 'Nogal tallado · tiradores de bronce', def: 'Muebles de grandes cajones donde se guardaban las vestiduras y los objetos del culto. Los cajones son de nogal, tallados en bajorrelieve.', photo: PHOTOS.cajoneras, model: 'panel',
    detail: ['Las cajoneras recorren las paredes de la sala, con tapa de caoba de una sola pieza.', 'Los cajones son de nogal, tallados con bajorrelieves y con tiradores de bronce.', 'Encima, los coronamientos sostienen los grandes lienzos de la sacristía.'] },
  'boveda-sacristia': { name: 'Bóveda pintada', kind: 'Obra', stop: 'sacristia', cartela: 'Techo de la sacristía', def: 'La bóveda está pintada con un cielo abierto, rodeado de molduras doradas. Las lámparas de cristal cuelgan en el centro de la sala.', photo: PHOTOS.boveda, model: 'cupula',
    detail: ['La bóveda finge un cielo abierto, enmarcado por molduras doradas.', 'Así, una sala de trabajo parece abrirse hacia arriba, como el resto del templo.'] },
  'lavabos': { name: 'Lavabos de jaspe', kind: 'Obra', stop: 'sacristia', cartela: 'Jaspe de Lanjarón · junto a la ventana', def: 'Dos lavabos de gran tamaño, coronados por el escudo de la Orden. Allí se lavaban las manos los sacerdotes antes de la misa.', photo: PHOTOS.lavabos, model: 'panel',
    detail: ['Los dos lavabos son de jaspe de Lanjarón, con aplicaciones de mármol blanco y negro.', 'Los corona el escudo de la Orden Hospitalaria, con la granada y la cruz.'] },
  'san-juan-de-dios': { name: 'San Juan de Dios', kind: 'Escultura', stop: 'sanjuan', cartela: '1495 – 1550 · fundador de la Orden Hospitalaria', def: 'Nació en Portugal y dedicó su vida, en Granada, a cuidar de los pobres y de los enfermos. De su obra nació la Orden Hospitalaria. Hoy es copatrón de la ciudad.', photo: PHOTOS.naveDer, model: 'escultura',
    detail: ['La escultura presenta al santo con la cruz de la Orden en una mano y un crucifijo en la otra.', 'No mira al crucifijo: lo enseña. Es su forma de decir que al enfermo hay que tratarlo como a Cristo.', 'Lleva corona de espinas y una expresión serena, pensada para mover a la devoción.'] },
  'retablo-mayor': { name: 'Retablo mayor', kind: 'Obra', stop: 'altar', cartela: 'Madera dorada · cabecera del templo', def: 'Ocupa todo el fondo del presbiterio. Su estructura dibuja una vela encendida, imagen del amor y de la caridad: la idea que guía todo el templo.', photo: PHOTOS.naveAltar, model: 'panel',
    detail: ['El retablo mayor está hecho en madera dorada y ocupa todo el testero del presbiterio.', 'Sus estípites enmarcan el arco del camarín y, juntos, dibujan una vela o un cirio encendido.', 'En la base está el sagrario de plata, el primer cuerpo de esa vela: el sacramento del amor.'] },
  'camarin': { name: 'Camarín', kind: 'Lugar', stop: 'camarin', cartela: 'Planta 1 · detrás del retablo mayor', def: 'Una sala elevada, detrás y encima del retablo, donde se guarda lo más valioso del templo: la urna con los restos de San Juan de Dios.', photo: PHOTOS.camarin },
  'templete': { name: 'Templete', kind: 'Obra', stop: 'camarin', cartela: 'Columnas pareadas · apóstoles de plata', def: 'Una pequeña construcción con columnas y cúpula que protege la urna. La rodean los doce apóstoles en plata, presididos por la figura de Cristo.', photo: PHOTOS.templete, model: 'templete',
    detail: ['El templete se sostiene sobre ocho columnas, de dos en dos, con capiteles corintios.', 'En cada pedestal hay una estatua de plata repujada: los doce apóstoles.', 'Los preside Cristo, de pie y con la cruz, sobre la pequeña cúpula del trono.'] },
  'urna': { name: 'Urna de San Juan de Dios', kind: 'Obra', stop: 'camarin', cartela: 'Plata repujada · cuatro medallones', def: 'Guarda los restos del santo. En sus cuatro frentes, medallones en relieve cuentan momentos de su vida, desde su nacimiento hasta su muerte.', photo: PHOTOS.urnaDetalle, model: 'urna',
    detail: ['La urna de plata guarda los restos de San Juan de Dios.', 'En sus cuatro frentes hay medallones en alto relieve: su nacimiento, el hábito que recibió, cuando lavó los pies a Cristo vestido de pobre, y su muerte.', 'El nacimiento y la muerte son, así, los dos paréntesis que encierran su vida.'] },
  'suelo-cubos': { name: 'Suelo de cubos', kind: 'Obra', stop: 'camarin', cartela: 'Mármoles de tres colores', def: 'Las losas de tres tonos se combinan para que el suelo parezca hecho de cubos en relieve. Es un juego óptico muy del gusto barroco.', photo: PHOTOS.suelo, model: 'panel',
    detail: ['Tres mármoles de colores distintos forman rombos que el ojo lee como cubos.', 'Es un juego óptico: un suelo plano que parece tener volumen, muy del gusto barroco.'] },
  'cupula-camarin': { name: 'Cúpula del camarín', kind: 'Obra', stop: 'cupula', cartela: 'Pintura al óleo · planta 1', def: 'Se abre justo encima de la urna. Sus pinturas muestran la gloria del cielo, con santos y ángeles entre nubes.', photo: PHOTOS.cupula, model: 'cupula',
    detail: ['La cúpula del camarín se abre justo encima de la urna.', 'Sus pinturas muestran la gloria del cielo, con santos y ángeles entre nubes.', 'En el centro, la linterna deja pasar la luz natural.'] },
  'linterna': { name: 'Linterna', kind: 'Término', stop: 'cupula', cartela: 'Remate de una cúpula', def: 'La pequeña torre con ventanas que corona una cúpula. Deja entrar la luz desde arriba, para que el cielo pintado parezca abrirse.', photo: PHOTOS.linterna, model: 'cupula',
    detail: ['La linterna es la pequeña torre con ventanas que corona la cúpula.', 'Su luz cae en vertical sobre la urna, como si el cielo pintado se abriera.'] },
  'pechinas': { name: 'Pechinas', kind: 'Término', stop: 'crucero', cartela: 'Arquitectura', def: 'Los triángulos curvos que unen los cuatro arcos del crucero con la base redonda de la cúpula. Suelen decorarse con figuras.', photo: PHOTOS.naveCupula, model: 'cupula',
    detail: ['Las pechinas son los cuatro triángulos curvos que pasan de los arcos cuadrados al anillo redondo de la cúpula.', 'Sin ellas, la cúpula no podría apoyarse sobre el crucero.'] },
  'bovedas': { name: 'Bóvedas', kind: 'Obra', stop: 'crucero', cartela: 'Pintura al óleo', def: 'Los techos curvos de la iglesia. Están pintados al óleo con escenas de la Virgen y de la vida de San Juan de Dios.', photo: PHOTOS.naveCupula, model: 'cupula',
    detail: ['Las bóvedas se decoraron al óleo.', 'En el presbiterio, la Asunción de la Virgen; en la capilla del santo, su nacimiento.'] },
  'estipites': { name: 'Estípites', kind: 'Término', stop: 'altar', cartela: 'Barroco andaluz', def: 'Columnas que se estrechan hacia abajo, como una pirámide invertida. Son muy típicas del barroco andaluz del siglo XVIII.', photo: PHOTOS.naveAltar, model: 'columna',
    detail: ['El estípite es una columna que se estrecha hacia abajo, como una pirámide invertida.', 'En el retablo mayor, los estípites custodian el arco del camarín y empujan la mirada hacia arriba.'] },
  'pulpito': { name: 'Púlpito', kind: 'Obra', stop: 'rafael', cartela: 'Madera tallada y dorada', def: 'La tribuna elevada desde la que se predicaba, para que la voz llegara a toda la iglesia.', photo: PHOTOS.naveIzq, model: 'panel',
    detail: ['El púlpito es la tribuna elevada desde la que se predicaba.', 'Su tornavoz, el techo que tiene encima, ayudaba a que la voz llegara a toda la iglesia.'] },
  'lamparas': { name: 'Lámparas de los ángeles', kind: 'Obra', stop: 'despedida', cartela: 'Ángeles portadores de luz', def: 'Ángeles tallados que sostienen las lámparas del templo. Juntan escultura y luz en un mismo efecto teatral.', photo: PHOTOS.naveLamparas, model: 'panel',
    detail: ['Ocho ángeles sostienen las lámparas del templo.', 'Escultura y luz se unen en un mismo efecto de teatro, muy propio del barroco.'] },
};

// Portales: las dos grandes producciones de RA. Al tocarlos se abre una ventana a otra realidad.
export const PORTALS = {
  p1757: { id: 'p1757', label: 'Portal · 1757', title: 'La basílica recién abierta', sub: 'Granada, 1757 · recreación interpretada', img: IMG + 'sjd-8.jpg', grade: 'velas',
    lines: ['Mira por esta ventana: es 1757 y el templo acaba de terminarse.', 'Las velas iluminan el oro recién puesto y los hermanos preparan el traslado de los restos del santo.'] },
  p1549: { id: 'p1549', label: 'Portal · 1549', title: 'El incendio del Hospital Real', sub: 'Granada, 1549 · recreación interpretada', img: IMG + 'sjd-12.jpg', grade: 'fuego',
    lines: ['Asómate: es 1549 y arde el Hospital Real de Granada.', 'Juan entra una y otra vez entre las llamas para sacar a los enfermos. No ocurrió aquí, pero aquí se recuerda.'] },
};

// Paradas. «min» es el tiempo aproximado en la sala (no la duración del audio).
// «map»: posición en el plano (coordenadas del SVG de planos.py). «walk»: cómo llegar desde la anterior.
// «hotspots»: obras con punto en la RA. «portal»: si la sala tiene portal y en qué capítulo se presenta.
export const STOPS = [
  {
    id: 'nave', n: 1, name: 'La nave', short: 'Nave', floor: 0, min: 4, cover: PHOTOS.nave,
    howto: 'Estás en la entrada. Avanza por el centro de la nave, mirando al altar.', walk: { dir: 'straight', m: 15 },
    map: { x: 140.6, y: 447.7, r: 22 },
    hotspots: ['retablo-mayor', 'bovedas', 'lamparas'], portal: 'p1757',
    tracks: {
      historica: [
        { title: 'Bienvenido a mi casa', photo: PHOTOS.nave, focus: 'retablo-mayor', lines: [
          'Bienvenido. Soy Juan Ciudad, aunque en Granada me llamaron [San Juan de Dios](san-juan-de-dios).',
          'Mis hermanos de la Orden Hospitalaria levantaron este templo entre 1734 y 1757 para guardar mis restos.',
        ] },
        { title: 'Una ventana a 1757', photo: PHOTOS.naveCupula, focus: 'p1757', portal: true, lines: [
          'Tanto oro no está aquí para presumir: quiere contar que el amor a los pobres vale más que cualquier tesoro.',
          'Si tienes la cámara abierta, busca la ventana que se abre en la nave y asómate al día en que se terminó.',
        ] },
        { title: 'El retablo', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
          'Al fondo, el [retablo mayor](retablo-mayor) dibuja una vela encendida: así quisieron recordar mi caridad.',
          'Detrás de él, en lo alto, descanso en el camarín. Pero antes, acompáñame a la sacristía.',
        ] },
      ],
      arte: [
        { title: 'La basílica', photo: PHOTOS.nave, focus: 'retablo-mayor', lines: [
          'Bienvenido a la Basílica de [San Juan de Dios](san-juan-de-dios).',
          'Se empezó a construir en 1734 y se terminó en 1757, sin interrupciones.',
          'Es barroco en estado puro: todo está pensado para emocionar a quien entra.',
        ] },
        { title: 'Una sola idea', photo: PHOTOS.naveCupula, focus: 'p1757', portal: true, lines: [
          'Detrás de tanto oro hay una sola idea: el triunfo de la caridad.',
          'Con la cámara abierta, una ventana en la nave te muestra el templo tal como era al terminarse.',
        ] },
        { title: 'El retablo', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
          'Al fondo, el [retablo mayor](retablo-mayor) dibuja una vela encendida.',
          'Detrás de él, en lo alto, está el [camarín](camarin), al que subirás más tarde.',
        ] },
      ],
    },
    suggest: ['¿Cuándo se construyó?', '¿Quién fue San Juan de Dios?', '¿Qué es el barroco?'],
  },
  {
    id: 'sacristia', n: 2, name: 'La sacristía', short: 'Sacristía', floor: 0, min: 3, cover: PHOTOS.sacristia,
    howto: 'Camina hacia la cabecera y entra por la puerta que hay a la derecha del altar mayor.', walk: { dir: 'right', m: 40 },
    map: { x: 217.2, y: 81.4, r: 26 },
    hotspots: ['mesa-calicera', 'espejos', 'boveda-sacristia', 'cajoneras', 'lavabos'],
    tracks: {
      historica: [
        { title: 'Aquí se preparaba todo', photo: PHOTOS.espejos, focus: 'espejos', lines: [
          'Aquí se preparaba cada misa, con el mismo cuidado con el que yo preparaba las camas de mis enfermos.',
          'Fíjate en los [espejos](espejos): multiplicaban la poca luz de las velas.',
        ] },
        { title: 'La mesa calicera', photo: PHOTOS.mesa, focus: 'mesa-calicera', lines: [
          'En el centro, la [mesa calicera](mesa-calicera), de mármol de [Sierra Elvira](sierra-elvira), la piedra de mi Granada.',
        ] },
        { title: 'Las cajoneras', photo: PHOTOS.cajoneras, focus: 'cajoneras', lines: [
          'Mis hermanos guardaban aquí las vestiduras, en esas [cajoneras](cajoneras) de nogal.',
          'Ahora levanta la vista: la [bóveda](boveda-sacristia) es un cielo abierto.',
        ] },
      ],
      arte: [
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
    },
    suggest: ['¿De dónde viene el mármol de Sierra Elvira?', '¿Para qué servía la sacristía?', '¿Cómo subo al camarín?'],
  },
  {
    id: 'camarin', n: 3, name: 'El camarín', short: 'Camarín', floor: 1, min: 5, cover: PHOTOS.camarin,
    howto: 'Sube por la escalera que hay detrás del altar mayor. Está a un minuto.', walk: { dir: 'up', m: 20 },
    map: { x: 163.8, y: 171.6, r: 27 },
    hotspots: ['templete', 'urna', 'suelo-cubos'], portal: 'p1549',
    tracks: {
      historica: [
        { title: 'Has subido', photo: PHOTOS.antecamarin, focus: 'suelo-cubos', lines: [
          'Has subido al lugar más sagrado de esta casa. Mira el suelo: sus [losas](suelo-cubos) parecen cubos que flotan.',
        ] },
        { title: 'Mis restos', photo: PHOTOS.urna, focus: 'urna', lines: [
          'En el centro, el [templete](templete) de plata, con los doce apóstoles.',
          'Dentro de la [urna](urna) descansan mis restos. Nací en Portugal en 1495 y morí en Granada en 1550.',
        ] },
        { title: 'Una ventana a 1549', photo: PHOTOS.antecamarin, focus: 'p1549', portal: true, lines: [
          'Quiero enseñarte el día más duro de mi vida en Granada: el incendio del Hospital Real.',
          'Busca la ventana que se abre en la sala y asómate. Después, si quieres, quédate un momento en silencio.',
        ] },
      ],
      arte: [
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
        { title: 'Una ventana a 1549', photo: PHOTOS.antecamarin, focus: 'p1549', portal: true, lines: [
          'Con la cámara abierta, una ventana en la sala te lleva a Granada en 1549, al incendio del Hospital Real.',
        ] },
      ],
    },
    suggest: ['¿Qué hay dentro de la urna?', '¿Quién fue San Juan de Dios?', '¿Qué es un templete?'],
  },
  {
    id: 'cupula', n: 4, name: 'La cúpula del camarín', short: 'Cúpula', floor: 1, min: 3, cover: PHOTOS.cupula,
    howto: 'Quédate en el camarín y levanta la vista.', walk: { dir: 'straight', m: 3 },
    map: { x: 163.8, y: 93.6, r: 24 },
    hotspots: ['cupula-camarin', 'linterna', 'templete'],
    tracks: {
      historica: [
        { title: 'El cielo', photo: PHOTOS.cupula, focus: 'cupula-camarin', lines: [
          'Levanta los ojos. La [cúpula](cupula-camarin) pinta el cielo que yo soñaba para mis pobres.',
        ] },
        { title: 'La luz de Granada', photo: PHOTOS.linterna, focus: 'linterna', lines: [
          'Arriba, la [linterna](linterna) deja entrar la luz de Granada, la misma que veía cuando pedía limosna por sus calles.',
        ] },
      ],
      arte: [
        { title: 'Mira hacia arriba', photo: PHOTOS.cupula, focus: 'cupula-camarin', lines: [
          'Levanta la vista: la [cúpula](cupula-camarin) del camarín se abre sobre la urna.',
          'Sus pinturas muestran la gloria del cielo, con santos y ángeles entre nubes.',
        ] },
        { title: 'La luz', photo: PHOTOS.linterna, focus: 'linterna', lines: [
          'En lo alto, la [linterna](linterna) deja entrar la luz natural.',
          'Así, el cielo pintado parece abrirse al cielo de verdad.',
        ] },
      ],
    },
    suggest: ['¿Qué es la linterna?', '¿Quién pintó las bóvedas?', '¿Cómo bajo de nuevo?'],
  },
  {
    id: 'crucero', n: 5, name: 'El crucero', short: 'Crucero', floor: 0, min: 4, cover: PHOTOS.naveCupula,
    howto: 'Baja por la misma escalera y colócate en el centro, bajo la cúpula.', walk: { dir: 'down', m: 25 },
    map: { x: 140.6, y: 179.4, r: 18 },
    hotspots: ['pechinas', 'bovedas'],
    tracks: {
      historica: [
        { title: 'Bajo la cúpula', photo: PHOTOS.naveCupula, focus: 'pechinas', lines: [
          'Volvemos abajo, al centro del crucero. Sobre ti, la gran cúpula descansa en cuatro [pechinas](pechinas).',
          'En las [bóvedas](bovedas) pintaron escenas de mi vida. Busca la de mi nacimiento.',
        ] },
      ],
      arte: [
        { title: 'Bajo la cúpula', photo: PHOTOS.naveCupula, focus: 'pechinas', lines: [
          'Colócate en el centro del crucero, donde se cruzan las naves.',
          'Sobre ti se eleva la gran cúpula, apoyada en cuatro [pechinas](pechinas).',
          'Las [bóvedas](bovedas) se decoraron al óleo con escenas de la Virgen y de la vida del santo.',
        ] },
      ],
    },
    suggest: ['¿Qué son las pechinas?', '¿Quién pintó las bóvedas?', '¿Qué es el barroco?'],
  },
  {
    id: 'altar', n: 6, name: 'El retablo mayor', short: 'Retablo', floor: 0, min: 5, cover: PHOTOS.naveAltar,
    howto: 'Acércate al presbiterio, frente al altar mayor.', walk: { dir: 'straight', m: 10 },
    map: { x: 140.6, y: 61.0, r: 18 },
    hotspots: ['retablo-mayor', 'estipites'],
    tracks: {
      historica: [
        { title: 'Una llama', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
          'Ahora acércate al [retablo mayor](retablo-mayor). Sus [estípites](estipites) suben como una llama.',
          'En la base brilla el sagrario de plata: ahí empieza todo, en el amor.',
        ] },
      ],
      arte: [
        { title: 'Una vela encendida', photo: PHOTOS.naveAltar, focus: 'retablo-mayor', lines: [
          'El [retablo mayor](retablo-mayor) ocupa toda la cabecera, en madera dorada.',
          'Sus [estípites](estipites) enmarcan el arco del camarín y dibujan una vela encendida.',
          'En la base brilla el sagrario de plata.',
        ] },
      ],
    },
    suggest: ['¿Por qué una vela?', '¿Qué son los estípites?', '¿Quién hizo los retablos?'],
  },
  {
    id: 'sanjuan', n: 7, name: 'Capilla de San Juan de Dios', short: 'San Juan', floor: 0, min: 4, cover: PHOTOS.naveDer,
    howto: 'Ve al brazo derecho del crucero.', walk: { dir: 'right', m: 12 },
    map: { x: 244.2, y: 201.7, r: 18 },
    hotspots: ['san-juan-de-dios', 'bovedas'],
    tracks: {
      historica: [
        { title: 'Mi capilla', photo: PHOTOS.naveDer, focus: 'san-juan-de-dios', lines: [
          'Esta es mi capilla. Me representaron con un crucifijo que no miro, sino que muestro.',
          'Así quiero que trates al enfermo: como si tuvieras delante al mismo Cristo.',
        ] },
      ],
      arte: [
        { title: 'El santo', photo: PHOTOS.naveDer, focus: 'san-juan-de-dios', lines: [
          'En esta capilla preside [San Juan de Dios](san-juan-de-dios), en una escultura policromada.',
          'Sostiene un crucifijo que no mira, sino que enseña: así hay que tratar al enfermo.',
        ] },
      ],
    },
    suggest: ['¿Quién fue San Juan de Dios?', '¿Dónde están sus restos?', '¿Qué es la Orden Hospitalaria?'],
  },
  {
    id: 'rafael', n: 8, name: 'San Rafael y el púlpito', short: 'San Rafael', floor: 0, min: 3, cover: PHOTOS.naveIzq,
    howto: 'Cruza al brazo izquierdo, frente a la capilla del santo.', walk: { dir: 'left', m: 20 },
    map: { x: 37.0, y: 201.7, r: 18 },
    hotspots: ['pulpito', 'bovedas'],
    tracks: {
      historica: [
        { title: 'Mi compañero', photo: PHOTOS.naveIzq, focus: 'pulpito', lines: [
          'El arcángel San Rafael me acompañó en los momentos difíciles, o eso cuentan quienes escribieron mi vida.',
          'Por eso mis hermanos lo quieren tanto. Junto a su capilla está el [púlpito](pulpito).',
        ] },
      ],
      arte: [
        { title: 'El arcángel', photo: PHOTOS.naveIzq, focus: 'pulpito', lines: [
          'El arcángel San Rafael está muy unido a la Orden Hospitalaria.',
          'Representa el cuidado y el acompañamiento a quien lo necesita.',
          'Junto a la capilla verás el [púlpito](pulpito), tallado y dorado.',
        ] },
      ],
    },
    suggest: ['¿Qué es un púlpito?', '¿Por qué San Rafael?', '¿Quién fue San Juan de Dios?'],
  },
  {
    id: 'belen', n: 9, name: 'Belén y San José', short: 'Belén', floor: 0, min: 3, cover: PHOTOS.naveDer,
    howto: 'Ve a las capillas de la derecha de la nave.', walk: { dir: 'right', m: 25 },
    map: { x: 199.8, y: 320.1, r: 18 },
    hotspots: ['bovedas'],
    tracks: {
      historica: [
        { title: 'La familia que acoge', photo: PHOTOS.naveDer, focus: null, lines: [
          'En estas capillas están Nuestra Señora de Belén y San José, la familia que acoge.',
          'Mira los zócalos: mármoles de muchos colores, como la gente que llegaba a mi hospital.',
        ] },
      ],
      arte: [
        { title: 'Las capillas', photo: PHOTOS.naveDer, focus: null, lines: [
          'En las capillas de la nave están Nuestra Señora de Belén y San José.',
          'Fíjate en los zócalos: combinan mármoles de distintos colores.',
        ] },
      ],
    },
    suggest: ['¿Qué es un zócalo?', '¿Cuándo se construyó?', '¿Cómo salgo?'],
  },
  {
    id: 'despedida', n: 10, name: 'Las lámparas y la despedida', short: 'Despedida', floor: 0, min: 3, cover: PHOTOS.naveLamparas,
    howto: 'Vuelve hacia la entrada por el centro de la nave.', walk: { dir: 'straight', m: 20 },
    map: { x: 75.8, y: 377.4, r: 18 },
    hotspots: ['lamparas', 'retablo-mayor'],
    tracks: {
      historica: [
        { title: 'Hasta pronto', photo: PHOTOS.naveLamparas, focus: 'lamparas', lines: [
          'Antes de irte, mira las [lámparas](lamparas) que sostienen los ángeles.',
          'Gracias por acompañarme. Ahora te toca a ti: haz el bien, hermano, y sigue tu camino.',
        ] },
      ],
      arte: [
        { title: 'Hasta pronto', photo: PHOTOS.naveLamparas, focus: 'lamparas', lines: [
          'Antes de salir, mira las [lámparas](lamparas) que sostienen los ángeles.',
          'Has recorrido un monumento levantado a la caridad.',
          'Gracias por visitar la Basílica de San Juan de Dios.',
        ] },
      ],
    },
    suggest: ['¿Qué significa la vela del retablo?', '¿Quién fue San Juan de Dios?', '¿Cuándo se construyó?'],
  },
];

export const LANGS = [
  { code: 'ES', name: 'Español', sub: 'Spanish' },
  { code: 'EN', name: 'English', sub: 'Inglés' },
  { code: 'FR', name: 'Français', sub: 'Francés' },
  { code: 'DE', name: 'Deutsch', sub: 'Alemán' },
  { code: 'IT', name: 'Italiano', sub: 'Italiano' },
  { code: 'PT', name: 'Português', sub: 'Portugués' },
  { code: 'ZH', name: '中文', sub: 'Chino' },
  { code: 'JA', name: '日本語', sub: 'Japonés' },
];

// Cuestionario inicial. Una pregunta por pantalla: tocar selecciona; «Continuar» avanza.
// Si se elige «Veo poco o nada», se salta la pregunta del modo: la visita es automática y por voz.
export const SURVEY = [
  { key: 'lang', icon: 'i-globe', title: '¿En qué idioma?', lang: true },
  { key: 'route', icon: 'i-route', title: '¿Qué visita quieres hacer?', cards: true, options: [
    { v: 'historica', t: 'Histórica', s: 'San Juan de Dios te cuenta su vida y la fe que levantó este templo.', k: 'Con San Juan de Dios', art: 'historica', tags: ['En primera persona', 'Su vida y su obra'] },
    { v: 'arte', t: 'Arte y arquitectura', s: 'Un narrador te explica lo que ves: bóvedas, retablos y materiales.', k: 'Con un narrador', art: 'arte', tags: ['Narrador', 'Obras y materiales'] },
  ] },
  { key: 'access', icon: 'i-access', title: '¿Adaptamos la visita?', options: [
    { v: 'none', t: 'Sin adaptaciones', icon: 'i-check' },
    { v: 'visual', t: 'Adaptar la visita para personas con discapacidad visual', s: 'La visita avanza sola en cada sala y te indica el camino por voz. Preguntas hablando, sin tocar la pantalla.', icon: 'i-ear' },
    { v: 'auditiva', t: 'Adaptar la visita para personas con discapacidad auditiva', s: 'Primero el texto, en grande, y subtítulos siempre activos, también sobre la cámara.', icon: 'i-text' },
  ] },
  // Dos decisiones en una pantalla: qué ves (con o sin RA) y cómo avanza (sola al llegar o a tu ritmo)
  { key: 'mode', icon: 'i-ar', title: '¿Cómo quieres recorrerla?', skipIf: (st) => st.access === 'visual', groups: [
    { key: 'ar', label: 'Qué ves', options: [
      { v: 'si', t: 'Con realidad aumentada', s: 'Puntos y obras en 3D sobre la sala, con la cámara.', icon: 'i-ar', badge: 'Recomendada' },
      { v: 'no', t: 'Solo audio y texto', s: 'Sin cámara: escuchas y lees cada sala.', icon: 'i-headph' },
    ] },
    { key: 'advance', label: 'Cómo avanza', options: [
      { v: 'auto', t: 'Automática', s: 'Cada sala empieza sola al llegar.', icon: 'i-auto' },
      { v: 'manual', t: 'A tu ritmo', s: 'Tú eliges cuándo empieza cada sala.', icon: 'i-play' },
    ] },
  ] },
];

// Asistente sin conexión: respuestas preparadas. En producción, el guía responde con una base de datos
// vectorial alimentada solo con las fuentes verificadas por el cliente.
export const KB = [
  { keys: ['sierra elvira', 'marmol', 'mármol', 'piedra'], a: 'De las canteras de Sierra Elvira, a las afueras de Granada. Es una piedra gris oscura, casi negra cuando se pule, que se usó mucho en los edificios de la ciudad.', stop: 'sacristia' },
  { keys: ['sacristia', 'sacristía', 'para que servia', 'para qué servía'], a: 'Era la sala donde se preparaba la misa: los sacerdotes se vestían, se guardaban los objetos del culto y se preparaban los cálices sobre la mesa calicera.', stop: 'sacristia' },
  { keys: ['pinto', 'pintó', 'pintor', 'pinturas', 'boveda', 'bóveda', 'bovedas', 'bóvedas'], a: 'Las bóvedas de la iglesia se decoraron al óleo con escenas de la Virgen y de la vida del santo. Según la audioguía antigua, son obra de Sánchez Sarabia; es un dato que aún estamos verificando.', stop: 'crucero' },
  { keys: ['subo', 'subir', 'llego', 'llegar', 'escalera', 'como voy', 'cómo voy'], a: 'Sube por la escalera que hay detrás del altar mayor. El camarín está en la planta 1, a un minuto.', stop: 'camarin', action: 'map' },
  { keys: ['bajo', 'bajar', 'salgo', 'salir', 'salida'], a: 'Baja por la misma escalera hasta el crucero. La salida está al fondo de la nave, por donde entraste.', stop: 'crucero', action: 'map' },
  { keys: ['cuando', 'cuándo', 'construyo', 'construyó', 'construido', 'año', 'siglo'], a: 'Las obras empezaron en 1734 y terminaron en 1757, sin interrupciones. Es uno de los grandes ejemplos del barroco del siglo XVIII en Granada.', stop: 'nave' },
  { keys: ['quien fue', 'quién fue', 'san juan de dios', 'fundador', 'santo'], a: 'Juan Ciudad nació en Portugal en 1495 y dedicó su vida, en Granada, a cuidar de los pobres y de los enfermos. De su obra nació la Orden Hospitalaria. Murió en 1550.', stop: 'sanjuan' },
  { keys: ['restos', 'urna', 'enterrado', 'reliquias', 'dentro'], a: 'Sus restos se guardan en la urna de plata del camarín, en la planta 1. Sus cuatro medallones cuentan escenas de su vida.', stop: 'camarin' },
  { keys: ['mesa calicera', 'calicera', 'calices', 'cálices'], a: 'Es la mesa donde se preparaban los cálices para la misa. Tiene columnas de mármol de Sierra Elvira y un tablero de mármol de Macael.', stop: 'sacristia' },
  { keys: ['espejo', 'espejos'], a: 'Son tres grandes espejos con marcos tallados y dorados. En una sala con poca luz, multiplicaban la de las velas y la de la ventana.', stop: 'sacristia' },
  { keys: ['retablo', 'vela', 'cirio'], a: 'El retablo mayor dibuja una vela encendida: es la imagen del amor y de la caridad, la idea que guía todo el templo.', stop: 'altar' },
  { keys: ['barroco'], a: 'El barroco busca emocionar: luz, oro, movimiento y efectos de teatro para provocar un movimiento interior en quien mira.', stop: 'nave' },
  { keys: ['cupula', 'cúpula', 'linterna'], a: 'La cúpula del camarín se abre sobre la urna. En lo alto, la linterna deja entrar la luz para que el cielo pintado parezca abrirse.', stop: 'cupula' },
  { keys: ['pechina', 'pechinas'], a: 'Son los triángulos curvos que unen los arcos del crucero con la base redonda de la cúpula.', stop: 'crucero' },
  { keys: ['estipite', 'estípite', 'estipites', 'estípites'], a: 'Columnas que se estrechan hacia abajo, como una pirámide invertida. Son muy típicas del barroco andaluz.', stop: 'altar' },
  { keys: ['templete'], a: 'Es la pequeña construcción con columnas y cúpula que protege la urna, rodeada por los doce apóstoles de plata.', stop: 'camarin' },
  { keys: ['pulpito', 'púlpito'], a: 'Es la tribuna elevada desde la que se predicaba, para que la voz llegara a toda la iglesia.', stop: 'rafael' },
  { keys: ['rafael'], a: 'El arcángel San Rafael está muy unido a la Orden Hospitalaria: representa el cuidado y el acompañamiento.', stop: 'rafael' },
  { keys: ['orden hospitalaria', 'hospitalaria', 'orden'], a: 'Es la orden religiosa que nació de la obra de San Juan de Dios. Hoy sigue cuidando de enfermos en hospitales de todo el mundo.', stop: 'sanjuan' },
  { keys: ['zocalo', 'zócalo', 'zocalos', 'zócalos'], a: 'El zócalo es la franja baja de las paredes. Aquí combina mármoles de distintos colores.', stop: 'belen' },
  { keys: ['incendio', 'hospital real', '1549'], a: 'En 1549 ardió el Hospital Real de Granada y Juan entró varias veces entre las llamas para sacar a los enfermos. No ocurrió en esta basílica, pero aquí se recuerda.', stop: 'camarin' },
];

export const FALLBACK = 'Eso no lo sé con la información de esta visita. Puedo contarte sobre la sacristía, el camarín o la vida de San Juan de Dios.';
