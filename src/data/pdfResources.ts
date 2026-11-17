import { PdfResource } from '../types/music';

export const PDF_RESOURCES: PdfResource[] = [
  {
    id: 'pdf-adrian-ashton',
    title: 'Curso Completo de Bajo Eléctrico',
    author: 'Adrian Ashton',
    language: 'Español',
    fileUrl: '/assets/aistudio/curso-completo-de-bajo-electrico-adrian-ashton_092a6504.pdf',
    focus: 'Anatomía, historia (Precision/Jazz/StingRay/Acústico/Fretless), técnica integral, lectura de partituras, armonía modal, slap, armónicos y educación auditiva.',
    pagesOrTracks: '258 páginas · 89 pistas de audio',
    genres: ['Rock', 'Jazz', 'Funk', 'Pop', 'Motown', 'Blues', 'Fretless', 'Acústico'],
  },
  {
    id: 'pdf-progressive-bass',
    title: 'Bass Guitar: For Beginner to Advanced Students',
    author: 'Gary Turner & Brenton White (Koala)',
    language: 'Inglés',
    fileUrl: '/assets/aistudio/BASS_GUITAR_For_Beginner_to_Advanced_Students_5284d339.pdf',
    focus: 'Método progresivo en 48 lecciones: cuerdas al aire, turnarounds, blues de 12 compases, lectura en clave de Fa y TAB, escalas, ritmos compuestos, reggaes, bossa, samba, mambo, cha-cha y arpegios.',
    pagesOrTracks: '112 páginas · 48 lecciones progresivas',
    genres: ['Blues', 'Rock', 'Pop', 'Reggae', 'Bossa Nova', 'Samba', 'Cha-Cha', 'Mambo'],
  },
  {
    id: 'pdf-bass-fitness',
    title: 'Bass Fitness — 200 Ejercicios de Entrenamiento',
    author: 'Josquin des Pres (Trad. Fabricio Rottoli)',
    language: 'Español',
    fileUrl: '/assets/aistudio/bass-fitness_2aef09bc.pdf',
    focus: '200 ejercicios cromáticos y mecánicos de independencia de dedos 1-2-3-4, saltos de cuerda, cruce de trastes, resistencia y velocidad (60–180 BPM).',
    pagesOrTracks: '10 secciones · 200 ejercicios',
    genres: ['Técnica Pura', 'Rock', 'Metal', 'Jazz', 'Funk'],
  },
  {
    id: 'pdf-bass-grooves',
    title: 'Dictionary of Bass Grooves',
    author: 'Sean Malone',
    language: 'Inglés',
    fileUrl: '/assets/aistudio/bass-grooves_a2320702.pdf',
    focus: 'Enciclopedia estilística de 34 grooves esenciales con análisis armónico, técnica, timbre y bajistas de referencia en Rock, Metal, R&B, Jazz, Afro-Cubano, Caribeño, Country, Blues y Funk.',
    pagesOrTracks: '34 estilos y grooves de estudio',
    genres: ['Rock', 'Metal', 'Motown', 'Jazz', 'Salsa', 'Bossa Nova', 'Reggae', 'Country', 'Funk'],
  },
  {
    id: 'pdf-blues-bass',
    title: 'Blues Bass — A Guide to the Essential Styles and Techniques',
    author: 'Ed Friedland',
    language: 'Inglés',
    fileUrl: '/assets/aistudio/ed-friedland-blues-bass_cedf76b0.pdf',
    focus: 'Formas de 12, 8 y 16 compases, shuffle largo y corto, turnarounds, box patterns, boogie, slow blues 12/8, rhumba blues y estándares clásicos de Chicago, Texas y Memphis.',
    pagesOrTracks: '43 pistas de estudio',
    genres: ['Blues', 'Blues Rock', 'Shuffle', 'Rhumba Blues', 'Boogie'],
  },
  {
    id: 'pdf-reggae-bass',
    title: 'Reggae Bass (Bass Builders)',
    author: 'Ed Friedland',
    language: 'Inglés',
    fileUrl: '/assets/aistudio/bass-builders-ed-friedland-reggae-bass_5ef164a7.pdf',
    focus: 'Evolución completa del bajo jamaicano: Early Ska, Rock Steady, Reggae clásico, Roots Reggae (Family Man Barrett), Dub, Modern Ska (2-Tone) y Dancehall.',
    pagesOrTracks: '47 pistas cronológicas',
    genres: ['Ska', 'Rocksteady', 'Reggae', 'Roots Reggae', 'Dub', 'Dancehall'],
  },
  {
    id: 'pdf-rock-bass-basics',
    title: 'Rock Bass Basics',
    author: 'Tim Bogart & Albert Nigro',
    language: 'Inglés',
    fileUrl: '/assets/aistudio/bass-rock-bass-basics_f51d3efc.pdf',
    focus: 'Baladas rock, ostinatos en negras, corcheas con staccato y raking, semicorcheas estilo Rocco Prestia / Jeff Beck, shuffle rock, tapping (Billy Sheehan), armónicos y double-stops.',
    pagesOrTracks: '32 ejemplos prácticos',
    genres: ['Rock', 'Hard Rock', 'Blues Rock', 'Funk Rock', 'Ballad Rock'],
  },
];

export function getPdfById(id: string): PdfResource | undefined {
  return PDF_RESOURCES.find((p) => p.id === id);
}
