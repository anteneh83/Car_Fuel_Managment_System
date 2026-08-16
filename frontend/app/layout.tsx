import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'FFFDMS — Fleet Fuel Fraud Detection & Management System',
  description: 'Full-stack enterprise solution for detecting fuel theft, audit logging, and telemetry tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
