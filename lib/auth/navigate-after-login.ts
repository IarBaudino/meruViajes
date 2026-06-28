/** Navegación completa para que el middleware reciba la cookie de sesión recién creada. */
export function navigateAfterLogin(destination: string): void {
  window.location.assign(destination);
}
