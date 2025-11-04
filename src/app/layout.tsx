import "./globals.css";
import Navbar from "../components/ui/Navbar";
import { UserProvider, Providers } from "./context/Usercontext";
import { Toaster } from "sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room Rental",
  icons: {
    icon: '/favicon-light.png', 
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
        <Providers>
          <UserProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Toaster position="top-right" richColors />
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}