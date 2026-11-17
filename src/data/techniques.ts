import { NoteEvent, TimeSignature } from '../types/music';
import { BassToneMode } from '../utils/audioEngine';

export type TechniqueCategory =
  | 'Mano Derecha'
  | 'Mano Izquierda'
  | 'Estilos y Grooves'
  | 'Acústico y Fretless';

export type AnimatorPreset =
  | 'floating_thumb'
  | 'slap_pop'
  | 'staccato_muting'
  | 'left_hand'
  | 'blues_shuffle'
  | 'rocknroll'
  | 'reggae'
  | 'cumbia'
  | 'upright';

export interface TechniqueStep {
  stepNumber: number;
  title: string;
  explanation: string;
  visualCue: string;
  bpm: number;
  timeSignature: TimeSignature;
  keySignature: string;
  toneMode: BassToneMode;
  notes: NoteEvent[];
}

export interface DiagramCallout {
  color: 'amber' | 'sky';
  label: string;
}

export interface TechniqueGuide {
  id: string;
  title: string;
  category: TechniqueCategory;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  imageUrl: string;
  imageAlt: string;
  diagramCallouts: DiagramCallout[];
  summary: string;
  anatomyPoints: string[];
  commonMistakes: string[];
  electricNotes: string;
  acousticNotes: string;
  pdfSourceId: string;
  animatorPreset: AnimatorPreset;
  steps: TechniqueStep[];
}

