/**
 * Servicio para validar cédulas ecuatorianas
 * Basado en el algoritmo del SRI
 */
export class ValidacionCedulaService {

  /**
   * Verifica si una cédula ecuatoriana es válida
   * @param numeroCedula 
   * @returns boolean
   */
  static esCedulaValida(numeroCedula: string): boolean {
    // Verificar que no esté vacío
    if (!numeroCedula || numeroCedula === '') {
      return false;
    }

    // Verificar que tenga 10 dígitos
    if (numeroCedula.length !== 10) {
      return false;
    }

    // Verificar que sean solo números
    if (!/^\d+$/.test(numeroCedula)) {
      return false;
    }

    // Verificar código de provincia (01-24)
    const numeroProvincia: number = parseInt(numeroCedula.substring(0, 2), 10);
    if (numeroProvincia < 1 || numeroProvincia > 24) {
      return false;
    }

    // Verificar tercer dígito (0-5 para cédula)
    const tercerDigito: number = parseInt(numeroCedula.substring(2, 3), 10);
    if (tercerDigito < 0 || tercerDigito > 5) {
      return false;
    }

    // Algoritmo de verificación
    const coeficientes: number[] = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitos = numeroCedula.split('');

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
    const ultimoDigito: number = parseInt(numeroCedula.charAt(9), 10);

    return ultimoDigito === digitoVerificador;
  }
}
