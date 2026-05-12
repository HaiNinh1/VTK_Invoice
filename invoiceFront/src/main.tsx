import { createRoot } from 'react-dom/client';
import AppShell from './app/AppShell.tsx';
import { AuthProvider } from './lib/auth/AuthProvider.tsx';
import { QueryProvider } from './app/QueryProvider.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </QueryProvider>
);
