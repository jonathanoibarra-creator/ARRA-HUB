import type { Metadata } from "next";
import "./globals.css";
import "./login.css";
import "./links.css";
import "./apple.css";
import "./insights.css";
export const metadata: Metadata = { title:"ARRA Hub", description:"One clear view across ARRA Studios and Squatch Media." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
