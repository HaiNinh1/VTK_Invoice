import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RoleProvider } from '@/context/RoleContext'
import { ToastProvider } from '@/components/ui/toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>,
)
