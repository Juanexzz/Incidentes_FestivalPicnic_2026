export const SEVERIDADES = ['LEVE', 'MODERADA', 'GRAVE'] as const;
export type Severidad = (typeof SEVERIDADES)[number];

export const ESTADOS = ['ABIERTO', 'EN_ATENCION', 'CERRADO'] as const;
export type Estado = (typeof ESTADOS)[number];

export const STATES = ['ACTIVE', 'REMOVED'] as const;
export type State = (typeof STATES)[number];
