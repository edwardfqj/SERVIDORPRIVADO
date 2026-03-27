import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Especialidad, Medico, Slot, Appointment } from '../../types';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ESPECIALIDADES, MOCK_MEDICOS } from '../../constants';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-dashboard.html',
  styleUrls: ['./patient-dashboard.css']
})
export class PatientDashboardComponent implements OnInit, OnChanges {
  @Input() slots: Slot[] = [];
  @Input() appointments: Appointment[] = [];
  @Input() loading: boolean = false;
  @Input() currentUser: any = { nombre: 'Usuario Demo' };
  @Input() especialidadPermitida: number | null = null; // Especialidad permitida para el paciente
  @Output() book = new EventEmitter<{slotId: string; medico_id: string; especialidad_id: number}>();
  @Output() cancel = new EventEmitter<string>();
  
  @Output() doctorSelect = new EventEmitter<string>();

  // State variables
  activeTab: 'view' | 'book' = 'view';
  selectedEspecialidadId: number | null = null;
  selectedMedicoId: string = '';
  selectedDate: Date | null = null;
  selectedSlot: Slot | null = null;
  showConfirmation: boolean = false;
  errorModal: { show: boolean; message: string } = { show: false, message: '' };
  cancelModal: { show: boolean; appointment: Appointment | null } = { show: false, appointment: null };
  currentMonth: Date = new Date();
  specialtySearch: string = '';
  doctorSearch: string = ''; // Search for doctors
  showDoctorDropdown: boolean = false; // Show/hide doctor dropdown
  
  // Notifications
  notificaciones = signal<any[]>([]);
  showNotificaciones: boolean = false;
  
  // Términos y condiciones
  showTerminosModal: boolean = false;
  
  especialidades = signal<Especialidad[]>([]);
  medicos = signal<Medico[]>([]);
  fetchingData = signal(false);

  // Remove constants - everything comes from API

  constructor(private apiService: ApiService) {
    // Set initial month to 30 days in the future (minimum booking date)
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.currentMonth = d;
  }

  ngOnInit(): void {
    this.loadEspecialidades();
    // Notificaciones se cargan en ngOnChanges cuando currentUser está disponible
    
    // Mantener médicos cargados cuando hay citas
    if (this.appointments.length > 0 && this.medicos().length === 0) {
      console.log('🔄 Recargando médicos porque hay citas pero no hay médicos en estado');
      const uniqueEspecialidadIds = [...new Set(this.appointments.map(app => app.especialidad_id))];
      if (uniqueEspecialidadIds.length > 0) {
        const firstEspecialidadId = uniqueEspecialidadIds[0];
        this.loadMedicos(firstEspecialidadId.toString());
      }
    }
  }

  ngOnChanges(changes: any): void {
    // Detectar cuando especialidadPermitida cambia
    if (changes.especialidadPermitida && changes.especialidadPermitida.currentValue !== undefined) {
      console.log('🔄 ngOnChanges: especialidadPermitida cambió a:', changes.especialidadPermitida.currentValue);
      this.loadEspecialidades();
    }
    
    // Cargar médicos cuando hay citas disponibles
    if (this.appointments.length > 0 && this.medicos().length === 0) {
      console.log('🔄 ngOnChanges: Cargando médicos porque hay citas');
      const uniqueEspecialidadIds = [...new Set(this.appointments.map(app => app.especialidad_id))];
      if (uniqueEspecialidadIds.length > 0) {
        const firstEspecialidadId = uniqueEspecialidadIds[0];
        this.loadMedicos(firstEspecialidadId.toString());
      }
    }
    
    // Recargar notificaciones cuando currentUser cambia
    if (changes.currentUser && changes.currentUser.currentValue) {
      console.log('🔄 ngOnChanges: currentUser cambió, recargando notificaciones');
      this.loadNotificaciones();
      
      // Verificar si debe mostrar términos y condiciones
      const user = changes.currentUser.currentValue;
      console.log('📋 Verificando términos - usuario:', user);
      console.log('📋 terminos_aceptados:', user.terminos_aceptados, 'tipo:', typeof user.terminos_aceptados);
      
      if (user && (user.terminos_aceptados === 0 || user.terminos_aceptados === undefined)) {
        console.log('📋 Usuario no ha aceptado términos, mostrando modal');
        this.showTerminosModal = true;
      } else {
        console.log('📋 Usuario ya aceptó términos, no mostrar modal');
      }
    }
  }

