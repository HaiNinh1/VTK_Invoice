import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RoleProvider } from '@/context/RoleContext'
import { ToastProvider } from '@/components/ui/toast'
import { ContractsProvider } from '@/context/ContractsContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { InvoiceTypesProvider } from '@/context/InvoiceTypesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <ToastProvider>
          <ContractsProvider>
            <InvoiceTypesProvider>
              <NotificationsProvider>
                <App />
              </NotificationsProvider>
            </InvoiceTypesProvider>
          </ContractsProvider>
        </ToastProvider>
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>,
)
