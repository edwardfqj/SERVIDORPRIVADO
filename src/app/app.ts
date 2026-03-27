import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard';
import { UserRole, User, Appointment, Slot } from './types';
import { ApiService } from './services/api';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, LoginComponent, AdminDashboardComponent, PatientDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('hospital-angular');
  
  // Expose UserRole enum to template
  UserRole = UserRole;
  
  role = signal<UserRole | null>(null);
  currentUser = signal<any>(null);
  slots = signal<Slot[]>([]);
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  especialidadPermitida = signal<number | null>(null); // Especialidad permitida para el paciente

  // Session timeout (15 minutes for patients)
  private sessionTimeoutId: any = null;
  private readonly SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(private apiService: ApiService) {
    // Load initial data
    this.loadInitialData();
  }

  ngOnInit(): void {
    // Only add event listeners in browser environment (not SSR)
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.resetSessionTimer.bind(this));
      window.addEventListener('keydown', this.resetSessionTimer.bind(this));
      window.addEventListener('click', this.resetSessionTimer.bind(this));
      window.addEventListener('scroll', this.resetSessionTimer.bind(this));
    }
  }

  ngOnDestroy(): void {
    // Only remove event listeners in browser environment (not SSR)
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.resetSessionTimer.bind(this));
      window.removeEventListener('keydown', this.resetSessionTimer.bind(this));
      window.removeEventListener('click', this.resetSessionTimer.bind(this));
      window.removeEventListener('scroll', this.resetSessionTimer.bind(this));
    }
    
    // Clear timeout
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }
  }

  private startSessionTimer(): void {
    // Only start timer for patients
    if (this.role() !== UserRole.PATIENT) return;
    
    this.clearSessionTimer();
    console.log('⏱️ Iniciando temporizador de sesión (15 minutos)');
    
    this.sessionTimeoutId = setTimeout(() => {
      console.log('⏰ Sesión expirada por inactividad');
      alert('Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.');
      this.handleLogout();
    }, this.SESSION_TIMEOUT_MS);
  }

  private resetSessionTimer(): void {
    // Only reset timer for patients
    if (this.role() !== UserRole.PATIENT) return;
    
    this.startSessionTimer();
  }

  private clearSessionTimer(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  loadInitialData(): void {
    // Load specialties and doctors on startup
    console.log(' Cargando datos iniciales...');
  }

  handleLogin(userData: User): void {
    this.currentUser.set(userData);
    this.role.set(userData.role);
    
    // Si es paciente, cargar citas, verificar especialidad permitida e iniciar temporizador
    if (userData.role === UserRole.PATIENT) {
      this.loadCitasFromDatabase(userData.id);
      this.verificarEspecialidadPermitida(userData.id);
      this.startSessionTimer();
    }
  }

  async loadCitasFromDatabase(pacienteId: string): Promise<void> {
    try {
      console.log('📋 Cargando citas desde la base de datos para paciente:', pacienteId);
      
      const citas = await new Promise<any[]>((resolve, reject) => {
        this.apiService.getCitasByPaciente(pacienteId).subscribe({
          next: (result) => resolve(result),
          error: (err) => reject(err)
        });
      });
      
      console.log('✅ Citas cargadas:', citas.length);
      
      // Convertir citas de BD al formato Appointment
      const appointments: Appointment[] = citas.map(cita => {
        // MySQL now returns dates as strings (dateStrings: true)
        // Format: "2026-04-09 13:00:00" (local time, no timezone conversion)
        let dateStr: string;
        let timeStr: string;
        
        if (typeof cita.cita_fecha === 'string') {
          // String format "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss.sssZ"
          const parts = cita.cita_fecha.includes('T') 
            ? cita.cita_fecha.split('T')
            : cita.cita_fecha.split(' ');
          dateStr = parts[0];
          timeStr = parts[1] ? parts[1].substring(0, 5) : '00:00';
        } else if (cita.cita_fecha instanceof Date) {
          // Fallback for Date objects
          const fecha = cita.cita_fecha;
          dateStr = fecha.getFullYear() + '-' + 
            String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
            String(fecha.getDate()).padStart(2, '0');
          timeStr = String(fecha.getHours()).padStart(2, '0') + ':' + 
            String(fecha.getMinutes()).padStart(2, '0');
        } else {
          dateStr = '1970-01-01';
          timeStr = '00:00';
        }
        
        return {
          id: cita.cita_id.toString(),
          patientId: cita.pers_id.toString(),
          medico_id: cita.medi_id.toString(),
          especialidad_id: cita.espe_id,
          date: dateStr,
          time: timeStr,
          codigo_qr: cita.codigo_qr,
          bookingDate: cita.cita_fech_crea
        };
      });
      
      this.appointments.set(appointments);
      console.log('✅ Appointments establecidos:', appointments);
      
    } catch (error) {
      console.error('❌ Error cargando citas:', error);
      this.appointments.set([]);
    }
  }

  async verificarEspecialidadPermitida(pacienteId: string): Promise<void> {
    try {
      console.log('🔍 Verificando especialidad permitida para paciente:', pacienteId);
      
      const response = await new Promise<any>((resolve, reject) => {
        this.apiService.getUltimaCitaSubsecuente(pacienteId).subscribe({
          next: (result) => resolve(result),
          error: (err) => reject(err)
        });
      });
      
      console.log('📋 Respuesta última cita:', response);
      
      if (response.tieneCitaSubsecuente) {
        this.especialidadPermitida.set(response.especialidad_id);
        console.log('✅ Especialidad permitida:', response.especialidad_nombre);
      } else {
        this.especialidadPermitida.set(null);
        console.log('ℹ️ Paciente no es subsecuente: bloqueo de agendamiento');
      }
      
    } catch (error) {
      console.error('❌ Error al verificar especialidad permitida:', error);
      this.especialidadPermitida.set(null);
    }
  }

  handleLogout(): void {
    this.clearSessionTimer();
    this.role.set(null);
    this.currentUser.set(null);
    this.slots.set([]);
    this.especialidadPermitida.set(null);
  }

  async fetchSlotsForDoctor(medico_id: string): Promise<void> {
    console.log('🔄 fetchSlotsForDoctor llamado con medico_id:', medico_id);
    this.loading.set(true);
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 30);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 60);

      console.log('📅 Buscando slots desde', startDate.toISOString().split('T')[0], 'hasta', endDate.toISOString().split('T')[0]);
      console.log('📅 Fecha actual:', today.toISOString().split('T')[0]);

      this.apiService.getDoctorSlots(
        medico_id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ).subscribe({
        next: (slots) => {
          console.log('📊 Slots recibidos:', slots.length, 'slots');
          if (slots.length > 0) {
            console.log('📋 Rango de fechas de slots:');
            console.log('  - Primera fecha:', slots[0].date);
            console.log('  - Última fecha:', slots[slots.length - 1].date);
            console.log('📋 Primer slot:', slots[0]);
            
            console.log('⚡ Forzando actualización de slots...');
            this.slots.set([...slots]);
          } else {
            console.log('❌ No se recibieron slots');
            this.slots.set([]);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error fetching slots:', error);
          this.slots.set([]);
          this.loading.set(false);
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching slots:', error);
      this.slots.set([]);
      this.loading.set(false);
    }
  }

  addSlot(slot: any): void {
    const newSlot: Slot = {
      ...slot,
      id: Math.random().toString(36).substr(2, 9),
      isBooked: false
    };
    this.slots.set([...this.slots(), newSlot]);
  }

  deleteSlot(id: string): void {
    this.slots.set(this.slots().filter(s => s.id !== id));
  }

  parseTimeMinutes(timeStr: string): number {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  }

  async bookAppointment(slotId: string, medico_id: string, especialidad_id: number): Promise<{ success: boolean; message?: string }> {
    const currentUserId = this.currentUser()?.id;
    
    if (!currentUserId) {
      return { success: false, message: 'Usuario no autenticado' };
    }
    
    const alreadyHasOne = this.appointments().some(app => 
      app.patientId === currentUserId && 
      app.especialidad_id === especialidad_id
    );
    
    if (alreadyHasOne) {
      return { success: false, message: 'Lo sentimos, ya tienes una cita programada en esta especialidad.' };
    }

    const slot = this.slots().find(s => s.id === slotId);
    if (!slot) return { success: false, message: 'Horario no encontrado.' };

    const slotMinutes = this.parseTimeMinutes(slot.time);
    const hasTimeConflict = this.appointments().some(app => {
      if (app.patientId !== currentUserId) return false;
      if (app.date !== slot.date) return false;

      const appMinutes = this.parseTimeMinutes(app.time);
      const diff = Math.abs(slotMinutes - appMinutes);
      return diff < 120;
    });

    if (hasTimeConflict) {
      return { 
        success: false, 
        message: 'No se puede agendar la cita.\n\nDebe existir un intervalo de al menos 2 horas antes o después de su cita existente para evitar conflictos de horario.' 
      };
    }

    // Llamar al backend para registrar la cita
    try {
      const citaData = {
        medico_id: medico_id,
        especialidad_id: especialidad_id,
        fecha: slot.date,
        time: slot.time,
        paciente_id: currentUserId,
        duracion: slot.duration || 20
      };
      
      console.log('📤 Enviando datos de cita al backend:', citaData);
      
      const response = await new Promise<any>((resolve, reject) => {
        this.apiService.createCita(citaData).subscribe({
          next: (result) => resolve(result),
          error: (err) => reject(err)
        });
      });
      
      console.log('✅ Cita registrada en backend:', response);
      
      // Agregar la cita a la lista local
      if (response.success && response.cita) {
        const newAppointment: Appointment = {
          id: response.cita.id,
          patientId: currentUserId,
          medico_id: medico_id,
          especialidad_id: especialidad_id,
          date: slot.date,
          time: slot.time,
          bookingDate: new Date().toISOString(),
          codigo_qr: response.codigo_qr,
          qr_image: response.qr_image
        };
        
        this.appointments.set([...this.appointments(), newAppointment]);
        this.slots.set(this.slots().map(s => s.id === slotId ? { ...s, isBooked: true } : s));
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Error al registrar la cita' };
      }
      
    } catch (error) {
      console.error('❌ Error al crear cita:', error);
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const appointment = this.appointments().find(app => app.id === appointmentId);
    if (!appointment) return;

    try {
      console.log('🗑️ Eliminando cita del backend con ID:', appointmentId);
      
      // Llamar al backend para eliminar la cita
      const result = await new Promise<any>((resolve, reject) => {
        this.apiService.cancelCita(appointmentId).subscribe({
          next: (result) => resolve(result),
          error: (err) => reject(err)
        });
      });
      
      console.log('✅ Cita eliminada del backend');
      
      // Show warning if patient was disabled
      if (result.patientDisabled) {
        alert('⚠️ ' + result.warning);
        // Logout the user since they are disabled
        this.handleLogout();
        return;
      }
      
      // Actualizar listas locales
      this.appointments.set(this.appointments().filter(app => app.id !== appointmentId));
      this.slots.set(this.slots().map(s => 
        (s.date === appointment.date && s.time === appointment.time && s.doctorId === appointment.medico_id) 
          ? { ...s, isBooked: false } 
          : s
      ));
      
    } catch (error) {
      console.error('❌ Error al eliminar cita:', error);
      alert('Error al eliminar la cita del servidor');
    }
  }

  onDoctorSelect(medico_id: string): void {
    console.log('🔄 onDoctorSelect llamado con medico_id:', medico_id);
    console.log('📊 Slots actuales:', this.slots().length);
    this.fetchSlotsForDoctor(medico_id);
  }

  async handlePatientBooking(bookingData: {slotId: string; medico_id: string; especialidad_id: number}): Promise<void> {
    const result = await this.bookAppointment(bookingData.slotId, bookingData.medico_id, bookingData.especialidad_id);
    
    if (!result.success) {
      alert(result.message || 'Error al reservar la cita');
    }
  }
}
