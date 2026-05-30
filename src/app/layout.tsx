import type { Metadata } from "next";
import { Inter, Orbitron, Poppins } from "next/font/google";
import "./globals.css";
import AiChatWidget from "@/components/AiChatWidget";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["400","600","700","800","900"], display: "swap" });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300","400","500","600","700"], display: "swap" });

export const metadata: Metadata = {
  title: "NexGro — AI Powered AgroMarket",
  description: "Agricultural marketplace for farmers and buyers.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
        <AiChatWidget />
      </body>
    </html>
  );
}
