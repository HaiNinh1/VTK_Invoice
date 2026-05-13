import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import AppShell from './app/AppShell.tsx';
import { AuthProvider } from './lib/auth/AuthProvider.tsx';
import { QueryProvider } from './app/QueryProvider.tsx';
import './styles/index.css';
import { Toaster } from './app/components/ui/sonner.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>
          <AppShell />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </BrowserRouter>
);
