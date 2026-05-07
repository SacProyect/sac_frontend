import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast';
import AppRouter from './components/router/app-router'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './components/errors/error-fallback'
import { ThemeProvider } from '@/hooks/theme-provider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster position='top-right' />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AppRouter />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)

