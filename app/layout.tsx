import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const coolvetica = localFont({
  src: [
    {
      path: "./coolvetica/CoolveticaUl-Regular.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaEl-Regular.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaLt-Regular.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaRg-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaBk-Regular.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaRg-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./coolvetica/CoolveticaHv-Regular.woff2",
      weight: "900",
      style: "normal",
    }
  ],
  variable: "--font-coolvetica",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WindSearch",
  description: "Ask about weather in plain English. Get real data from global weather stations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={coolvetica.variable}>
      <body
        className={`${coolvetica.className} antialiased font-light`}
      >
        {children}
      </body>
    </html>
  );
}
