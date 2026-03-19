import { Poppins } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "STRIDE Dashboard",
  description: "Strategic Resource Inventory for Deployment Efficiency",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
