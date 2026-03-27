import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DataService } from './data';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface CitaData {
  medi_id: string;
  pers_id: string;
  espe_id: number;
  cita_fecha: string;
  cita_tiempo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private dataService: DataService) {}

  // Especialidades
  getEspecialidades(): Observable<any[]> {
    return of(this.dataService.getEspecialidades());
  }

  // Médicos
  getMedicos(especialidadId?: string): Observable<any[]> {
    if (especialidadId) {
      return of(this.dataService.getMedicosByEspecialidad(parseInt(especialidadId, 10)));
    }
    return of(this.dataService.getAllMedicos());
  }

  // Agenda
  getAgenda(medicoId: string): Observable<any[]> {
    return of(this.dataService.getAgendasByMedico(medicoId));
  }

  // Jornadas
  getJornadas(agendaId: string): Observable<any[]> {
    return of(this.dataService.getJornadasByAgenda(parseInt(agendaId, 10)));
  }

  // Persona
  getPersonaByCI(ci: string): Observable<any> {
    const persona = this.dataService.personas.find(p => p.pers_ci === ci);
    if (!persona) {
      return throwError(() => null);
    }
    return of(persona);
  }

  // Citas
  createCita(citaData: any): Observable<any> {
    const result = this.dataService.createCita(citaData);
    if (!result.success) {
      return throwError(() => new Error(result.error || 'Error al crear cita'));
    }
    return of(result.data);
  }

  getCitasByPersona(persId: string): Observable<any[]> {
    return of(this.dataService.getCitasByPaciente(persId));
  }

  cancelCita(citaId: string): Observable<any> {
    const result = this.dataService.cancelCitaPaciente(citaId);
    if (!result.success) {
      return throwError(() => new Error(result.error || 'Error al cancelar cita'));
    }
    return of(result);
  }

  // Check if patient has completed citas (for warning before cancel)
  hasCompletedCitas(persId: string): Observable<{hasCompletedCitas: boolean, count: number}> {
    return of(this.dataService.hasCompletedCitas(persId));
  }

  // Get all patients with habilitado status (admin)
  getPacientes(search?: string): Observable<any[]> {
    return of(this.dataService.getPacientes(search));
  }

  // Update patient habilitado status (admin)
  updatePacienteHabilitado(persId: string, habilitado: number): Observable<any> {
    return of(this.dataService.updatePacienteHabilitado(persId, habilitado));
  }

  // Get doctor schedules
  getDoctorSchedules(medicoId: string): Observable<any[]> {
    return of(this.dataService.getAgendasByMedico(medicoId));
  }

  // Generate available slots for a doctor
  getDoctorSlots(medicoId: string, startDate?: string, endDate?: string): Observable<any[]> {
    return of(this.dataService.getDoctorSlots(medicoId, startDate, endDate));
  }

  // Health check
  healthCheck(): Observable<any> {
    return of({ status: 'OK', timestamp: new Date().toISOString() });
  }

  // Get patient's last subsecuente appointment
  getUltimaCitaSubsecuente(persId: string): Observable<any> {
    return of(this.dataService.getUltimaCitaSubsecuente(persId));
  }

  // ============ ADMIN ENDPOINTS ============

  // Search doctors with optional search parameter
  getAdminMedicos(search?: string): Observable<any[]> {
    return of(this.dataService.getAdminMedicos(search));
  }

  // Create new agenda
  createAgenda(medi_id: string, fecha_inicio: string, fecha_fin: string, duracion_cita: number): Observable<any> {
    return of(this.dataService.createAgenda(medi_id, fecha_inicio, fecha_fin, duracion_cita));
  }

  // Get agendas by doctor
  getAgendasByMedico(medi_id: string): Observable<any[]> {
    return of(this.dataService.getAgendasByMedico(medi_id));
  }

  // Delete agenda
  deleteAgenda(agen_id: number): Observable<any> {
    return of(this.dataService.deleteAgenda(agen_id));
  }

  // Delete jornada
  deleteJornada(jorn_id: number): Observable<any> {
    return of(this.dataService.deleteJornada(jorn_id));
  }

  // Create new jornada
  createJornada(agen_id: number, dia_id: number, hora_inicio: string, hora_fin: string, espe_id?: number, cons_id?: number): Observable<any> {
    return of(this.dataService.createJornada(agen_id, dia_id, hora_inicio, hora_fin, espe_id, cons_id));
  }

  // Get jornadas by agenda
  getJornadasByAgenda(agen_id: number): Observable<any[]> {
    return of(this.dataService.getJornadasByAgenda(agen_id));
  }

  // Enable doctor schedules with percentage (simplified)
  habilitarHorarios(medi_id: string, porcentaje: number): Observable<any> {
    return of(this.dataService.habilitarHorarios(medi_id, porcentaje));
  }

  // Admin cancel cita (change status to 5 - Cancelada)
  adminCancelCita(cita_id: string, motivo?: string): Observable<any> {
    return of(this.dataService.adminCancelCita(cita_id));
  }

  // Get patient notifications (cancelled citas)
  getPacienteNotificaciones(pers_id: string): Observable<any> {
    return of(this.dataService.getPacienteNotificaciones(pers_id));
  }

  // Mark notifications as read
  markNotificationsAsRead(pers_id: string): Observable<any> {
    this.dataService.markNotificationsAsRead(pers_id);
    return of({ success: true, message: 'Notificaciones marcadas como leídas' });
  }

  // Get citas by paciente
  getCitasByPaciente(pers_id: string): Observable<any[]> {
    return of(this.dataService.getCitasByPaciente(pers_id));
  }

  // Get citas by medico for admin
  getCitasByMedico(medi_id: string): Observable<any[]> {
    return of(this.dataService.getCitasByMedico(medi_id));
  }

  // Aceptar términos y condiciones
  aceptarTerminos(pers_id: number): Observable<any> {
    this.dataService.aceptarTerminos(pers_id);
    return of({ success: true, message: 'Términos aceptados correctamente' });
  }
}
