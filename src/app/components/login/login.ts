import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginCredentials } from '../../services/auth';
import { User, UserRole } from '../../types';
import { ValidacionCedulaService } from '../../services/validacion-cedula';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  @Output() login = new EventEmitter<User>();

  // Tabs
  activeTab: 'paciente' | 'admin' = 'paciente';
  
  // Paciente fields
  idNumber: string = '';
  birthDate: string = '';
  
  // Admin fields
  adminCi: string = '';
  adminClave: string = '';
  
  error: string = '';
  loading: boolean = false;

  // Expose current year for template
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService) {}

  handleLogin(): void {
    this.loading = true;
    this.error = '';
    
    if (this.activeTab === 'paciente') {
      // Validar cédula ecuatoriana
      if (!ValidacionCedulaService.esCedulaValida(this.idNumber)) {
        this.error = 'El número de cédula no es válido. Ingrese una cédula ecuatoriana correcta.';
        this.loading = false;
        return;
      }
      
      const credentials: LoginCredentials = {
        ci: this.idNumber,
        fecha_nacimiento: this.birthDate,
        tipo: 'paciente'
      };
      
      this.authService.login(credentials).subscribe({
        next: (authUser) => {
          const user: User = this.authService.mapAuthUserToUser(authUser);
          this.login.emit(user);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Error al iniciar sesión';
          this.loading = false;
        }
      });
    } else {
      // Admin login
      const credentials: LoginCredentials = {
        ci: this.adminCi,
        clave: this.adminClave,
        tipo: 'admin'
      };
      
      this.authService.login(credentials).subscribe({
        next: (authUser) => {
          const user: User = this.authService.mapAuthUserToUser(authUser);
          this.login.emit(user);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Error al iniciar sesión';
          this.loading = false;
        }
      });
    }
  }
}
