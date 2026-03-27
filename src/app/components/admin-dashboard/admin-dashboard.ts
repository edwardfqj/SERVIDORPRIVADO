import { Component, EventEmitter, Input, Output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Slot } from '../../types';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  @Input() slots: Slot[] = [];
  @Output() addSlot = new EventEmitter<any>();
  @Output() deleteSlot = new EventEmitter<string>();

  // Tabs
  activeTab: 'horarios' | 'pacientes' = 'horarios';

  // Data
  medicos = signal<any[]>([]);
  citas = signal<any[]>([]);
  pacientes: any[] = [];
  loading = signal(false);

  // Citas form
  selectedMedicoId: string = '';
  medicoSearchCitas: string = '';

  // Habilitar horarios form
  horarioMedicoId: string = '';
  porcentaje: number = 100;
  medicoSearchHorarios: string = '';

  // Pacientes form
  pacienteSearch: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // No cargar datos automáticamente - usar búsqueda
  }

  async searchMedicos(searchTerm?: string): Promise<void> {
    try {
      this.loading.set(true);
      const data = await this.apiService.getAdminMedicos(searchTerm).toPromise();
      if (data) {
        this.medicos.set(data);
        console.log('Médicos encontrados:', data.length);
      }
    } catch (error) {
      console.error('Error buscando médicos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async searchPacientes(searchTerm?: string): Promise<void> {
    try {
      this.loading.set(true);
      const data = await this.apiService.getPacientes(searchTerm).toPromise();
      if (data) {
        this.pacientes = data;
        console.log('Pacientes encontrados:', data.length);
      }
    } catch (error) {
      console.error('Error buscando pacientes:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCitas(medicoId: string): Promise<void> {
    try {
      this.loading.set(true);
      const data = await this.apiService.getCitasByMedico(medicoId).toPromise();
      if (data) {
        this.citas.set(data);
        console.log('📋 Citas cargadas:', data.length);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onMedicoChangeCitas(): void {
    if (this.selectedMedicoId) {
      this.loadCitas(this.selectedMedicoId);
    } else {
      this.citas.set([]);
    }
  }

  async adminCancelCita(citaId: number): Promise<void> {
    if (!confirm('¿Está seguro de cancelar esta cita? El paciente será notificado.')) {
      return;
    }

    try {
      this.loading.set(true);
      const result = await this.apiService.adminCancelCita(citaId.toString()).toPromise();
      
      if (result) {
        alert('✅ Cita cancelada exitosamente. El paciente será notificado.');
        if (this.selectedMedicoId) {
          this.loadCitas(this.selectedMedicoId);
        }
      }
    } catch (error) {
      console.error('Error cancelando cita:', error);
      alert('Error al cancelar la cita');
    } finally {
      this.loading.set(false);
    }
  }

  async habilitarHorarios(): Promise<void> {
    if (!this.horarioMedicoId) {
      alert('Por favor seleccione un médico');
      return;
    }

    try {
      this.loading.set(true);
      const result = await this.apiService.habilitarHorarios(
        this.horarioMedicoId,
        this.porcentaje
      ).toPromise();
      
      if (result) {
        alert(`✅ ${result.message}`);
        // Reload medicos to get updated porc
        await this.searchMedicos();
      }
    } catch (error) {
      console.error('Error habilitando horarios:', error);
      alert('Error al habilitar horarios');
    } finally {
      this.loading.set(false);
    }
  }

  onMedicoHorariosChange(): void {
    // Load porc from selected medico
    const medico = this.medicos().find(m => m.medi_id === this.horarioMedicoId);
    if (medico && medico.porc) {
      this.porcentaje = medico.porc;
    } else {
      this.porcentaje = 100;
    }
  }

  onMedicoSearchHorariosChange(): void {
    // Ya no se busca automáticamente - usar botón
  }

  onMedicoSearchCitasChange(): void {
    // Ya no se busca automáticamente - usar botón
  }

  onPacienteSearchChange(): void {
    // Ya no se busca automáticamente - usar botón
  }

  buscarMedicosHorarios(): void {
    this.searchMedicos(this.medicoSearchHorarios || undefined);
  }

  buscarMedicosCitas(): void {
    this.searchMedicos(this.medicoSearchCitas || undefined);
  }

  buscarPacientes(): void {
    this.searchPacientes(this.pacienteSearch || undefined);
  }

  async togglePacienteHabilitado(paciente: any): Promise<void> {
    const nuevoEstado = paciente.habilitado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'habilitar' : 'deshabilitar';
    
    if (!confirm(`¿Está seguro de ${accion} al paciente ${paciente.nombre}?`)) {
      return;
    }

    try {
      const result = await this.apiService.updatePacienteHabilitado(paciente.pers_id, nuevoEstado).toPromise();
      
      if (result) {
        // Update local state
        paciente.habilitado = nuevoEstado;
        alert(`✅ Paciente ${accion}do exitosamente`);
      }
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      alert('Error al actualizar el estado del paciente');
    }
  }

  // Filtered doctors for horarios tab (now uses backend search)
  get filteredMedicosHorarios(): any[] {
    return this.medicos();
  }

  // Filtered doctors for citas tab (now uses backend search)
  get filteredMedicosCitas(): any[] {
    return this.medicos();
  }

  // Filtered patients (now uses backend search)
  get filteredPacientes(): any[] {
    return this.pacientes;
  }

  trackById(index: number, item: any): any {
    return item.medi_id || item.pers_id || item.cita_id || index;
  }
}