export const TECHNIQUE_GUIDES: TechniqueGuide[] = [
  {
    id: 'tech-floating-thumb',
    title: 'Muteo Flotante (Floating Thumb)',
    category: 'Mano Derecha',
    level: 'Intermedio',
    imageUrl: '/src/assets/images/diagram_floating_thumb_1794953260312.jpg',
    imageAlt: 'Diagrama ilustrativo de postura del Muteo Flotante (Floating Thumb) con pulgar derecho apagando cuerdas graves',
    diagramCallouts: [
      { color: 'amber', label: 'Desplazamiento vertical del pulgar siguiendo los saltos de cuerda' },
      { color: 'sky', label: 'Zonas de contacto lateral del pulgar e índice silenciando cuerdas graves' },
    ],
    summary:
      'La técnica estándar moderna para evitar ruidos por simpatía al cambiar de cuerda. A diferencia del anclaje fijo en la pastilla, el pulgar derecho desciende y flota apoyando su lateral sobre todas las cuerdas más graves que la cuerda que estás pulsando.',
    anatomyPoints: [
      'Mantén el pulgar relajado y casi paralelo al mástil, usando la cara lateral carnosa del pulgar como sordina continua.',
      'Cuando tocas la cuerda Mi (4ª), el pulgar descansa suavemente sobre la pastilla o el borde del golpeador.',
      'Al bajar a la cuerda La (3ª), el pulgar se apoya sobre la cuerda Mi (4ª) para silenciarla.',
      'Al pasar a Re (2ª) o Sol (1ª), el pulgar descansa en la cuerda La o Re mientras la palma y el anular/meñique cubren la Mi.',
    ],
    commonMistakes: [
      'Dejar el pulgar anclado en la pastilla al tocar Sol o Re: provoca que las cuerdas Mi y La vibren por resonancia.',
      'Doblar en exceso la muñeca derecha formando un ángulo de 90°; mantén el antebrazo y la muñeca alineados.',
      'Apretar demasiado las cuerdas con el pulgar en lugar de rozarlas suavemente (el exceso de fuerza produce armónicos indeseados).',
    ],
    electricNotes:
      'Indispensable en bajos de 4, 5 y 6 cuerdas con pastillas activas o compresión alta donde cualquier cuerda al aire ensucia la mezcla.',
    acousticNotes:
      'En bajo acústico electro-amplificado evita acoples (feedback) graves controlando la vibración simpática de las cuerdas gruesas.',
    pdfSourceId: 'pdf-adrian-ashton',
    animatorPreset: 'floating_thumb',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Anclaje base en Mi y transición a La',
        explanation:
          'Pulsa dos veces Mi al aire con el pulgar en la pastilla. Inmediatamente desliza el lateral del pulgar sobre la cuerda Mi al pulsar la cuerda La para cortarla en seco.',
        visualCue: 'Pastilla -> Apoyo en cuerda Mi (cuerda 4)',
        bpm: 72,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0 },
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0 },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0 },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 28, durationBeats: 2, stringNum: 4, fret: 0 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Descenso completo Mi -> La -> Re -> Sol',
        explanation:
          'Escala por octavas y quintas cruzando todas las cuerdas. Siente cómo el pulgar actúa como un ascensor siguiendo a los dedos índice y medio.',
        visualCue: 'Pulgar baja progresivamente: Pastilla -> Mi -> La -> Re',
        bpm: 80,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0 },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 38, durationBeats: 1, stringNum: 2, fret: 0 },
          { midi: 43, durationBeats: 1, stringNum: 1, fret: 0 },
          { midi: 38, durationBeats: 1, stringNum: 2, fret: 0 },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 28, durationBeats: 2, stringNum: 4, fret: 0 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Saltos de cuerda limpios con notas fantasma',
        explanation:
          'Alterna fundamental en cuerda Mi/La y octava aguda en Sol con muteo absoluto entre notas, alternando notas reales y percusiones fantasma (X).',
        visualCue: 'Pulgar en La/Re silenciando graves mientras el índice/medio pulsan Sol',
        bpm: 92,
        timeSignature: '4/4',
        keySignature: 'G',
        toneMode: 'electric_finger',
        notes: [
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3 },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'ghost' },
          { midi: 43, durationBeats: 0.5, stringNum: 1, fret: 0, technique: 'accent' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'ghost' },
          { midi: 33, durationBeats: 0.5, stringNum: 3, fret: 0 },
          { midi: 45, durationBeats: 0.5, stringNum: 1, fret: 2 },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, technique: 'staccato' },
        ],
      },
    ],
  },
  {
    id: 'tech-slap-pop',
    title: 'Slap & Pop Progresivo',
    category: 'Mano Derecha',
    level: 'Intermedio',
    imageUrl: '/src/assets/images/diagram_slap_pop_1794953261576.jpg',
    imageAlt: 'Diagrama ilustrativo de postura para Slap y Pop mostrando pulgar paralelo y enganche del dedo índice',
    diagramCallouts: [
      { color: 'amber', label: 'Rotación del antebrazo y rebote rápido del pulgar sobre el último traste' },
      { color: 'sky', label: 'Articulación ósea del pulgar (Slap) y yema del índice bajo Sol (Pop)' },
    ],
    summary:
      'Desarrollado por Larry Graham y perfeccionado por Marcus Miller y Flea. El sonido nace de la rotación rápida del antebrazo (como girar un pomo de puerta), golpeando la cuerda justo encima del último traste y tirando de las agudas con el índice.',
    anatomyPoints: [
      'Alinea el pulgar paralelo a las cuerdas (estilo Marcus Miller/Flea clásico o ligero ángulo hacia arriba para atravesar la cuerda).',
      'Golpea con la articulación ósea del pulgar sobre el borde final del diapasón (trastes 20–24) para obtener el rebote metálico brillante.',
      'El movimiento viene de girar el antebrazo, nunca de martillar con todo el brazo desde el codo.',
      'Para el Pop, desliza la yema del índice o medio bajo la cuerda Sol o Re y tira hacia afuera permitiendo que vuelva contra los trastes.',
    ],
    commonMistakes: [
      'Dejar el pulgar pegado a la cuerda tras el golpe: ahoga el sonido (salvo cuando buscas un thump apagado intencional).',
      'Tirar demasiado fuerte en el Pop rompiendo el groove y desafinando la nota.',
      'No mutear con la palma de la mano izquierda entre golpes de slap.',
    ],
    electricNotes:
      'Activa ambas pastillas (Jazz Bass) o pastilla puente Humbucker (StingRay), recorta ligeramente medios (400 Hz) y realza graves y agudos.',
    acousticNotes:
      'En bajo acústico utiliza un golpe mucho más sutil y cercano al puente para evitar cerdeos excesivos contra la boca de resonancia.',
    pdfSourceId: 'pdf-adrian-ashton',
    animatorPreset: 'slap_pop',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Rebote limpio de pulgar (Thumb Bounce)',
        explanation:
          'Practica únicamente el golpe de pulgar (T) sobre Mi al aire y Sol (traste 3). Concéntrate en que el pulgar rebote al instante para dejar vibrar la cuerda.',
        visualCue: 'Pulgar paralelo rebota sobre el último traste en cuerda Mi (4)',
        bpm: 76,
        timeSignature: '4/4',
        keySignature: 'E',
        toneMode: 'electric_slap',
        notes: [
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, technique: 'slap' },
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0, technique: 'slap' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Octavas Funk (Slap + Pop alternados)',
        explanation:
          'Combina el pulgar (T) en cuerda Mi/La con el tirón (P) del índice en su octava superior dos cuerdas más abajo (D/G).',
        visualCue: 'T en grave -> rotación de muñeca -> P con índice en cuerda D/G',
        bpm: 88,
        timeSignature: '4/4',
        keySignature: 'E',
        toneMode: 'electric_slap',
        notes: [
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 40, durationBeats: 0.5, stringNum: 2, fret: 2, technique: 'pop' },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 40, durationBeats: 0.5, stringNum: 2, fret: 2, technique: 'pop' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'slap' },
          { midi: 43, durationBeats: 0.5, stringNum: 2, fret: 5, technique: 'pop' },
          { midi: 33, durationBeats: 0.5, stringNum: 4, fret: 5, technique: 'slap' },
          { midi: 45, durationBeats: 0.5, stringNum: 2, fret: 7, technique: 'pop' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Groove Slap con Notas Fantasma (X) y Hammer-on',
        explanation:
          'Inserta golpes percusivos muteados con la mano izquierda (X) y ligados ascendentes de b7 a tónica para lograr un fraseo funk auténtico.',
        visualCue: 'T (Mi) -> X fantasma -> H (Sol a La) -> P (Octava)',
        bpm: 96,
        timeSignature: '4/4',
        keySignature: 'E',
        toneMode: 'electric_slap',
        notes: [
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 28, durationBeats: 0.25, stringNum: 4, fret: 0, technique: 'ghost' },
          { midi: 40, durationBeats: 0.25, stringNum: 2, fret: 2, technique: 'pop' },
          { midi: 38, durationBeats: 0.5, stringNum: 2, fret: 0, technique: 'slap' },
          { midi: 40, durationBeats: 0.5, stringNum: 2, fret: 2, technique: 'hammer' },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'slap' },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'ghost' },
          { midi: 43, durationBeats: 0.5, stringNum: 1, fret: 0, technique: 'pop' },
          { midi: 40, durationBeats: 0.5, stringNum: 2, fret: 2, technique: 'pull' },
        ],
      },
    ],
  },
  {
    id: 'tech-staccato-muting',
    title: 'Staccato, Palm Mute y Corte Rítmico',
    category: 'Mano Derecha',
    level: 'Principiante',
    imageUrl: '/src/assets/images/diagram_staccato_muting_1794953285896.jpg',
    imageAlt: 'Diagrama ilustrativo de postura para Staccato y Palm Mute mostrando apagado en el puente y liberación izquierda',
    diagramCallouts: [
      { color: 'amber', label: 'Micro-relajación de dedos izquierdos sin perder contacto con la cuerda' },
      { color: 'sky', label: 'Apoyo suave del canto de la palma derecha junto a las selletas del puente' },
    ],
    summary:
      'El control del silencio define el groove tanto como las propias notas. Combina el staccato de mano izquierda (relajar la presión sin despegar la yema) con el Palm Mute derecho junto al puente para lograr notas cortas, secas y percusivas al instante.',
    anatomyPoints: [
      'Staccato izquierdo: pulsa la nota y relaja de inmediato el dedo pisador manteniendo la yema tocando la cuerda para apagarla sin producir un ruido al aire.',
      'Palm Mute derecho: apoya suavemente el borde carnoso externo de la palma sobre las cuerdas justo delante de las selletas del puente.',
      'Con la palma apoyada en el puente, pulsa las cuerdas con el pulgar (thumb pluck) o los dedos índice/medio logrando un timbre redondo estilo Motown/años 60.',
      'Alterna notas largas (legato) y notas secas (staccato) para crear contraste dinámico y hacer respirar la batería.',
    ],
    commonMistakes: [
      'Levantar completamente el dedo izquierdo de la cuerda al hacer staccato: provoca que la cuerda suene al aire o genere armónicos.',
      'Apoyar la palma demasiado lejos del puente: mata completamente la afinación convirtiéndola en un golpe sordo sin tono.',
      'Cortar tarde la nota haciendo que el bajo se monte encima de los silencios del bombo o la caja.',
    ],
    electricNotes:
      'Brilla en Funk, Disco, Soul (estilo Carol Kaye / Pino Palladino) y Reggae. Prueba colocar espuma bajo el puente o usar Palm Mute con púa o pulgar.',
    acousticNotes:
      'En bajo acústico, el corte rápido con mano izquierda evita que la caja siga zumbando y mantiene definida cada línea rítmica.',
    pdfSourceId: 'pdf-rock-bass-basics',
    animatorPreset: 'staccato_muting',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Staccato limpio con relajación de mano izquierda',
        explanation:
          'Pulsa cada negra en Do y Mi relajando la presión de la mano izquierda justo en la mitad del pulso para crear cortes secos sin ruidos de cuerda al aire.',
        visualCue: 'Relaja dedo 2 (C) y dedo 1 (E) manteniendo contacto superficial',
        bpm: 84,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, technique: 'staccato' },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, technique: 'staccato' },
          { midi: 40, durationBeats: 1, stringNum: 2, fret: 2, technique: 'staccato' },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5, technique: 'staccato' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Palm Mute vintage con pulgar junto al puente',
        explanation:
          'Apoya el canto externo de la palma sobre las selletas del puente y pulsa con la yema del pulgar para lograr ese timbre cálido, grueso y corto clásico.',
        visualCue: 'Palma en puente + pulgar pulsando suave en Mi y La',
        bpm: 92,
        timeSignature: '4/4',
        keySignature: 'G',
        toneMode: 'electric_finger',
        notes: [
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, technique: 'staccato', chordSymbol: 'G' },
          { midi: 35, durationBeats: 0.5, stringNum: 3, fret: 2, technique: 'staccato' },
          { midi: 38, durationBeats: 0.5, stringNum: 3, fret: 5, technique: 'staccato' },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, technique: 'staccato' },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5, technique: 'staccato' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Contraste dinámico Legato vs. Staccato (Groove)',
        explanation:
          'Combina notas sostenidas (accent) en el tiempo 1 con corcheas staccato cortas en los tiempos 2, 3 y 4 para lograr un groove elástico.',
        visualCue: 'Tiempo 1 largo -> cortes secos en corcheas siguientes',
        bpm: 100,
        timeSignature: '4/4',
        keySignature: 'E',
        toneMode: 'electric_finger',
        notes: [
          { midi: 28, durationBeats: 1, stringNum: 4, fret: 0, technique: 'accent', chordSymbol: 'Em7' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'staccato' },
          { midi: 33, durationBeats: 0.5, stringNum: 3, fret: 0, technique: 'staccato' },
          { midi: 35, durationBeats: 1, stringNum: 3, fret: 2, technique: 'staccato' },
          { midi: 38, durationBeats: 0.5, stringNum: 2, fret: 0, technique: 'accent' },
          { midi: 35, durationBeats: 0.5, stringNum: 3, fret: 2, technique: 'staccato' },
        ],
      },
    ],
  },
  {
    id: 'tech-left-hand',
    title: 'Mano Izquierda: 1-Dedo-por-Traste y Método Simandl',
    category: 'Mano Izquierda',
    level: 'Principiante',
    imageUrl: '/src/assets/images/diagram_left_hand_simandl_1794953264127.jpg',
    imageAlt: 'Diagrama ilustrativo de postura de mano izquierda curvada con pulgar centrado y yemas detrás del traste',
    diagramCallouts: [
      { color: 'amber', label: 'Puntos de presión exactos detrás de la varilla metálica y muñeca recta' },
      { color: 'sky', label: 'Arco natural de los dedos 1–4 paralelo a los trastes' },
    ],
    summary:
      'Domina los dos sistemas esenciales de digitación del bajista profesional: el sistema Simandl (1-2-4, heredado del contrabajo para los trastes graves 1–4 sin tensión) y el sistema 1-Dedo-por-Traste (1-2-3-4) a partir del traste 5.',
    anatomyPoints: [
      'El pulgar izquierdo se apoya en el centro trasero del mástil, opuesto al dedo medio (2), nunca abrazando el mástil por arriba.',
      'Pisa con las yemas de los dedos justo detrás de la varilla metálica del traste (el 80% cerca del traste siguiente) para minimizar la fuerza necesaria.',
      'En trastes 1–4 (escala larga 34"), usa Simandl: dedo 1, dedo 2 y dedos 3+4 juntos actuando como una unidad sólida.',
      'Desde el traste 5 hacia arriba, asigna estrictamente un dedo por cada traste (1-2-3-4) manteniendo los dedos cerca de las cuerdas.',
    ],
    commonMistakes: [
      'Hacer "dedos voladores" levantando demasiado el meñique (4) cuando no pisa.',
      'Aplastar el dedo pulgar o doblar la muñeca izquierda en ángulo agudo generando fatiga en el túnel carpiano.',
      'Pisar en el centro o atrás del traste provocando trasteos metálicos.',
    ],
    electricNotes:
      'Ajusta la correa de modo que el bajo quede a la misma altura sentado y de pie; facilita mantener la muñeca izquierda neutra.',
    acousticNotes:
      'En bajo acústico y contrabajo (trastes anchos y mayor tensión de cuerdas) el sistema Simandl 1-2-4 en primera posición es obligatorio para evitar lesiones.',
    pdfSourceId: 'pdf-bass-fitness',
    animatorPreset: 'left_hand',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Posición Simandl (Trastes 1–4 · Dedos 1-2-4)',
        explanation:
          'Ejecuta una secuencia en primera posición usando Índice (traste 1), Medio (traste 2) y Anular+Meñique juntos (traste 3/4) sin abrir dolorosamente la mano.',
        visualCue: 'Caja Simandl trastes 1–3: Dedo 1 -> Dedo 2 -> Dedo 4',
        bpm: 72,
        timeSignature: '4/4',
        keySignature: 'F',
        toneMode: 'electric_finger',
        notes: [
          { midi: 29, durationBeats: 1, stringNum: 4, fret: 1 },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3 },
          { midi: 34, durationBeats: 1, stringNum: 3, fret: 1 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3 },
          { midi: 34, durationBeats: 1, stringNum: 3, fret: 1 },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3 },
          { midi: 29, durationBeats: 2, stringNum: 4, fret: 1 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Cromático 1-2-3-4 en Posición V (Bass Fitness)',
        explanation:
          'Desde el traste 5 (La), toca los cuatro trastes consecutivos manteniendo cada dedo apoyado mientras avanzas al siguiente ("técnica de la araña").',
        visualCue: 'Trastes 5–8: D1 (5) -> D2 (6) -> D3 (7) -> D4 (8)',
        bpm: 84,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_finger',
        notes: [
          { midi: 33, durationBeats: 0.5, stringNum: 4, fret: 5 },
          { midi: 34, durationBeats: 0.5, stringNum: 4, fret: 6 },
          { midi: 35, durationBeats: 0.5, stringNum: 4, fret: 7 },
          { midi: 36, durationBeats: 0.5, stringNum: 4, fret: 8 },
          { midi: 38, durationBeats: 0.5, stringNum: 3, fret: 5 },
          { midi: 39, durationBeats: 0.5, stringNum: 3, fret: 6 },
          { midi: 40, durationBeats: 0.5, stringNum: 3, fret: 7 },
          { midi: 41, durationBeats: 0.5, stringNum: 3, fret: 8 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Permutaciones de Independencia (1-3-2-4)',
        explanation:
          'Rompe la inercia natural entre el dedo 3 (anular) y el 4 (meñique) cruzando trastes en diagonal entre las cuerdas La y Re.',
        visualCue: 'Permutación D1 -> D3 -> D2 -> D4',
        bpm: 92,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3 },
          { midi: 38, durationBeats: 0.5, stringNum: 3, fret: 5 },
          { midi: 37, durationBeats: 0.5, stringNum: 3, fret: 4 },
          { midi: 39, durationBeats: 0.5, stringNum: 3, fret: 6 },
          { midi: 41, durationBeats: 0.5, stringNum: 2, fret: 3 },
          { midi: 43, durationBeats: 0.5, stringNum: 2, fret: 5 },
          { midi: 42, durationBeats: 0.5, stringNum: 2, fret: 4 },
          { midi: 44, durationBeats: 0.5, stringNum: 2, fret: 6 },
        ],
      },
    ],
  },
  {
    id: 'tech-blues',
    title: 'El Blues: 12 Compases, Shuffle, Box Pattern y Blue Note',
    category: 'Estilos y Grooves',
    level: 'Principiante',
    imageUrl: '/src/assets/images/diagram_blues_shuffle_1794953265570.jpg',
    imageAlt: 'Diagrama ilustrativo de postura de Blues mostrando caja en mano izquierda y ataque sobre pastilla Precision',
    diagramCallouts: [
      { color: 'amber', label: 'Tónica con dedo 2 (ancla de la caja) y ataque relajado en mano derecha' },
      { color: 'sky', label: 'Geometría transportable de la caja de Blues 1–3–5–6–b7 sobre el mástil' },
    ],
    summary:
      'El ADN del bajo moderno basado en "Blues Bass" de Ed Friedland. Aprende la estructura I–IV–V de 12 compases, la sensación ternaria del Shuffle (corcheas atresilladas), la caja movible (Box Pattern 1–3–5–6–b7) y el uso cromático de la Nota de Blues (b5).',
    anatomyPoints: [
      'Caja del Blues Mayor/Dominante (Box Pattern): Tónica (Dedo 2), 3ª Mayor (D1 cuerda inferior), 5ª Justa (D4), 6ª Mayor (D1 siguiente cuerda) y b7 (D2).',
      'El Shuffle: la primera corchea dura 2/3 del pulso y la segunda 1/3 (sensación "chug-a chug-a"), apoyado ligeramente detrás del centro del pulso.',
      'La Nota de Blues (b5 en menor / b3 en mayor) funciona como puente cromático entre la 4ª y la 5ª justa o preparando la resolución al acorde V7.',
      'En los compases 11–12 ejecuta el Turnaround cromático descendente o ascendente hacia el grado V (Mi7 en Blues de La) para reiniciar la rueda.',
    ],
    commonMistakes: [
      'Tocar el shuffle con corcheas rectas de rock en lugar de subdivisión atresillada.',
      'Quedarse atrapado en la Nota de Blues (b5) en tiempo fuerte sin resolverla hacia la 5ª o 4ª.',
      'No anticipar el cambio al grado IV en el compás 5 ni el turnaround final.',
    ],
    electricNotes:
      'Un Precision Bass con cuerdas flatwound y tono ligeramente cerrado (40%) entrega el gruñido clásico de Chicago (Willie Dixon / Duck Dunn).',
    acousticNotes:
      'El Walking Blues en contrabajo o bajo acústico suena enorme atacando con la yema lateral del dedo índice sobre el borde del diapasón.',
    pdfSourceId: 'pdf-blues-bass',
    animatorPreset: 'blues_shuffle',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Box Pattern 1-3-5-6-b7 sobre I7 (La7)',
        explanation:
          'Memoriza la caja móvil del Blues con dedo 2 en la Tónica (La, traste 5 de Mi). Esta misma geometría sirve para los acordes IV7 (Re7) y V7 (Mi7).',
        visualCue: 'D2 (La) -> D1 (Do#) -> D4 (Mi) -> D1 (Fa#) -> D2 (Sol)',
        bpm: 86,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_finger',
        notes: [
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A7' },
          { midi: 37, durationBeats: 1, stringNum: 3, fret: 4 },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7 },
          { midi: 42, durationBeats: 1, stringNum: 2, fret: 4 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5 },
          { midi: 42, durationBeats: 1, stringNum: 2, fret: 4 },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7 },
          { midi: 37, durationBeats: 1, stringNum: 3, fret: 4 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Walking Blues Shuffle + Nota de Blues (b5)',
        explanation:
          'Conecta La7 con Re7 usando paso cromático por la Nota de Blues (Mib / Re#, b5 de La) para crear tensión y resolver en la 5ª o en el nuevo acorde.',
        visualCue: 'La -> Do -> Re -> [Mib Blue Note] -> Mi -> Re7',
        bpm: 96,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_finger',
        notes: [
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A7' },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5 },
          { midi: 39, durationBeats: 1, stringNum: 3, fret: 6, technique: 'accent' },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5, chordSymbol: 'D7' },
          { midi: 42, durationBeats: 1, stringNum: 2, fret: 4 },
          { midi: 45, durationBeats: 1, stringNum: 2, fret: 7 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Turnaround Clásico V7 -> IV7 -> I7 -> V7',
        explanation:
          'Cierra los últimos compases del blues con un turnaround descendente en negras hacia Mi7 (V7) para lanzar de nuevo el compás 1.',
        visualCue: 'Mi7 -> Re7 -> La7 -> Sol# -> La -> Mi7',
        bpm: 104,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_finger',
        notes: [
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, chordSymbol: 'E7' },
          { midi: 44, durationBeats: 1, stringNum: 2, fret: 6 },
          { midi: 42, durationBeats: 1, stringNum: 2, fret: 4 },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5, chordSymbol: 'D7' },
          { midi: 37, durationBeats: 1, stringNum: 3, fret: 4 },
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A7' },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, chordSymbol: 'E7' },
        ],
      },
    ],
  },
  {
    id: 'tech-rocknroll',
    title: 'Rock & Roll: Boogie 1-3-5-6, Walkups y Driving 8ths',
    category: 'Estilos y Grooves',
    level: 'Principiante',
    imageUrl: '/src/assets/images/diagram_rock_pick_driving_1794953265112.jpg',
    imageAlt: 'Diagrama ilustrativo de postura para Rock and Roll con agarre correcto de púa y pivote de muñeca',
    diagramCallouts: [
      { color: 'amber', label: 'Ataque alternado abajo–arriba constante (Driving 8ths) sobre la cuerda' },
      { color: 'sky', label: 'Ángulo de sujeción de la púa y eje de rotación relajado de la muñeca' },
    ],
    summary:
      'Desde Elvis Presley (Bill Black) y Chuck Berry hasta The Beatles (Paul McCartney) y AC/DC. Combina líneas caminantes en negras Boogie, corcheas constantes con púa o dedos ("Driving 8ths") y aproximaciones cromáticas entre acordes.',
    anatomyPoints: [
      'Patrón Boogie Rock & Roll clásico: 1 – 3 – 5 – 6 – b7 – 6 – 5 – 3 sobre progresiones I–IV–V.',
      'En Rock clásico y Punk/Hard Rock, toca corcheas constantes (1 & 2 & 3 & 4 &) manteniendo exactamente el mismo volumen entre dedo índice y medio o con púa alternada.',
      'Utiliza "Walkups" de un semitono o tono entero en el último tiempo del compás para anunciar el cambio de acorde (ej. Mi -> Fa# -> Sol para llegar a Sol).',
      'Silencia ligeramente con el canto de la palma derecha cerca del puente (Palm Mute) para obtener ese ataque grueso y definido de los años 50/60.',
    ],
    commonMistakes: [
      'Acelerar el tempo en los pasajes de corcheas constantes ("rush").',
      'Cambiar de intensidad entre golpe arriba y golpe abajo al usar púa.',
      'Dejar sonar cuerdas anteriores creando una bola de graves sin definición.',
    ],
    electricNotes:
      'Prueba púa mediana (0.88 mm) cerca del puente con un ligero palm mute para ese ataque percusivo estilo McCartney / Cliff Williams.',
    acousticNotes:
      'En Rockabilly o Rock & Roll primitivo acústico destaca el slap de contrabajo golpeando la cuerda contra el diapasón en los tiempos 2 y 4.',
    pdfSourceId: 'pdf-rock-bass-basics',
    animatorPreset: 'rocknroll',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Boogie Rock & Roll (1 – 3 – 5 – 6)',
        explanation:
          'El patrón universal de los años 50. Mantén la articulación firme y en negras claras sobre Do Mayor (C) y Fa Mayor (F).',
        visualCue: 'Tónica (C) -> 3ª (E) -> 5ª (G) -> 6ª (A) en figura simétrica',
        bpm: 118,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_pick',
        notes: [
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, chordSymbol: 'C' },
          { midi: 40, durationBeats: 1, stringNum: 2, fret: 2 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5 },
          { midi: 45, durationBeats: 1, stringNum: 1, fret: 2 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5 },
          { midi: 40, durationBeats: 1, stringNum: 2, fret: 2 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3 },
          { midi: 40, durationBeats: 1, stringNum: 2, fret: 2 },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Corcheas Motor ("Driving 8ths") con Acentos',
        explanation:
          'Corcheas constantes acentuando los tiempos 1 y 3 (o 2 y 4 junto a la caja de la batería) para dar empuje sólido sin perder el pulso.',
        visualCue: 'Púa alternada o dedos alternados i-m constantes en cuerda Mi y La',
        bpm: 126,
        timeSignature: '4/4',
        keySignature: 'E',
        toneMode: 'electric_pick',
        notes: [
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, chordSymbol: 'E5', technique: 'accent' },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0 },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0 },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0 },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0, technique: 'accent' },
          { midi: 28, durationBeats: 0.5, stringNum: 4, fret: 0 },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, chordSymbol: 'G' },
          { midi: 33, durationBeats: 0.5, stringNum: 3, fret: 0, chordSymbol: 'A' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Riff Rock & Roll con Walkup Cromático',
        explanation:
          'Conecta La con Re mediante una escala cromática ascendente Do -> Do# -> Re en el cambio de acorde.',
        visualCue: 'La -> La -> Do -> Do# (paso) -> Re -> Mi -> Sol',
        bpm: 122,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_pick',
        notes: [
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A' },
          { midi: 33, durationBeats: 0.5, stringNum: 4, fret: 5 },
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3 },
          { midi: 37, durationBeats: 1, stringNum: 3, fret: 4 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5, chordSymbol: 'D' },
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A' },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, chordSymbol: 'E' },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5 },
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'A' },
        ],
      },
    ],
  },
  {
    id: 'tech-reggae',
    title: 'Reggae y Roots: One Drop, Silencios y Subgrave',
    category: 'Estilos y Grooves',
    level: 'Intermedio',
    imageUrl: '/src/assets/images/diagram_reggae_subgrave_1794953266450.jpg',
    imageAlt: 'Diagrama ilustrativo de postura de Reggae pulsando sobre el extremo del mástil para máximo subgrave',
    diagramCallouts: [
      { color: 'amber', label: 'Pulsación suave directamente sobre los últimos trastes del diapasón' },
      { color: 'sky', label: 'Proyección de onda subgrave cálida y redonda sin brillo metálico' },
    ],
    summary:
      'Basado en "Reggae Bass" de Ed Friedland. En el Reggae el bajo ES el instrumento melódico principal: los silencios pesan tanto como las notas, se omite a menudo el tiempo 1 y el ataque se desplaza sobre el final del diapasón para sacar puro subgrave.',
    anatomyPoints: [
      'Posición de mano derecha: toca sobre los últimos trastes del mástil (lejos del puente) y recorta todo el control de tono agudo.',
      'One Drop (Aston "Family Man" Barrett): la batería cae fuerte en el tiempo 3; el bajo deja respirar el tiempo 1 o entra sincopado creando hipnosis.',
      'Control de duración (Muteo): cortar la nota exactamente en el silencio siguiente crea el rebote característico de Jamaica.',
      'Usa tríadas sencillas (1 – 3 – 5) y octavas graves dejando muchísimo aire en la mezcla.',
    ],
    commonMistakes: [
      'Rellenar todos los huecos con demasiadas notas y semicorcheas.',
      'Tocar cerca del puente con brillo metálico moderno en lugar de timbre gordo y opaco.',
      'Dejar las notas largas sonando encima de los silencios obligatorios del groove.',
    ],
    electricNotes:
      'Pastilla del mástil al 100%, tono pasivo cerrado al 0–15% y dedos suaves sobre el traste 19–20.',
    acousticNotes:
      'Pulsa con el costado del pulgar o el índice muy cerca de la boca para emular el peso subgrave de un sound system.',
    pdfSourceId: 'pdf-reggae-bass',
    animatorPreset: 'reggae',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Ska / Rocksteady (Base Melódica con Aire)',
        explanation:
          'Antes del Roots Reggae nació el Rocksteady: líneas sincopadas con espacio entre notas sobre tríadas mayores/menores.',
        visualCue: 'Pulsa sobre el mástil, corta la nota con mano izquierda en los silencios',
        bpm: 82,
        timeSignature: '4/4',
        keySignature: 'G',
        toneMode: 'electric_finger',
        notes: [
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, chordSymbol: 'Gm' },
          { midi: 31, durationBeats: 0.5, isRest: true },
          { midi: 34, durationBeats: 0.5, stringNum: 3, fret: 1 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5, technique: 'staccato' },
          { midi: 31, durationBeats: 1, isRest: true },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Roots Reggae · Groove One Drop (Silencio en el 1)',
        explanation:
          'Respira durante el primer tiempo (silencio de negra o corchea) y aterriza con peso profundo en el tiempo 2 y 3 junto al bombo y aro.',
        visualCue: 'Tiempo 1 = Silencio total -> Entrada pesada en 1.5 / 2 y caída en 3',
        bpm: 74,
        timeSignature: '4/4',
        keySignature: 'A',
        toneMode: 'electric_finger',
        notes: [
          { midi: 33, durationBeats: 1, isRest: true, chordSymbol: 'Am' },
          { midi: 33, durationBeats: 0.5, stringNum: 4, fret: 5, technique: 'accent' },
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3 },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, technique: 'staccato' },
          { midi: 38, durationBeats: 0.5, stringNum: 3, fret: 5 },
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Dub Hypnotic Riff con Octava y Quinta Grave',
        explanation:
          'Patrón repetitivo de 2 compases con notas largas seguidas de cortes limpios para dejar espacio a la reverb y delay del Dub.',
        visualCue: 'Silencio limpio al final de cada frase usando ambas manos',
        bpm: 76,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 36, durationBeats: 1.5, stringNum: 3, fret: 3, chordSymbol: 'Cm' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, technique: 'staccato' },
          { midi: 36, durationBeats: 1, isRest: true },
          { midi: 34, durationBeats: 1, stringNum: 4, fret: 6, chordSymbol: 'Bb' },
          { midi: 34, durationBeats: 0.5, isRest: true },
          { midi: 29, durationBeats: 0.5, stringNum: 4, fret: 1 },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, technique: 'staccato' },
        ],
      },
    ],
  },
  {
    id: 'tech-cumbia',
    title: 'La Cumbia: Tríada 1-3-5, Corte Staccato, Tumbao y Sonidera',
    category: 'Estilos y Grooves',
    level: 'Principiante',
    imageUrl: '/src/assets/images/diagram_cumbia_latin_1794953268292.jpg',
    imageAlt: 'Diagrama ilustrativo de postura para Cumbia mostrando alternancia firme derecha y corte staccato izquierdo',
    diagramCallouts: [
      { color: 'amber', label: 'Alternancia rítmica i–m cerca de la pastilla del mástil con pegada firme' },
      { color: 'sky', label: 'Corte seco de mano izquierda sobre la tríada 1–3–5' },
    ],
    summary:
      'El pulso más bailable de Latinoamérica en compás binario (2/4 o 4/4). Aprende desde el patrón tradicional en tríada (Tónica – 3ª – 5ª con corchea y dos semicorcheas o tresillo suave) hasta los cortes staccato, el tumbao colombiano y la cumbia sonidera moderna.',
    anatomyPoints: [
      'Célula rítmica base en 4/4: Negra en el 1 (Tónica), silencio o rebote breve, 3ª y 5ª articuladas con el clásico "pa-tún, pa-tún" del güiro y la conga.',
      'El "Corte Cumbiero": levanta el dedo de la mano izquierda justo después de pulsar la 5ª o la Tónica para lograr un staccato seco y bailable.',
      'Patrón de Cumbia Colombiana / Sabanera: Tónica (negra) -> 3ª (corchea) -> 5ª (corchea), y en acorde menor sustituye la 3ª Mayor por 3ª Menor.',
      'Cumbia Sonidera / Villera / Tex-Mex: añade nota fantasma percusiva en el contratiempo o baja a la 5ª grave debajo de la tónica (ej. Do -> Sol grave -> Mi -> Sol).',
    ],
    commonMistakes: [
      'Tocar las notas ligadas todo el tiempo: sin staccato o aire entre la 3ª y 5ª pierde el "swing" bailable de la cumbia.',
      'Usar 3ª mayor por error sobre un acorde menor (siempre distingue Tríada Mayor 1-3-5 vs Tríada Menor 1-b3-5).',
      'Desfasarse de la guacharaca/güiro por acelerar los contratiempos.',
    ],
    electricNotes:
      'Pastilla del mástil o ambas pastillas equilibradas, ataque firme con dedos cerca de la pastilla delantera y ecualización con pegada en 100 Hz y 700 Hz.',
    acousticNotes:
      'Muy cercano al baby bass o tololoche/guitarrón: pulsa con fuerza con dedo índice/medio y apaga rápido con la palma izquierda.',
    pdfSourceId: 'pdf-bass-grooves',
    animatorPreset: 'cumbia',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Cumbia Tradicional en Tríada Mayor y Menor (1 – 3 – 5)',
        explanation:
          'Alterna el acorde tónico menor (Am: La-Do-Mi) y dominante (E7: Mi-Sol#-Si). Observa cómo el staccato en las últimas corcheas hace bailar la línea.',
        visualCue: 'Negra en Tónica -> corcheas staccato en 3ª y 5ª',
        bpm: 94,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, chordSymbol: 'Am', technique: 'accent' },
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3, technique: 'staccato' },
          { midi: 40, durationBeats: 0.5, stringNum: 3, fret: 7, technique: 'staccato' },
          { midi: 33, durationBeats: 1, stringNum: 4, fret: 5, technique: 'accent' },
          { midi: 36, durationBeats: 0.5, stringNum: 3, fret: 3, technique: 'staccato' },
          { midi: 40, durationBeats: 0.5, stringNum: 3, fret: 7, technique: 'staccato' },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, chordSymbol: 'E7', technique: 'accent' },
          { midi: 32, durationBeats: 0.5, stringNum: 4, fret: 4, technique: 'staccato' },
          { midi: 35, durationBeats: 0.5, stringNum: 3, fret: 2, technique: 'staccato' },
          { midi: 40, durationBeats: 1, stringNum: 3, fret: 7, technique: 'accent' },
          { midi: 32, durationBeats: 0.5, stringNum: 4, fret: 4, technique: 'staccato' },
          { midi: 35, durationBeats: 0.5, stringNum: 3, fret: 2, technique: 'staccato' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Cumbia Rebajada / Sonidera con 5ª Grave y Ghost Note',
        explanation:
          'Desciende a la 5ª por debajo de la fundamental y agrega una nota fantasma percusiva ("chac") antes del contratiempo para imitar el golpe del tambor alegre.',
        visualCue: 'Tónica -> Ghost (X) -> 3ª -> 5ª grave',
        bpm: 92,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 36, durationBeats: 0.75, stringNum: 3, fret: 3, chordSymbol: 'Cm', technique: 'accent' },
          { midi: 36, durationBeats: 0.25, stringNum: 3, fret: 3, technique: 'ghost' },
          { midi: 39, durationBeats: 0.5, stringNum: 3, fret: 6, technique: 'staccato' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'accent' },
          { midi: 36, durationBeats: 0.75, stringNum: 3, fret: 3, technique: 'accent' },
          { midi: 36, durationBeats: 0.25, stringNum: 3, fret: 3, technique: 'ghost' },
          { midi: 39, durationBeats: 0.5, stringNum: 3, fret: 6, technique: 'staccato' },
          { midi: 31, durationBeats: 0.5, stringNum: 4, fret: 3, technique: 'staccato' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Tumbao de Cumbia-Salsa con Anticipación Armónica',
        explanation:
          'Anticipa el siguiente acorde medio tiempo antes de que caiga el compás 2 (síncopa latina), conectando C -> F -> G7.',
        visualCue: 'El cambio de acorde ocurre en el "y" del tiempo 4 (síncopa)',
        bpm: 102,
        timeSignature: '4/4',
        keySignature: 'C',
        toneMode: 'electric_finger',
        notes: [
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, chordSymbol: 'C' },
          { midi: 40, durationBeats: 0.5, stringNum: 2, fret: 2 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5, technique: 'accent' },
          { midi: 41, durationBeats: 0.5, stringNum: 2, fret: 3, chordSymbol: 'F' },
          { midi: 41, durationBeats: 1, stringNum: 2, fret: 3 },
          { midi: 45, durationBeats: 0.5, stringNum: 1, fret: 2 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5, chordSymbol: 'G7', technique: 'accent' },
          { midi: 38, durationBeats: 0.5, stringNum: 3, fret: 5 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, chordSymbol: 'C', technique: 'staccato' },
        ],
      },
    ],
  },
  {
    id: 'tech-acoustic-upright',
    title: 'Bajo Acústico, Contrabajo y Fretless',
    category: 'Acústico y Fretless',
    level: 'Intermedio',
    imageUrl: '/src/assets/images/diagram_acoustic_upright_1794953285840.jpg',
    imageAlt: 'Diagrama ilustrativo de postura de pizzicato vertical en bajo acústico y contrabajo',
    diagramCallouts: [
      { color: 'amber', label: 'Tracción lateral paralela a la tapa usando toda la yema del dedo' },
      { color: 'sky', label: 'Anclaje firme del pulgar en el borde lateral del diapasón de ébano' },
    ],
    summary:
      'Domina las sutilezas acústicas: la proyección natural en bajos acústicos (sin amplificación excesiva), la técnica vertical del pizzicato en contrabajo y la afinación precisa con "mwah" expresivo en bajos sin trastes (Fretless).',
    anatomyPoints: [
      'En Contrabajo / Bajo Acústico vertical, jala la cuerda lateralmente usando toda la longitud de la yema del dedo índice y medio ("meat of the finger").',
      'En Fretless, debes pisar EXACTAMENTE encima de donde estaría la línea del traste (no detrás como en un bajo con trastes) para no quedar calado/grave.',
      'Mantén el vibrato paralelo a la cuerda (hacia el puente y la cejuela), no doblando la cuerda lateralmente como en guitarra eléctrica.',
      'Controla la respiración de las cajas acústicas tapando las cuerdas sobrantes con la mano derecha para evitar resonancias en la tapa.',
    ],
    commonMistakes: [
      'Pisar detrás de la línea de traste en Fretless, sonando constantemente desafinado hacia abajo.',
      'Tirar de las cuerdas hacia afuera (perpendicular al diapasón) en bajo acústico produciendo chasquidos metálicos.',
      'Usar vibrato vertical de guitarra en un mástil fretless de ébano o palosanto.',
    ],
    electricNotes:
      'En Fretless eléctrico (estilo Jaco Pastorius), usa la pastilla del puente al 100% con un poco de medios agudos para hacer cantar el "mwah".',
    acousticNotes:
      'En bajo acústico unplugged apoya el pulgar en la esquina superior de la boca o mástil y proyecta atacando firme en paralelo a la tapa.',
    pdfSourceId: 'pdf-adrian-ashton',
    animatorPreset: 'upright',
    steps: [
      {
        stepNumber: 1,
        title: 'Paso 1: Pizzicato Profundo en Cuerdas Graves (Acústico)',
        explanation:
          'Trabaja la extracción del sonido con todo el peso natural del brazo derecho, permitiendo que cada negra llene todo su valor temporal.',
        visualCue: 'Ataque paralelo a la tapa armónica con toda la yema lateral del índice',
        bpm: 80,
        timeSignature: '4/4',
        keySignature: 'F',
        toneMode: 'acoustic_upright',
        notes: [
          { midi: 29, durationBeats: 1, stringNum: 4, fret: 1, chordSymbol: 'Fmaj7' },
          { midi: 33, durationBeats: 1, stringNum: 3, fret: 0 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3 },
          { midi: 38, durationBeats: 1, stringNum: 2, fret: 0 },
          { midi: 31, durationBeats: 1, stringNum: 4, fret: 3, chordSymbol: 'Gm7' },
          { midi: 34, durationBeats: 1, stringNum: 3, fret: 1 },
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, chordSymbol: 'C7' },
          { midi: 29, durationBeats: 1, stringNum: 4, fret: 1, chordSymbol: 'Fmaj7' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Paso 2: Slide Expresivo y Afinación Fretless',
        explanation:
          'Desliza desde un tono por debajo hasta la 3ª o 5ª en la cuerda Sol/Re para activar el timbre vocal característico del fretless.',
        visualCue: 'Pisa sobre la marca exacta del traste + desliza con vibrato horizontal',
        bpm: 72,
        timeSignature: '4/4',
        keySignature: 'D',
        toneMode: 'acoustic_upright',
        notes: [
          { midi: 38, durationBeats: 1.5, stringNum: 2, fret: 0, chordSymbol: 'Dm7' },
          { midi: 45, durationBeats: 0.5, stringNum: 1, fret: 2, technique: 'slide' },
          { midi: 48, durationBeats: 1, stringNum: 1, fret: 5 },
          { midi: 45, durationBeats: 1, stringNum: 1, fret: 2 },
          { midi: 41, durationBeats: 1.5, stringNum: 2, fret: 3, chordSymbol: 'Gm7' },
          { midi: 43, durationBeats: 0.5, stringNum: 1, fret: 0, technique: 'slide' },
          { midi: 45, durationBeats: 2, stringNum: 1, fret: 2, chordSymbol: 'A7' },
        ],
      },
      {
        stepNumber: 3,
        title: 'Paso 3: Walking Jazz Acústico II–V–I en Bb',
        explanation:
          'Línea caminante orgánica sobre Cm7 -> F7 -> Bbmaj7 usando aproximaciones cromáticas y dinámica uniforme entre cuerdas al aire y pisadas.',
        visualCue: 'Mano izquierda Simandl limpia + sonido de madera cálido en negras',
        bpm: 112,
        timeSignature: '4/4',
        keySignature: 'Bb',
        toneMode: 'acoustic_upright',
        notes: [
          { midi: 36, durationBeats: 1, stringNum: 3, fret: 3, chordSymbol: 'Cm7' },
          { midi: 39, durationBeats: 1, stringNum: 3, fret: 6 },
          { midi: 43, durationBeats: 1, stringNum: 2, fret: 5 },
          { midi: 42, durationBeats: 1, stringNum: 2, fret: 4 },
          { midi: 41, durationBeats: 1, stringNum: 2, fret: 3, chordSymbol: 'F7' },
          { midi: 39, durationBeats: 1, stringNum: 3, fret: 6 },
          { midi: 38, durationBeats: 1, stringNum: 3, fret: 5 },
          { midi: 35, durationBeats: 1, stringNum: 3, fret: 2 },
          { midi: 34, durationBeats: 2, stringNum: 3, fret: 1, chordSymbol: 'Bbmaj7' },
          { midi: 29, durationBeats: 2, stringNum: 4, fret: 1 },
        ],
      },
    ],
  },
];
