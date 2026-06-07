import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: "Voting Board",
  description: "Decentralised voting application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-gray-900 bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}