  async loadEspecialidades(): Promise<void> {
    console.log('🔄 loadEspecialidades iniciado');
    console.log('📋 Especialidad permitida:', this.especialidadPermitida);
    
    try {
      this.fetchingData.set(true);
      const data = await this.apiService.getEspecialidades().toPromise();
      console.log('📊 Datos recibidos de API:', data);
      
      if (data) {
        // Filtrar especialidades si hay una especialidad permitida
        if (this.especialidadPermitida !== null) {
          const especialidadesFiltradas = data.filter((esp: Especialidad) => esp.id === this.especialidadPermitida);
          this.especialidades.set(especialidadesFiltradas);
          console.log('🔒 Especialidades filtradas por permiso:', this.especialidades());
          
          // Auto-seleccionar la especialidad permitida
          if (especialidadesFiltradas.length > 0) {
            this.selectedEspecialidadId = this.especialidadPermitida;
            this.loadMedicos(this.especialidadPermitida.toString());
          }
        } else {
          this.especialidades.set(data);
          console.log('🏥 Especialidades cargadas desde API:', this.especialidades());
        }
      } else {
        console.log('⚠️ API devolvió datos vacíos');
        this.especialidades.set([]);
      }
    } catch (error) {
      console.error('Error cargando especialidades:', error);
      this.especialidades.set([]);
    } finally {
      this.fetchingData.set(false);
    }
  }

  async loadMedicos(especialidadId: string): Promise<void> {
    console.log('🔄 loadMedicos llamado con especialidadId:', especialidadId);
    
    try {
      this.fetchingData.set(true);
      console.log('📡 Llamando a API getMedicos...');
      
      this.apiService.getMedicos(especialidadId).subscribe({
        next: (data) => {
          console.log('✅ Médicos recibidos:', data);
          if (data && Array.isArray(data)) {
            this.medicos.set(data);
            console.log('📋 Médicos establecidos:', this.medicos());
          } else {
            console.log('⚠️ Datos no válidos, estableciendo array vacío');
            this.medicos.set([]);
          }
          this.fetchingData.set(false);
        },
        error: (error) => {
          console.error('❌ Error en loadMedicos:', error);
          this.medicos.set([]);
          this.fetchingData.set(false);
        }
      });
      
    } catch (error) {
      console.error('❌ Error en try-catch loadMedicos:', error);
      this.medicos.set([]);
      this.fetchingData.set(false);
    }
  }

