import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import AppRouter from './components/router/AppRouter'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './components/errors/ErrorFallback.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position='top-right' />
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode >,
)
