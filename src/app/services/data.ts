import { Injectable } from '@angular/core';

// ============ INTERFACES DE TABLAS ============

interface PersonaRow {
  pers_id: number;
  pers_ci: string;
  pers_nombres: string;
  pers_apellidos: string;
  pers_fech_naci: string;
  habilitado: number;
  terminos_aceptados: number;
}

interface UsuarioRow {
  user_id: number;
  user_ci: string;
  user_nombre: string;
  user_correo: string;
  user_clave: string; // MD5 hash
}

interface EspecialidadRow {
  espe_id: number;
  espe_nombre: string;
}

interface MedicoRow {
  medi_id: number;
  medi_nombre: string;
  medi_ci: string;
  espe_id: number;
  porc: number;
}

interface AgendaRow {
  agen_id: number;
  hosp_id: number;
  medi_id: number;
  agen_fech_inic: string;
  agen_fech_fina: string;
  agen_dura_cita: number;
  stat_agen_id: number;
  user_id: number;
}

interface JornadaRow {
  jorn_id: number;
  agen_id: number;
  dia_id: number;
  jorn_hora_inic: string;
  jorn_hora_fina: string;
  espe_id: number;
  cons_id: number;
  user_id: number;
}

interface CitaRow {
  cita_id: number;
  hosp_id: number;
  agen_id: number;
  jorn_id: number;
  medi_id: number;
  cons_id: number;
  espe_id: number;
  cita_fecha: string;
  cita_tiempo: number;
  cita_activa: number;
  pers_id: number;
  proc_cita_id: number;
  esta_cita_id: number;
  cita_fech_crea: string;
}

interface AgendamientoQrRow {
  id: number;
  pers_id: number;
  codigo: string;
  cita_id: number;
}

interface EstadoCitaRow {
  esta_cita_id: number;
  esta_cita_nombre: string;
}

interface ProcedimientoCitaRow {
  proc_cita_id: number;
  proc_cita_nombre: string;
}

// ============ HELPER FUNCTIONS ============

function limpiarNombreDuplicado(nombre: string): string {
  if (!nombre) return nombre;
  const nombreLimpio = nombre.trim();
  const partes = nombreLimpio.split(/\s+/);
  const vistas = new Set<string>();
  const partesLimpias: string[] = [];
  for (const parte of partes) {
    const parteLower = parte.toLowerCase();
    if (!vistas.has(parteLower)) {
      vistas.add(parteLower);
      partesLimpias.push(parte);
    }
  }
  return partesLimpias.join(' ');
}

function combinarNombreApellido(nombres: string, apellidos: string): string {
  const nombreCompleto = `${nombres || ''} ${apellidos || ''}`.trim();
  if (!nombreCompleto) return '';
  const partes = nombreCompleto.split(/\s+/);
  const vistas = new Set<string>();
  const partesLimpias: string[] = [];
  for (const parte of partes) {
    const lower = parte.toLowerCase();
    if (!vistas.has(lower)) {
      vistas.add(lower);
      partesLimpias.push(parte);
    }
  }
  return partesLimpias.join(' ');
}