  async loadNotificaciones(): Promise<void> {
    if (!this.currentUser?.id) return;
    
    try {
      const data = await this.apiService.getPacienteNotificaciones(this.currentUser.id).toPromise();
      if (data && data.notificaciones) {
        this.notificaciones.set(data.notificaciones);
        console.log('🔔 Notificaciones cargadas:', data.notificaciones.length);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      this.notificaciones.set([]);
    }
  }

  async toggleNotificaciones(): Promise<void> {
    this.showNotificaciones = !this.showNotificaciones;
  }

  async eliminarNotificacion(citaId: string): Promise<void> {
    try {
      await this.apiService.markNotificationsAsRead(this.currentUser.id).toPromise();
      console.log('✅ Notificación eliminada');
      // Recargar notificaciones
      this.loadNotificaciones();
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  }

  cerrarNotificaciones(): void {
    this.showNotificaciones = false;
  }

  async loadDoctorSlots(medicoId: string): Promise<void> {
    console.log('🔄 loadDoctorSlots llamado con medicoId:', medicoId);
    
    try {
      // Get date range for current month
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('📅 Cargando slots para rango:', startDateStr, 'a', endDateStr);
      
      const data = await this.apiService.getDoctorSlots(medicoId, startDateStr, endDateStr).toPromise();
      console.log('✅ Slots recibidos:', data);
      
      if (data && Array.isArray(data)) {
        // Update slots with data from API
        this.slots = data;
        console.log('📅 Slots actualizados:', this.slots.length, 'slots para el mes');
      } else {
        console.log('⚠️ No hay slots disponibles para este rango');
        this.slots = [];
      }
    } catch (error) {
      console.error('❌ Error cargando slots:', error);
      this.slots = [];
    }
  }

  onEspecialidadChange(): void {
    console.log('🔄 onEspecialidadChange llamado:', {
      selectedEspecialidadId: this.selectedEspecialidadId,
      especialidadNombre: this.especialidades().find((e: any) => e.id === this.selectedEspecialidadId)?.nombre
    });
    
    if (this.selectedEspecialidadId) {
      console.log('🔄 Especialidad seleccionada:', this.selectedEspecialidadId);
      // Resetear otros campos cuando cambia la especialidad
      this.selectedMedicoId = '';
      this.selectedDate = null;
      this.selectedSlot = null;
      this.showConfirmation = false;
      this.loadMedicos(this.selectedEspecialidadId.toString());
    } else {
      this.medicos.set([]);
    }
  }

  onMedicoChange(): void {
    if (this.selectedMedicoId) {
      this.doctorSelect.emit(this.selectedMedicoId);
      console.log('🔄 Llamando doctorSelect con:', this.selectedMedicoId);
      
      // Load doctor slots when a doctor is selected
      this.loadDoctorSlots(this.selectedMedicoId);
    }
  }

  closeDoctorDropdown(): void {
    // Delay to allow click event on dropdown items to fire
    setTimeout(() => {
      this.showDoctorDropdown = false;
    }, 200);
  }

  get filteredEspecialidades(): Especialidad[] {
    const filtered = this.especialidades().filter((e: any) => 
      e.nombre.toLowerCase().includes(this.specialtySearch.toLowerCase())
    );
    console.log('🔍 filteredEspecialidades llamado:', {
      search: this.specialtySearch,
      total: this.especialidades().length,
      filtered: filtered.length,
      especialidades: this.especialidades(),
      result: filtered
    });
    return filtered;
  }

  get doctorSlots(): Slot[] {
    return this.slots.filter(s => {
      const slotDoctorId = String(s.doctorId);
      const selectedDoctorId = String(this.selectedMedicoId);
      const areEqual = slotDoctorId === selectedDoctorId;
      
      return areEqual && !s.isBooked;
    });
  }

  get filteredDoctors(): Medico[] {
    const doctors = this.medicos();
    if (!this.doctorSearch || this.doctorSearch.trim() === '') {
      return doctors;
    }
    const search = this.doctorSearch.toLowerCase().trim();
    return doctors.filter(d => d.nombre.toLowerCase().includes(search));
  }

  get availableTimeSlots(): Slot[] {
    // Filter by selected date only for time slots display
    if (!this.selectedDate) return this.doctorSlots;
    
    const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
    return this.doctorSlots.filter(s => s.date === selectedDateStr);
  }

  get availableDays(): Date[] {
    const availableDates = new Set<string>();
    this.doctorSlots.forEach(slot => {
      if (slot.date) {
        availableDates.add(slot.date);
      }
    });
    
    return Array.from(availableDates).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }).sort((a, b) => a.getTime() - b.getTime());
  }

