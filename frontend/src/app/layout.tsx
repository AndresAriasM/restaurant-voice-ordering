import './globals.css';

export const metadata = {
  title: 'Burger House - Voice Ordering',
  description: 'Order burgers with your voice',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}