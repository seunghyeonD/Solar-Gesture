import type { Metadata } from "next";
import { Orbitron, Space_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Solar Gesture — 손으로 탐험하는 태양계",
  description:
    "웹캠 손 제스처로 태양계를 탐험하는 인터랙티브 경험",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${orbitron.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#000008] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
