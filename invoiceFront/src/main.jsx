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
import { RequestsProvider } from '@/context/RequestsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <ToastProvider>
          <ContractsProvider>
            <InvoiceTypesProvider>
              <RequestsProvider>
                <NotificationsProvider>
                  <App />
                </NotificationsProvider>
              </RequestsProvider>
            </InvoiceTypesProvider>
          </ContractsProvider>
        </ToastProvider>
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>,
)
