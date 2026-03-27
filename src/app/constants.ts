import { Especialidad, Medico, Persona, Agenda, Jornada } from './types';

export const ESPECIALIDADES: Especialidad[] = [
  { id: 133, nombre: 'NEFROLOGIA1' },
  { id: 23, nombre: 'NEONATOLOGIA' },
  { id: 25, nombre: 'NUTRICION' },
  { id: 29, nombre: 'PEDIATRIA' },
  { id: 32, nombre: 'PSICOREHABILITACION' },
  { id: 33, nombre: 'PSIQUIATRIA' }
];

export const MOCK_MEDICOS: Medico[] = [];

export const MOCK_PERSONAS: Persona[] = [
  { id: 'p1', nombre: 'Juan Pérez', cedula: '1700000001', fecha_nacimiento: '1990-05-20' },
  { id: 'p2', nombre: 'Admin User', cedula: 'admin', fecha_nacimiento: 'admin' }
];

export const MOCK_AGENDAS: Agenda[] = [];

export const MOCK_JORNADAS: Jornada[] = [];

export const SPECIALTY_EXAMS: Record<string, string[]> = {
  'NEONATOLOGIA': ['Hemograma completo', 'Perfil bioquímico', 'Prueba de Coombs', 'Ecografía cerebral', 'Radiografía de tórax'],
  'NUTRICION': ['Antropometría', 'Bioimpedancia', 'Perfil lipídico', 'Glucemia en ayunas', 'Albumina sérica'],
  'PEDIATRIA': ['Control de peso y talla', 'Esquema de vacunación', 'Prueba de desarrollo psicomotor', 'Examen físico completo'],
  'PSICOREHABILITACION': ['Evaluación neuropsicológica', 'Test de inteligencia', 'Escala de desarrollo', 'Pruebas de lenguaje'],
  'PSIQUIATRIA': ['Evaluación psicológica', 'Test de personalidad', 'Escala de depresión y ansiedad', 'Entrevista clínica'],
  'NEFROLOGIA1': ['Creatinina sérica', 'BUN', 'Electrolitos séricos', 'Examen general de orina', 'Ecografía renal']
};
