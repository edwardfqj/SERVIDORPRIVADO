export enum UserRole {
  PATIENT = 'PACIENTE',
  ADMIN = 'ADMINISTRADOR'
}

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Medico {
  id: string;
  nombre: string;
  especialidad_id: number;
  image?: string;
  consultorio?: string;
}

export interface Persona {
  id: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
}

export interface Agenda {
  id: string;
  medico_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_cita: number;
}

export interface Jornada {
  id: string;
  agenda_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  medico_id: string;
  especialidad_id: number;
  date: string;
  time: string;
  bookingDate?: string;
  codigo_qr?: string;
  qr_image?: string;
}

export interface User {
  id: string;
  ci?: string;
  nombre: string;
  role: UserRole;
  habilitado?: number; // 1 = habilitado, 0 = deshabilitado
  terminos_aceptados?: number; // 0 = no aceptado, 1 = aceptado
}

export interface Slot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  isBooked: boolean;
  duration?: number;
  endTime?: string;
}
