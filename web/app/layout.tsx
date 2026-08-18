import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BoxService",
  description: "Sistema de gestión para talleres mecánicos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-light font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
