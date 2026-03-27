/**
 * Servicio para validar cédulas ecuatorianas
 * Basado en el algoritmo del SRI
 */
export class ValidacionCedulaService {

  static normalizarDocumento(documento: string): string {
    return (documento || '').trim().replace(/\D+/g, '');
  }

  static esDocumentoEcuatorianoValido(documento: string): boolean {
    const doc = this.normalizarDocumento(documento);

    if (doc.length === 10) {
      return this.esCedulaValida(doc);
    }

    // RUC persona natural (13 dígitos) = cédula (10) + 3 dígitos adicionales
    if (doc.length === 13) {
      const cedula = doc.substring(0, 10);
      const sufijo = doc.substring(10);
      return this.esCedulaValida(cedula) && sufijo !== '000';
    }

    return false;
  }

  /**
   * Verifica si una cédula ecuatoriana es válida
   * @param numeroCedula 
   * @returns boolean
   */
  static esCedulaValida(numeroCedula: string): boolean {
    const cedula = this.normalizarDocumento(numeroCedula);

    // Verificar que no esté vacío
    if (!cedula || cedula === '') {
      return false;
    }

    // Verificar que tenga 10 dígitos
    if (cedula.length !== 10) {
      return false;
    }

    // Verificar que sean solo números
    if (!/^\d+$/.test(cedula)) {
      return false;
    }

    // Verificar código de provincia (01-24) y 30 (extranjeros)
    const numeroProvincia: number = parseInt(cedula.substring(0, 2), 10);
    if (!((numeroProvincia >= 1 && numeroProvincia <= 24) || numeroProvincia === 30)) {
      return false;
    }

    // Verificar tercer dígito (0-5 para cédula)
    const tercerDigito: number = parseInt(cedula.substring(2, 3), 10);
    if (tercerDigito < 0 || tercerDigito > 5) {
      return false;
    }

    // Algoritmo de verificación
    const coeficientes: number[] = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitos = cedula.split('');

    let sumatoria = 0;

    for (let posicion = 0; posicion < coeficientes.length; posicion++) {
      const resultado: number = parseInt(digitos[posicion], 10) * coeficientes[posicion];

      // Si el resultado es >= 10, se resta 9
      const sumatoriaParcial = resultado >= 10 ? resultado - 9 : resultado;
      sumatoria += sumatoriaParcial;
    }

    // Calcular dígito verificador
    const residuo = sumatoria % 10;
    const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;

    // Comparar con el último dígito de la cédula
    const ultimoDigito: number = parseInt(cedula.charAt(9), 10);

    return ultimoDigito === digitoVerificador;
  }
}
