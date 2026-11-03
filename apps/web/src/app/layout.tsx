import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { UiProviders } from "@/components/providers";
import { AuthProvider } from "@/lib/auth-context";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { CelebrationProvider } from "@/lib/celebration-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOOPLI CRM",
  description: "Premium Project & Issue Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ReactQueryProvider>
            <UiProviders>
              <CelebrationProvider>
                <AuthenticatedLayout>
                  {children}
                </AuthenticatedLayout>
              </CelebrationProvider>
            </UiProviders>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
