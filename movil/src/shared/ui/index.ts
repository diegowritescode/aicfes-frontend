/**
 * The design system's public surface.
 *
 * Screens import from here, not from the folders: `atomos` versus
 * `moleculas` is how the system is built, not something a screen
 * should have to know. Moving a component between the two then costs
 * one line here instead of a sweep.
 */
export { Boton } from './atomos/Boton';
export { Texto } from './atomos/Texto';
export { Chip } from './atomos/Chip';
export { Avatar } from './atomos/Avatar';
export { Insignia, type EstadoInsignia } from './atomos/Insignia';
export { Opcion, type EstadoOpcion } from './moleculas/Opcion';
export { Explicacion } from './moleculas/Explicacion';
export { Progreso } from './moleculas/Progreso';
export { Tarjeta } from './moleculas/Tarjeta';
export { FilaEnlace, GrupoDeFilas, type IconoDeFila, type TonoDeFila } from './moleculas/FilaEnlace';
export { Atajo, type IconoDeAtajo, type TonoDeAtajo } from './moleculas/Atajo';
export { CabeceraDePerfil, TiraDeCifras } from './moleculas/CabeceraDePerfil';
export { Cifra } from './moleculas/Cifra';
export { Contexto } from './moleculas/Contexto';
export { Encabezado } from './moleculas/Encabezado';
export { FilaMateria } from './moleculas/FilaMateria';
export { BarraRespuesta } from './moleculas/BarraRespuesta';
export { Personaje } from './organismos/Personaje/Personaje';
export { PESTANAS, PestanaBoton, type Pestana, type RutaPestana } from './organismos/BarraPestanas';
export { POSES, type Pose } from './organismos/Personaje/poses';
export { sombra } from './sombras';
export { color, espacio, radio, control, tipo, duracion } from './tokens';
