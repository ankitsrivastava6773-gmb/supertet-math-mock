import "./globals.css";

export const metadata = {
  title: "SuperTET Math Mock 2026 — Adaptive Exam Simulator & Diagnostic Engine",
  description: "Bilingual, SymPy-verified Math mock tests with misconception diagnosis, step-by-step solutions, +3/-1 negative marking, and real-time timer for SuperTET 2026.",
  applicationName: "SuperTET Math",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SuperTET Math",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>
        {children}
      </body>
    </html>
  );
}
