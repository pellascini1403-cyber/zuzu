import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografía global de la interfaz (pesos 500/600/700, ver globals.css
// donde --font-sans queda mapeada a esta variable).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Zuzu",
  description: "Zuzu, tu mascota virtual e inventario de hábitos",
};

// viewportFit: "cover" — sin esto, Next.js emite el meta viewport por
// default (`width=device-width, initial-scale=1`, SIN `viewport-fit`).
// En un iPhone real (con notch/Dynamic Island o el home indicator), el
// navegador entonces reserva ese espacio ANTES de que corra cualquier
// CSS: el viewport de layout mismo queda más chico que la pantalla
// física, y ningún `position: fixed; bottom: 0` de este archivo puede
// "recuperar" ese espacio — no es una restricción que el CSS pueda
// vencer, la aplica el navegador un nivel por encima del CSS. Con
// viewport-fit=cover el layout SÍ se extiende detrás de esas zonas
// (y recién ahí las variables env(safe-area-inset-*) empiezan a valer
// algo distinto de 0), que es lo que permite que la barra inferior de
// MainLayout.jsx llegue de verdad a bottom:0 en esos dispositivos.
// En Chromium de escritorio (sin hardware con safe-area real) esto no
// cambia nada visible — por eso el problema no se veía al verificar acá.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      {/* Nada acá le ponía techo al ancho: body/MainLayout/WelcomeScreen
          usan `w-full`, que en un teléfono real (siempre <=480px lógicos)
          simplemente ES el ancho de la pantalla — pero en una ventana de
          escritorio ancha (el caso de "el preview se ve deformado") ese
          mismo `w-full` se estira a los 1000+px de la ventana, y TODA la
          geometría de este archivo (círculos de fondo, header, dock...)
          se estira horizontalmente con él.
          `max-w-[430px] mx-auto` en este wrapper es justo eso: un techo.
          En cualquier pantalla real de celular (110-480px lógicos) el
          contenido ya mide menos que ese techo, así que no hace NADA ahí
          — cero cambio de comportamiento en el uso real en mobile. Recién
          arriba de 430px (ventana de escritorio, tablet en horizontal)
          dejar de estirarse y centrarse con franjas a los costados. No
          hace falta una media query: `max-width` ya es un límite que solo
          actúa cuando hace falta.
          `bg-neutral-950` en el body es el color de esas franjas — antes
          heredaba `var(--background)` (blanco en claro, casi negro en
          oscuro según el tema del sistema), que se veía como un error de
          layout en vez de leerse como el margen intencional de un
          simulador de teléfono. */}
      <body className="min-h-full flex justify-center bg-neutral-950">
        <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
