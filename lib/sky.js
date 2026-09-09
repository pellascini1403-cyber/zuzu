// Foto de fondo de la pantalla de entrada. Vive en su propio módulo porque
// la usan dos lados: la escena 3D (como textura, para que la burbuja pueda
// refractarla) y el CSS de WelcomeScreen (como fondo del primer frame).
// Importarla desde el componente del Canvas arrastraría three al bundle del
// servidor y anularía el dynamic({ ssr: false }) con el que se carga.
export const SKY_URL = "/sky/clouds.jpg";

// Proporción real del archivo, para el recorte tipo `object-fit: cover`.
export const SKY_ASPECT = 704 / 1520;