async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // ============ AUTO-INCREMENT COUNTERS ============
  private nextCitaId = 1000;
  private nextAgendaId = 100;
  private nextJornadaId = 500;
  private nextQrId = 100;

  // ============ TABLAS ============

  personas: PersonaRow[] = [
    { pers_id: 1, pers_ci: '1710034065', pers_nombres: 'JUAN CARLOS', pers_apellidos: 'PEREZ LOPEZ', pers_fech_naci: '1990-05-20', habilitado: 1, terminos_aceptados: 0 },
    { pers_id: 2, pers_ci: '1720408755', pers_nombres: 'MARIA FERNANDA', pers_apellidos: 'GARCIA MARTINEZ', pers_fech_naci: '1985-08-15', habilitado: 1, terminos_aceptados: 1 },
    { pers_id: 3, pers_ci: '1750871691', pers_nombres: 'PEDRO ANDRES', pers_apellidos: 'RODRIGUEZ SILVA', pers_fech_naci: '1978-12-01', habilitado: 1, terminos_aceptados: 0 },
    { pers_id: 4, pers_ci: '1714307665', pers_nombres: 'ANA LUCIA', pers_apellidos: 'MORALES VEGA', pers_fech_naci: '1995-03-10', habilitado: 1, terminos_aceptados: 1 },
    { pers_id: 5, pers_ci: '1723456781', pers_nombres: 'CARLOS EDUARDO', pers_apellidos: 'TORRES MENDEZ', pers_fech_naci: '1988-07-25', habilitado: 0, terminos_aceptados: 0 },
  ];

  usuarios: UsuarioRow[] = [
    { user_id: 1, user_ci: '1700000002', user_nombre: 'Administrador Principal', user_correo: 'admin@hospital.com', user_clave: 'admin123' },
  ];

  especialidades: EspecialidadRow[] = [
    { espe_id: 23, espe_nombre: 'NEONATOLOGIA' },
    { espe_id: 25, espe_nombre: 'NUTRICION' },
    { espe_id: 29, espe_nombre: 'PEDIATRIA' },
    { espe_id: 32, espe_nombre: 'PSICOREHABILITACION' },
    { espe_id: 33, espe_nombre: 'PSIQUIATRIA' },
    { espe_id: 133, espe_nombre: 'NEFROLOGIA1' },
  ];

  private readonly especialidadesHabilitadas = [23, 25, 29, 32, 33, 133];

  medicos: MedicoRow[] = [
    // NEONATOLOGIA (23)
    { medi_id: 1, medi_nombre: 'DRA. LAURA MARTINEZ REYES', medi_ci: '1700100001', espe_id: 23, porc: 100 },
    { medi_id: 2, medi_nombre: 'DR. ROBERTO SANCHEZ VILLA', medi_ci: '1700100002', espe_id: 23, porc: 100 },
    // NUTRICION (25)
    { medi_id: 3, medi_nombre: 'DRA. CARMEN FLORES DUARTE', medi_ci: '1700100003', espe_id: 25, porc: 100 },
    { medi_id: 4, medi_nombre: 'DR. MIGUEL ANGEL RIOS', medi_ci: '1700100004', espe_id: 25, porc: 100 },
    // PEDIATRIA (29)
    { medi_id: 5, medi_nombre: 'DRA. PATRICIA GOMEZ LUNA', medi_ci: '1700100005', espe_id: 29, porc: 100 },
    { medi_id: 6, medi_nombre: 'DR. FERNANDO CASTRO VERA', medi_ci: '1700100006', espe_id: 29, porc: 100 },
    { medi_id: 7, medi_nombre: 'DRA. ELENA PAREDES MORA', medi_ci: '1700100007', espe_id: 29, porc: 100 },
    // PSICOREHABILITACION (32)
    { medi_id: 8, medi_nombre: 'DR. ANDRES VALENCIA PONCE', medi_ci: '1700100008', espe_id: 32, porc: 100 },
    { medi_id: 9, medi_nombre: 'DRA. SOFIA HERRERA CAMPOS', medi_ci: '1700100009', espe_id: 32, porc: 100 },
    // PSIQUIATRIA (33)
    { medi_id: 10, medi_nombre: 'DR. JORGE MENDOZA RUIZ', medi_ci: '1700100010', espe_id: 33, porc: 100 },
    { medi_id: 11, medi_nombre: 'DRA. DIANA LEON NAVARRO', medi_ci: '1700100011', espe_id: 33, porc: 100 },
    // NEFROLOGIA1 (133)
    { medi_id: 12, medi_nombre: 'DR. RICARDO AGUIRRE SOTO', medi_ci: '1700100012', espe_id: 133, porc: 100 },
    { medi_id: 13, medi_nombre: 'DRA. GABRIELA NUNEZ ORTIZ', medi_ci: '1700100013', espe_id: 133, porc: 100 },
  ];

  agendas: AgendaRow[] = [];
  jornadas: JornadaRow[] = [];
  citas: CitaRow[] = [];
  agendamientoqr: AgendamientoQrRow[] = [];

  estadoCita: EstadoCitaRow[] = [
    { esta_cita_id: 1, esta_cita_nombre: 'RESERVADA' },
    { esta_cita_id: 2, esta_cita_nombre: 'CONFIRMADA' },
    { esta_cita_id: 3, esta_cita_nombre: 'EN PROCESO' },
    { esta_cita_id: 4, esta_cita_nombre: 'COMPLETADA' },
    { esta_cita_id: 5, esta_cita_nombre: 'CANCELADA' },
    { esta_cita_id: 6, esta_cita_nombre: 'REAGENDADA' },
  ];

  procedimientoCita: ProcedimientoCitaRow[] = [
    { proc_cita_id: 1, proc_cita_nombre: 'PRIMERA VEZ' },
    { proc_cita_id: 6, proc_cita_nombre: 'SUBSECUENTE' },
  ];

  constructor() {
    this.initializeAgendas();
    this.initializeCitasHistoricas();
  }

  // ============ INICIALIZACIÓN DE AGENDAS ============

  private initializeAgendas(): void {
    // Crear agendas para cada médico (6 meses desde hoy)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(1); // primer día del mes actual
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 6);

    const startStr = this.formatDateStr(startDate);
    const endStr = this.formatDateStr(endDate);

    for (const medico of this.medicos) {
      const agenId = this.nextAgendaId++;
      this.agendas.push({
        agen_id: agenId,
        hosp_id: 1,
        medi_id: medico.medi_id,
        agen_fech_inic: startStr,
        agen_fech_fina: endStr,
        agen_dura_cita: 20,
        stat_agen_id: 1,
        user_id: 1
      });

      // Crear jornadas: Lunes a Viernes, 08:00-12:00
      for (let dia = 0; dia <= 4; dia++) { // 0=Lunes ... 4=Viernes
        this.jornadas.push({
          jorn_id: this.nextJornadaId++,
          agen_id: agenId,
          dia_id: dia,
          jorn_hora_inic: '08:00:00',
          jorn_hora_fina: '12:00:00',
          espe_id: medico.espe_id,
          cons_id: 1,
          user_id: 1
        });
      }
    }
  }

  private initializeCitasHistoricas(): void {
    // Sembrar historial para que algunos pacientes sean subsecuentes.
    // Nota: estas citas están en el pasado y no afectan la lista de "citas futuras".
    const seed = [
      { pers_id: 2, espe_id: 29, medi_id: 5 },
      { pers_id: 4, espe_id: 25, medi_id: 3 },
    ];

    const now = new Date();
    for (const item of seed) {
      const agenda = this.agendas.find(a => a.medi_id === item.medi_id);
      const jornada = agenda ? this.jornadas.find(j => j.agen_id === agenda.agen_id) : null;
      if (!agenda || !jornada) continue;

      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 120);
      pastDate.setHours(9, 0, 0, 0);

      const fechaStr = this.formatDateStr(pastDate);
      const citaFecha = `${fechaStr} 09:00:00`;

      this.citas.push({
        cita_id: this.nextCitaId++,
        hosp_id: 1,
        agen_id: agenda.agen_id,
        jorn_id: jornada.jorn_id,
        medi_id: item.medi_id,
        cons_id: 1,
        espe_id: item.espe_id,
        cita_fecha: citaFecha,
        cita_tiempo: 20,
        cita_activa: 1,
        pers_id: item.pers_id,
        proc_cita_id: 6,
        esta_cita_id: 4,
        cita_fech_crea: citaFecha
      });
    }
  }

  // ============ AUTH ============

  loginPaciente(ci: string, fecha_nacimiento: string): { success: boolean; data?: any; error?: string; status?: number } {
    const ciNorm = (ci || '').trim().replace(/\D+/g, '');
    const ciLookup = ciNorm.length === 13 ? ciNorm.substring(0, 10) : ciNorm;
    const fechaNorm = (fecha_nacimiento || '').trim();

    const persona = this.personas.find(p => p.pers_ci === ciLookup && p.pers_fech_naci === fechaNorm);
    if (!persona) {
      return { success: false, error: 'Credenciales inválidas', status: 401 };
    }
    if (persona.habilitado === 0) {
      return {
        success: false,
        error: 'Usted se encuentra deshabilitado para el agendamiento en línea. Por favor acérquese presencialmente.',
        status: 403
      };
    }
    const nombre = combinarNombreApellido(persona.pers_nombres, persona.pers_apellidos);
    return {
      success: true,
      data: {
        id: persona.pers_id.toString(),
        ci: persona.pers_ci,
        nombre,
        fecha_nacimiento: persona.pers_fech_naci,
        habilitado: persona.habilitado,
        terminos_aceptados: persona.terminos_aceptados,
        role: 'PACIENTE'
      }
    };
  }

  loginAdmin(correo: string, clave: string): { success: boolean; data?: any; error?: string; status?: number } {
    // Comparar contraseña en texto plano (simplificado para demo sin BD)
    const correoNorm = (correo || '').trim();
    const claveNorm = (clave || '').trim();
    const usuario = this.usuarios.find(u => u.user_correo === correoNorm && u.user_clave === claveNorm);
    if (!usuario) {
      return { success: false, error: 'Credenciales inválidas', status: 401 };
    }
    return {
      success: true,
      data: {
        id: usuario.user_id.toString(),
        ci: usuario.user_ci,
        nombre: usuario.user_nombre,
        correo: usuario.user_correo,
        role: 'ADMINISTRADOR'
      }
    };
  }

  // ============ ESPECIALIDADES ============

  getEspecialidades(): any[] {
    return this.especialidades
      .filter(e => this.especialidadesHabilitadas.includes(e.espe_id))
      .map(e => ({ id: e.espe_id, nombre: e.espe_nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // ============ MÉDICOS ============

  getMedicosByEspecialidad(especialidadId: number): any[] {
    return this.medicos
      .filter(m => m.espe_id === especialidadId)
      .map(m => ({
        id: m.medi_id.toString(),
        nombre: limpiarNombreDuplicado(m.medi_nombre),
        ci: m.medi_ci,
        especialidad_id: m.espe_id,
        consultorio: 'Ingresar 30 min antes a enfermería para tomarse los signos vitales, después se le asignara el consultorio'
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  getAllMedicos(): any[] {
    return this.medicos
      .map(m => ({
        id: m.medi_id.toString(),
        nombre: limpiarNombreDuplicado(m.medi_nombre),
        especialidad_id: m.espe_id
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // ============ SLOTS ============

  getDoctorSlots(medicoId: string, startDateParam?: string, endDateParam?: string): any[] {
    const medicoIdNum = parseInt(medicoId, 10);
    const allSlots: any[] = [];

    // Minimum booking date: 30 days from now
    const minBookingDate = new Date();
    minBookingDate.setDate(minBookingDate.getDate() + 30);
    minBookingDate.setHours(0, 0, 0, 0);

    // Get enabled percentage
    const medico = this.medicos.find(m => m.medi_id === medicoIdNum);
    const porcentaje = medico?.porc || 100;

    const medicoAgendas = this.agendas.filter(a => a.medi_id === medicoIdNum);

    for (const agenda of medicoAgendas) {
      const jornadaRows = this.jornadas
        .filter(j => j.agen_id === agenda.agen_id)
        .sort((a, b) => a.dia_id - b.dia_id);

      let startDate = new Date(agenda.agen_fech_inic + 'T00:00:00');
      let endDate = new Date(agenda.agen_fech_fina + 'T23:59:59');

      const queryStartDate = startDateParam ? new Date(startDateParam + 'T00:00:00') : startDate;
      const queryEndDate = endDateParam ? new Date(endDateParam + 'T23:59:59') : endDate;

      let effectiveStartDate = queryStartDate < startDate ? startDate : queryStartDate;
      const effectiveEndDate = queryEndDate > endDate ? endDate : queryEndDate;

      if (effectiveStartDate < minBookingDate) {
        effectiveStartDate = minBookingDate;
      }

      let currentDate = new Date(effectiveStartDate);
      currentDate.setHours(0, 0, 0, 0);

      let daysProcessed = 0;
      const maxDays = 100;

      while (currentDate <= effectiveEndDate && daysProcessed < maxDays) {
        const dayOfWeek = currentDate.getDay();
        const jornadaDayId = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const jornada = jornadaRows.find(j => j.dia_id === jornadaDayId);

        if (jornada) {
          const [sH, sM] = jornada.jorn_hora_inic.split(':').map(Number);
          const [eH, eM] = jornada.jorn_hora_fina.split(':').map(Number);

          const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
          const availableMinutes = Math.floor(totalMinutes * (porcentaje / 100));
          const adjustedEndMinutes = sH * 60 + sM + availableMinutes;
          const adjustedEndHour = Math.floor(adjustedEndMinutes / 60);
          const adjustedEndMin = adjustedEndMinutes % 60;

          let slotTime = new Date(currentDate);
          slotTime.setHours(sH, sM, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(adjustedEndHour, adjustedEndMin, 0, 0);

          while (slotTime < endTime) {
            const slotEndTime = new Date(slotTime);
            slotEndTime.setMinutes(slotTime.getMinutes() + agenda.agen_dura_cita);

            if (slotEndTime <= endTime) {
              const hours = slotTime.getHours().toString().padStart(2, '0');
              const minutes = slotTime.getMinutes().toString().padStart(2, '0');
              const timeStr = `${hours}:${minutes}`;

              const endHours = slotEndTime.getHours().toString().padStart(2, '0');
              const endMinutes = slotEndTime.getMinutes().toString().padStart(2, '0');
              const endTimeStr = `${endHours}:${endMinutes}`;

              const dateStr = this.formatDateStr(slotTime);

              // Check if slot is already booked
              const isBooked = this.citas.some(c =>
                c.medi_id === medicoIdNum &&
                c.cita_fecha.startsWith(dateStr) &&
                c.cita_fecha.includes(timeStr) &&
                c.esta_cita_id === 1
              );

              allSlots.push({
                id: `${medicoId}-${slotTime.getTime()}`,
                doctorId: medicoId,
                date: dateStr,
                time: timeStr,
                endTime: endTimeStr,
                duration: agenda.agen_dura_cita,
                isBooked
              });
            }

            slotTime.setMinutes(slotTime.getMinutes() + agenda.agen_dura_cita);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
        daysProcessed++;
      }
    }

    allSlots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return allSlots;
  }

  // ============ CITAS ============

  createCita(data: {
    medico_id: string;
    especialidad_id: number;
    fecha: string;
    time: string;
    paciente_id: string;
    duracion: number;
  }): { success: boolean; data?: any; error?: string } {
    const medicoIdNum = parseInt(data.medico_id, 10);
    const pacienteIdNum = parseInt(data.paciente_id, 10);

    // Restricción: el paciente debe ser subsecuente y solo puede agendar en su especialidad permitida
    const restriccion = this.getUltimaCitaSubsecuente(data.paciente_id);
    if (!restriccion.tieneCitaSubsecuente) {
      return { success: false, error: 'Usted no es un paciente subsecuente, por favor acercarse de forma presencial a realizar la cita.' };
    }
    if (restriccion.especialidad_id !== data.especialidad_id) {
      return { success: false, error: 'No puede agendar en esta especialidad. Solo puede agendar en su especialidad subsecuente.' };
    }

    // Find matching agenda + jornada
    const fechaDate = new Date(data.fecha + 'T' + data.time + ':00');
    const dayOfWeek = fechaDate.getDay();
    const diaSemana = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const medicoAgendas = this.agendas.filter(a =>
      a.medi_id === medicoIdNum &&
      a.agen_fech_inic <= data.fecha &&
      a.agen_fech_fina >= data.fecha
    );

    let foundAgenda: AgendaRow | null = null;
    let foundJornada: JornadaRow | null = null;

    for (const agenda of medicoAgendas) {
      const jornada = this.jornadas.find(j =>
        j.agen_id === agenda.agen_id &&
        j.dia_id === diaSemana &&
        j.jorn_hora_inic <= data.time + ':00' &&
        j.jorn_hora_fina >= data.time + ':00'
      );
      if (jornada) {
        foundAgenda = agenda;
        foundJornada = jornada;
        break;
      }
    }

    if (!foundAgenda || !foundJornada) {
      return { success: false, error: 'No hay agenda disponible para este médico en la fecha y hora seleccionada' };
    }

    const citaId = this.nextCitaId++;
    const citaFecha = `${data.fecha} ${data.time}:00`;
    const citaTiempo = data.duracion || foundAgenda.agen_dura_cita || 20;
    const consId = foundJornada.cons_id || 1;

    this.citas.push({
      cita_id: citaId,
      hosp_id: 1,
      agen_id: foundAgenda.agen_id,
      jorn_id: foundJornada.jorn_id,
      medi_id: medicoIdNum,
      cons_id: consId,
      espe_id: data.especialidad_id,
      cita_fecha: citaFecha,
      cita_tiempo: citaTiempo,
      cita_activa: 1,
      pers_id: pacienteIdNum,
      proc_cita_id: 6,
      esta_cita_id: 1,
      cita_fech_crea: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    // Generate QR code (10-digit random)
    const codigoAleatorio = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    this.agendamientoqr.push({
      id: this.nextQrId++,
      pers_id: pacienteIdNum,
      codigo: codigoAleatorio,
      cita_id: citaId
    });

    return {
      success: true,
      data: {
        success: true,
        cita_id: citaId,
        message: 'Cita registrada exitosamente',
        codigo_qr: codigoAleatorio,
        qr_image: null, // QR image will be generated client-side
        cita: {
          id: citaId.toString(),
          medico_id: data.medico_id,
          especialidad_id: data.especialidad_id,
          date: data.fecha,
          time: data.time,
          patientId: data.paciente_id,
          bookingDate: new Date().toISOString(),
          agen_id: foundAgenda.agen_id,
          jorn_id: foundJornada.jorn_id,
          cons_id: consId,
          cita_activa: 1
        }
      }
    };
  }

  getCitasByPaciente(persId: string): any[] {
    const persIdNum = parseInt(persId, 10);
    const now = new Date();
    const currentDate = this.formatDateStr(now);
    const currentTime = now.toTimeString().substring(0, 5);

    return this.citas
      .filter(c => {
        if (c.pers_id !== persIdNum || c.esta_cita_id !== 1) return false;
        const [datePart, timePart] = c.cita_fecha.split(' ');
        if (datePart > currentDate) return true;
        if (datePart === currentDate && timePart > currentTime + ':00') return true;
        return false;
      })
      .map(c => {
        const medico = this.medicos.find(m => m.medi_id === c.medi_id);
        const especialidad = this.especialidades.find(e => e.espe_id === c.espe_id);
        const estadoCita = this.estadoCita.find(ec => ec.esta_cita_id === c.esta_cita_id);
        const qr = this.agendamientoqr.find(q => q.cita_id === c.cita_id);

        return {
          cita_id: c.cita_id,
          cita_fecha: c.cita_fecha,
          cita_fech_crea: c.cita_fech_crea,
          pers_id: c.pers_id,
          medi_id: c.medi_id,
          espe_id: c.espe_id,
          esta_cita_id: c.esta_cita_id,
          medi_nombre: limpiarNombreDuplicado(medico?.medi_nombre || ''),
          espe_nombre: especialidad?.espe_nombre || '',
          esta_cita_nombre: estadoCita?.esta_cita_nombre || '',
          codigo_qr: qr?.codigo || ''
        };
      })
      .sort((a, b) => a.cita_fecha.localeCompare(b.cita_fecha));
  }

  cancelCitaPaciente(citaId: string): { success: boolean; patientDisabled: boolean; warning: string | null; error?: string } {
    const citaIdNum = parseInt(citaId, 10);
    const citaIndex = this.citas.findIndex(c => c.cita_id === citaIdNum);

    if (citaIndex === -1) {
      return { success: false, patientDisabled: false, warning: null, error: 'Cita no encontrada' };
    }

    const cita = this.citas[citaIndex];
    const isReservedCita = cita.esta_cita_id === 1;
    const persId = cita.pers_id;

    // Remove QR
    this.agendamientoqr = this.agendamientoqr.filter(q => q.cita_id !== citaIdNum);

    // Remove cita
    this.citas.splice(citaIndex, 1);

    // If canceling reserved cita, disable patient
    let patientDisabled = false;
    if (isReservedCita) {
      const persona = this.personas.find(p => p.pers_id === persId);
      if (persona) {
        persona.habilitado = 0;
        patientDisabled = true;
      }
    }

    return {
      success: true,
      patientDisabled,
      warning: patientDisabled ? 'Se le ha deshabilitado el acceso al sistema. Por favor acérquese presencialmente.' : null
    };
  }

  // ============ ÚLTIMA CITA SUBSECUENTE ============

  getUltimaCitaSubsecuente(persId: string): any {
    const persIdNum = parseInt(persId, 10);
    const citasSubsecuentes = this.citas
      .filter(c => c.pers_id === persIdNum && c.proc_cita_id === 6 && c.esta_cita_id !== 5)
      .sort((a, b) => b.cita_fecha.localeCompare(a.cita_fecha));

    if (citasSubsecuentes.length === 0) {
      return { tieneCitaSubsecuente: false, mensaje: 'Paciente no tiene citas subsecuentes previas' };
    }

    const ultimaCita = citasSubsecuentes[0];
    const especialidad = this.especialidades.find(e => e.espe_id === ultimaCita.espe_id);

    return {
      tieneCitaSubsecuente: true,
      especialidad_id: ultimaCita.espe_id,
      especialidad_nombre: especialidad?.espe_nombre || '',
      cita_fecha: ultimaCita.cita_fecha,
      proc_cita_id: ultimaCita.proc_cita_id
    };
  }

  // ============ HAS COMPLETED CITAS ============

  hasCompletedCitas(persId: string): { hasCompletedCitas: boolean; count: number } {
    const persIdNum = parseInt(persId, 10);
    const count = this.citas.filter(c => c.pers_id === persIdNum && c.esta_cita_id === 4).length;
    return { hasCompletedCitas: count > 0, count };
  }

  // ============ NOTIFICACIONES ============

  getPacienteNotificaciones(persId: string): any {
    const persIdNum = parseInt(persId, 10);
    const now = new Date();
    const currentDate = this.formatDateStr(now);
    const currentTime = now.toTimeString().substring(0, 5);

    const notificaciones = this.citas
      .filter(c => {
        if (c.pers_id !== persIdNum || c.esta_cita_id !== 5) return false;
        const [datePart, timePart] = c.cita_fecha.split(' ');
        if (datePart > currentDate) return true;
        if (datePart === currentDate && timePart > currentTime + ':00') return true;
        return false;
      })
      .map(c => {
        const medico = this.medicos.find(m => m.medi_id === c.medi_id);
        const especialidad = this.especialidades.find(e => e.espe_id === c.espe_id);
        const estadoCita = this.estadoCita.find(ec => ec.esta_cita_id === c.esta_cita_id);

        return {
          cita_id: c.cita_id,
          cita_fecha: c.cita_fecha,
          pers_id: c.pers_id,
          medi_id: c.medi_id,
          espe_id: c.espe_id,
          medi_nombre: limpiarNombreDuplicado(medico?.medi_nombre || ''),
          espe_nombre: especialidad?.espe_nombre || '',
          esta_cita_nombre: estadoCita?.esta_cita_nombre || ''
        };
      })
      .sort((a, b) => a.cita_fecha.localeCompare(b.cita_fecha));

    return { success: true, notificaciones, total: notificaciones.length };
  }

  markNotificationsAsRead(persId: string): void {
    const persIdNum = parseInt(persId, 10);
    this.citas.forEach(c => {
      if (c.pers_id === persIdNum && c.esta_cita_id === 5) {
        c.esta_cita_id = 6;
      }
    });
  }

  // ============ ACEPTAR TÉRMINOS ============

  aceptarTerminos(persId: number): void {
    const persona = this.personas.find(p => p.pers_id === persId);
    if (persona) {
      persona.terminos_aceptados = 1;
    }
  }

  // ============ ADMIN ENDPOINTS ============

  getAdminMedicos(search?: string): any[] {
    let filtered = this.medicos;

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filtered = this.medicos.filter(m =>
        m.medi_nombre.toLowerCase().includes(searchTerm) ||
        m.medi_ci.includes(searchTerm)
      );
    }

    return filtered.slice(0, 20).map(m => {
      const especialidad = this.especialidades.find(e => e.espe_id === m.espe_id);
      const totalAgendas = this.agendas.filter(a => a.medi_id === m.medi_id).length;
      const agendaIds = this.agendas.filter(a => a.medi_id === m.medi_id).map(a => a.agen_id);
      const totalJornadas = this.jornadas.filter(j => agendaIds.includes(j.agen_id)).length;

      return {
        medi_id: m.medi_id,
        medi_nombre: limpiarNombreDuplicado(m.medi_nombre),
        medi_ci: m.medi_ci,
        espe_id: m.espe_id,
        espe_nombre: especialidad?.espe_nombre || '',
        porc: m.porc,
        total_agendas: totalAgendas,
        total_jornadas: totalJornadas
      };
    });
  }

  getPacientes(search?: string): any[] {
    let filtered = this.personas;

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filtered = this.personas.filter(p =>
        p.pers_ci.includes(searchTerm) ||
        p.pers_nombres.toLowerCase().includes(searchTerm) ||
        p.pers_apellidos.toLowerCase().includes(searchTerm)
      );
    }

    return filtered.slice(0, 20).map(p => ({
      pers_id: p.pers_id,
      pers_ci: p.pers_ci,
      nombre: combinarNombreApellido(p.pers_nombres, p.pers_apellidos),
      habilitado: p.habilitado
    }));
  }

  updatePacienteHabilitado(persId: string, habilitado: number): { success: boolean; message: string } {
    const persIdNum = parseInt(persId, 10);
    const persona = this.personas.find(p => p.pers_id === persIdNum);
    if (persona) {
      persona.habilitado = habilitado;
    }
    return {
      success: true,
      message: `Paciente ${habilitado === 1 ? 'habilitado' : 'deshabilitado'} exitosamente`
    };
  }

  habilitarHorarios(mediId: string, porcentaje: number): { success: boolean; message: string } {
    const mediIdNum = parseInt(mediId, 10);
    const medico = this.medicos.find(m => m.medi_id === mediIdNum);
    if (medico) {
      medico.porc = porcentaje;
    }
    return {
      success: true,
      message: `Horarios habilitados al ${porcentaje}% para el médico ${mediId}`
    };
  }

  getCitasByMedico(mediId: string): any[] {
    const mediIdNum = parseInt(mediId, 10);

    return this.citas
      .filter(c => c.medi_id === mediIdNum)
      .sort((a, b) => b.cita_fecha.localeCompare(a.cita_fecha))
      .slice(0, 50)
      .map(c => {
        const persona = this.personas.find(p => p.pers_id === c.pers_id);
        const especialidad = this.especialidades.find(e => e.espe_id === c.espe_id);
        const estadoCita = this.estadoCita.find(ec => ec.esta_cita_id === c.esta_cita_id);

        return {
          cita_id: c.cita_id,
          cita_fecha: c.cita_fecha,
          pers_id: c.pers_id,
          medi_id: c.medi_id,
          espe_id: c.espe_id,
          esta_cita_id: c.esta_cita_id,
          paciente_nombre: persona ? combinarNombreApellido(persona.pers_nombres, persona.pers_apellidos) : '',
          espe_nombre: especialidad?.espe_nombre || '',
          esta_cita_nombre: estadoCita?.esta_cita_nombre || ''
        };
      });
  }

  adminCancelCita(citaId: string): { success: boolean; message: string; cita?: any } {
    const citaIdNum = parseInt(citaId, 10);
    const cita = this.citas.find(c => c.cita_id === citaIdNum);

    if (!cita) {
      return { success: false, message: 'Cita no encontrada' };
    }

    // Get details before updating
    const persona = this.personas.find(p => p.pers_id === cita.pers_id);
    const medico = this.medicos.find(m => m.medi_id === cita.medi_id);
    const especialidad = this.especialidades.find(e => e.espe_id === cita.espe_id);

    // Change status to 5 (Cancelada)
    cita.esta_cita_id = 5;

    return {
      success: true,
      message: 'Cita cancelada exitosamente',
      cita: {
        paciente_nombre: persona ? combinarNombreApellido(persona.pers_nombres, persona.pers_apellidos) : '',
        medi_nombre: limpiarNombreDuplicado(medico?.medi_nombre || ''),
        espe_nombre: especialidad?.espe_nombre || ''
      }
    };
  }

  // Admin agendas
  createAgenda(mediId: string, fechaInicio: string, fechaFin: string, duracionCita: number): { success: boolean; agen_id: number } {
    const agenId = this.nextAgendaId++;
    this.agendas.push({
      agen_id: agenId,
      hosp_id: 1,
      medi_id: parseInt(mediId, 10),
      agen_fech_inic: fechaInicio,
      agen_fech_fina: fechaFin,
      agen_dura_cita: duracionCita || 20,
      stat_agen_id: 1,
      user_id: 1
    });
    return { success: true, agen_id: agenId };
  }

  getAgendasByMedico(mediId: string): any[] {
    const mediIdNum = parseInt(mediId, 10);
    return this.agendas
      .filter(a => a.medi_id === mediIdNum)
      .sort((a, b) => b.agen_fech_inic.localeCompare(a.agen_fech_inic));
  }

  deleteAgenda(agenId: number): { success: boolean } {
    this.jornadas = this.jornadas.filter(j => j.agen_id !== agenId);
    this.agendas = this.agendas.filter(a => a.agen_id !== agenId);
    return { success: true };
  }

  createJornada(agenId: number, diaId: number, horaInicio: string, horaFin: string, espeId?: number, consId?: number): { success: boolean; jorn_id: number } {
    // Get espe_id from the agenda's medico
    const agenda = this.agendas.find(a => a.agen_id === agenId);
    const medico = agenda ? this.medicos.find(m => m.medi_id === agenda.medi_id) : null;
    const medicoEspeId = medico?.espe_id || 1;

    const jornId = this.nextJornadaId++;
    this.jornadas.push({
      jorn_id: jornId,
      agen_id: agenId,
      dia_id: diaId,
      jorn_hora_inic: horaInicio,
      jorn_hora_fina: horaFin,
      espe_id: espeId || medicoEspeId,
      cons_id: consId || 1,
      user_id: 1
    });
    return { success: true, jorn_id: jornId };
  }

  getJornadasByAgenda(agenId: number): any[] {
    return this.jornadas
      .filter(j => j.agen_id === agenId)
      .sort((a, b) => a.dia_id - b.dia_id);
  }

  deleteJornada(jornId: number): { success: boolean } {
    this.jornadas = this.jornadas.filter(j => j.jorn_id !== jornId);
    return { success: true };
  }

  getPorcentajeHabilitado(mediId: string): { medi_id: string; porcentaje: number } {
    const mediIdNum = parseInt(mediId, 10);
    const medico = this.medicos.find(m => m.medi_id === mediIdNum);
    return { medi_id: mediId, porcentaje: medico?.porc || 100 };
  }

  // ============ HELPERS ============

  private formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