  get hasAppointmentInSpecialty(): boolean {
    if (!this.selectedEspecialidadId) return false;
    return this.appointments.some(app => app.especialidad_id === this.selectedEspecialidadId);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  formatDate(date: Date, format: string): string {
    // Simple date formatting - you might want to use a proper date library
    if (format === 'MMMM yyyy') {
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    return date.getDate().toString();
  }

  handleBooking(): void {
    if (!this.selectedEspecialidadId || !this.selectedSlot) return;
    
    console.log('🔔 handleBooking llamado:');
    console.log('  - selectedSlot:', this.selectedSlot);
    console.log('  - selectedSlot.id:', this.selectedSlot.id);
    console.log('  - selectedSlot.doctorId:', this.selectedSlot.doctorId);
    console.log('  - selectedEspecialidadId:', this.selectedEspecialidadId);
    console.log('  - selectedMedicoId:', this.selectedMedicoId);
    
    // Validate 2-hour difference between appointments
    const validationResult = this.validateAppointmentTime();
    
    if (!validationResult.valid) {
      // Show error modal instead of alert
      this.errorModal = {
        show: true,
        message: validationResult.message
      };
      return;
    }
    
    // Proceed with booking
    this.showConfirmation = true;
  }

  validateAppointmentTime(): { valid: boolean; message: string } {
    if (!this.selectedSlot || !this.appointments.length) {
      return { valid: true, message: '' };
    }
    
    // Get the selected appointment date and time
    const selectedDateTime = new Date(`${this.selectedSlot.date}T${this.selectedSlot.time}`);
    
    // Check all existing appointments
    for (const appointment of this.appointments) {
      const existingDateTime = new Date(`${appointment.date}T${appointment.time}`);
      
      // Calculate the difference in hours
      const timeDifference = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime()) / (1000 * 60 * 60);
      
      // If difference is less than 2 hours, show error
      if (timeDifference < 2) {
        const existingSpecialty = this.especialidades().find(e => e.id === appointment.especialidad_id)?.nombre || 'Especialidad';
        const selectedSpecialty = this.especialidades().find(e => e.id === this.selectedEspecialidadId)?.nombre || 'Especialidad';
        
        return {
          valid: false,
          message: `No puedes agendar una cita en ${selectedSpecialty} porque tienes una cita en ${existingSpecialty} programada para ${appointment.date} a las ${appointment.time}. Debe haber una diferencia de al menos 2 horas entre citas.`
        };
      }
    }
    
    return { valid: true, message: '' };
  }

  confirmBooking(): void {
    console.log('🎯 confirmBooking llamado:', {
      selectedSlot: this.selectedSlot,
      selectedMedicoId: this.selectedMedicoId,
      selectedEspecialidadId: this.selectedEspecialidadId
    });
    
    if (this.selectedSlot && this.selectedMedicoId && this.selectedEspecialidadId) {
      this.book.emit({
        slotId: this.selectedSlot.id,
        medico_id: this.selectedMedicoId,
        especialidad_id: this.selectedEspecialidadId
      });
      
      // Resetear campos
      this.selectedEspecialidadId = null;
      this.selectedMedicoId = '';
      this.selectedDate = null;
      this.selectedSlot = null;
      this.showConfirmation = false;
      
      console.log('✅ Cita confirmada y campos reseteados');
    }
  }

  onDateSelect(day: Date): void {
    this.selectedDate = day;
    this.selectedSlot = null;
  }

  onSlotSelect(slot: Slot): void {
    this.selectedSlot = slot;
    this.showConfirmation = false;
  }

  onCancelAppointment(appointmentId: string): void {
    this.cancel.emit(appointmentId);
  }

  previousMonth(): void {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    this.currentMonth = newMonth;
    
    // Reload slots for the new month if a doctor is selected
    if (this.selectedMedicoId) {
      this.loadDoctorSlots(this.selectedMedicoId);
    }
  }

  nextMonth(): void {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    this.currentMonth = newMonth;
    
    // Reload slots for the new month if a doctor is selected
    if (this.selectedMedicoId) {
      this.loadDoctorSlots(this.selectedMedicoId);
    }
  }

  getCalendarDays(): Date[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }

  getCalendarRows(): Date[][] {
    const days = this.getCalendarDays();
    const rows: Date[][] = [];
    
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    
    return rows;
  }

  isDayAvailable(day: Date): boolean {
    return this.availableDays.some(availableDay => this.isSameDay(day, availableDay));
  }

  isDaySelected(day: Date): boolean {
    return this.selectedDate ? this.isSameDay(day, this.selectedDate) : false;
  }

  isDayCurrentMonth(day: Date): boolean {
    return this.isSameMonth(day, this.currentMonth);
  }

  handleCancelClick(app: Appointment): void {
    // Show confirmation modal with warning
    this.cancelModal = {
      show: true,
      appointment: app
    };
  }

  confirmCancelAppointment(): void {
    if (this.cancelModal.appointment) {
      const appointmentDate = new Date(this.cancelModal.appointment.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysDifference = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference < 5) {
        this.errorModal = {
          show: true,
          message: `No se puede cancelar la cita. Las citas solo se pueden cancelar con al menos 5 días de anticipación. Tu cita es en ${daysDifference < 0 ? 'hace' : ''} ${Math.abs(daysDifference)} días.`
        };
        this.cancelModal.show = false;
      } else {
        this.onCancelAppointment(this.cancelModal.appointment.id);
        this.cancelModal.show = false;
        this.cancelModal.appointment = null;
      }
    }
  }

  async aceptarTerminos(): Promise<void> {
    if (this.currentUser?.id) {
      try {
        console.log('📋 Aceptando términos para usuario ID:', this.currentUser.id);
        await this.apiService.aceptarTerminos(Number(this.currentUser.id)).toPromise();
        
        // Actualizar el currentUser localmente
        this.currentUser.terminos_aceptados = 1;
        
        this.showTerminosModal = false;
        console.log('✅ Términos aceptados correctamente');
      } catch (error) {
        console.error('❌ Error al aceptar términos:', error);
      }
    }
  }

  generatePDF(appointment: Appointment): void {
    try {
      const uniqueCode = appointment.codigo_qr || '0000000000';

      const loadImage = (url: string): Promise<string> =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
          };
          img.onerror = () => resolve('');
          img.src = url;
        });

      const qrPromise = appointment.qr_image
        ? Promise.resolve(appointment.qr_image)
        : QRCode.toDataURL(uniqueCode, {
            width: 120,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });

