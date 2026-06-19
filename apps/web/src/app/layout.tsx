import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SPIRA — School Parent Interaction & Resource Access",
  description: "The complete school operating system connecting administration, academics, finance, parents and students.",
  icons: { icon: "/images/spira-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-50 text-text-900 font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
