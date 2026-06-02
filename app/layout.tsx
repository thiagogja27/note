import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { DatabaseStatusBanner } from "@/components/database-status-banner"
import { ChatProvider } from "@/contexts/chat-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Minhas Anotações - App de Notas",
  description: "Aplicativo para criar e gerenciar suas anotações pessoais",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ChatProvider>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
            <DatabaseStatusBanner />
          </Suspense>
          <Toaster />
        </ChatProvider>
      </body>
    </html>
  )
}
