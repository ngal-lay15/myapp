"use client"
import { Inter } from "next/font/google";
import '../../globals.css';
import { CartProvider } from '../../CartContext';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <CartProvider>
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
    </CartProvider>

  );
}
