"use client"
// import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import { SessionProvider } from "next-auth/react";
// import { RequireAuth } from "@/components/auth/require-auth";
import React, { useEffect, useState, createContext } from "react"

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap", // Better font loading performance
  preload: true,
});


// export const metadata: Metadata = {
//   title: "Mr. Nice Drive - Driver Tracking System",
//   description: "Advanced driver performance tracking and alerting system for Dubai limousine fleet",
// };

const DarkModeContext = createContext<{ darkMode: boolean, setDarkMode: (v: boolean) => void }>({ darkMode: false, setDarkMode: () => {} })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // On mount, check localStorage
    const stored = localStorage.getItem("darkMode")
    if (stored === "true") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("darkMode", "true")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("darkMode", "false")
    }
  }, [darkMode])

  return (
    <html lang="en">
      <body className={lexend.className}>
        <SessionProvider>
          <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
            {children}
          </DarkModeContext.Provider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
