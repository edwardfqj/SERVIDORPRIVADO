import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User, UserRole } from '../types';
import { DataService } from './data';

export interface LoginCredentials {
  ci: string;
  fecha_nacimiento?: string;
  clave?: string;
  tipo: 'paciente' | 'admin';
}

export interface AuthUser {
  id: string;
  ci: string;
  nombre: string;
  fecha_nacimiento: string;
  role: 'PACIENTE' | 'ADMINISTRADOR';
  terminos_aceptados?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private dataService: DataService) {}

  login(credentials: LoginCredentials): Observable<AuthUser> {
    if (credentials.tipo === 'paciente') {
      const result = this.dataService.loginPaciente(credentials.ci, credentials.fecha_nacimiento || '');
      if (!result.success) {
        return throwError(() => new Error(result.error || 'Error de autenticación'));
      }
      return of(result.data as AuthUser);
    } else {
      const result = this.dataService.loginAdmin(credentials.ci, credentials.clave || '');
      if (!result.success) {
        return throwError(() => new Error(result.error || 'Error de autenticación'));
      }
      return of(result.data as AuthUser);
    }
  }

  logout(): Observable<void> {
    return of(undefined);
  }

  mapAuthUserToUser(authUser: AuthUser): User {
    return {
      id: authUser.id,
      nombre: authUser.nombre,
      role: authUser.role === 'ADMINISTRADOR' ? UserRole.ADMIN : UserRole.PATIENT,
      terminos_aceptados: authUser.terminos_aceptados
    };
  }
}
