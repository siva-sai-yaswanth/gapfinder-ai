import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "GapFinder AI", description: "Find what the student doesn't know." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