      Promise.all([
        loadImage('/Encabezadopdf.jpeg'),
        loadImage('/piedepaginapdf.jpeg'),
        qrPromise
      ]).then(([headerImg, footerImg, qrDataUrl]) => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.width;
        const pageH = doc.internal.pageSize.height;
        const marginX = 15;

        // --- Encabezado ---
        const headerH = 40;
        if (headerImg) {
          doc.addImage(headerImg, 'JPEG', 0, 0, pageW, headerH);
        }

        // --- Pie de página ---
        const footerH = 32;
        const footerY = pageH - footerH;
        if (footerImg) {
          doc.addImage(footerImg, 'JPEG', 0, footerY, pageW, footerH);
        }

        // --- Código QR (encima del pie de página, esquina derecha) ---
        const qrSize = 30;
        const qrX = pageW - marginX - qrSize;
        const qrY = footerY - qrSize - 6;
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // --- Contenido ---
        const medico = this.medicos().find(d => String(d.id) === String(appointment.medico_id));
        const especialidad = this.especialidades().find(e => e.id === appointment.especialidad_id);

        let y = headerH + 10;
        const lineH = 8;
        const labelX = marginX;
        const valueX = marginX + 58;

        // Título
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 56, 101);
        doc.text('COMPROBANTE DE CITA MÉDICA', pageW / 2, y, { align: 'center' });
        y += lineH + 1;

        doc.setLineWidth(0.4);
        doc.setDrawColor(0, 56, 101);
        doc.line(marginX, y, pageW - marginX, y);
        y += 7;

        // Datos de la cita
        const citaDate = new Date(appointment.date + 'T00:00:00');
        const citaDateStr = citaDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

        let bookingDateStr = 'N/A';
        if (appointment.bookingDate) {
          try {
            const iso = appointment.bookingDate.includes(' ')
              ? appointment.bookingDate.replace(' ', 'T')
              : appointment.bookingDate.includes('T') ? appointment.bookingDate : appointment.bookingDate + 'T00:00:00';
            const d = new Date(iso);
            bookingDateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
          } catch { bookingDateStr = 'N/A'; }
        }

        const rows: [string, string][] = [
          ['Paciente:', this.currentUser?.nombre || 'N/A'],
          ['Cédula:', this.currentUser?.ci || 'N/A'],
          ['Especialidad:', especialidad?.nombre || 'N/A'],
          ['Médico:', medico?.nombre || 'N/A'],
          ['Fecha de la Cita:', citaDateStr],
          ['Hora de la Cita:', appointment.time],
          ['Fecha de Emisión:', new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })],
        ];

        doc.setFontSize(10);
        for (const [label, value] of rows) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text(label, labelX, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(value, valueX, y);
          y += lineH;
        }

        y += 4;
        doc.setLineWidth(0.3);
        doc.setDrawColor(210, 210, 210);
        doc.line(marginX, y, pageW - marginX, y);
        y += 7;

        // Instrucciones
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 56, 101);
        doc.text('Instrucciones:', labelX, y);
        y += lineH;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('\u2022 Ingresar 30 minutos antes a enfermería para tomarse los signos vitales.', labelX + 3, y);
        y += lineH - 1;
        doc.text('\u2022 Después se le asignará el consultorio correspondiente.', labelX + 3, y);
        y += lineH + 4;

        // Recordatorio
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 56, 101);
        doc.text('Recordatorio Importante:', labelX, y);
        y += lineH;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('\u2022 Realizarse los exámenes previos antes de la cita.', labelX + 3, y);
        y += lineH - 1;
        doc.text('\u2022 Traiga los resultados impresos el día de su cita.', labelX + 3, y);

        const fileName = `cita_${appointment.date}_${appointment.time.replace(':', '')}.pdf`;
        doc.save(fileName);
      }).catch(err => {
        console.error('❌ Error generando PDF:', err);
      });
    } catch (error) {
      console.error('❌ Error general en generatePDF:', error);
    }
  }

  resetBooking(): void {
    this.selectedEspecialidadId = null;
    this.selectedMedicoId = '';
    this.selectedDate = null;
    this.selectedSlot = null;
    this.showConfirmation = false;
  }

  getEspecialidadNombre(especialidadId: number | undefined): string {
    if (!especialidadId) return '';
    const esp = this.especialidades().find(e => e.id === especialidadId);
    return esp?.nombre || '';
  }

  getMedicoNombre(medicoId: string | undefined): string {
    if (!medicoId) return 'Médico';
    // Buscar primero en todos los médicos cargados, luego en filteredDoctors
    const med = this.medicos().find(d => String(d.id) === String(medicoId)) 
             || this.filteredDoctors.find(d => d.id === medicoId);
    return med?.nombre || 'Médico';
  }

  trackById(index: number, item: any): any {
    return item.id;
  }
}
