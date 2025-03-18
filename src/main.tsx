import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
<<<<<<< HEAD
import { RouterProvider } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import AppRouter from './components/router/AppRouter'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './components/errors/ErrorFallback.js'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position='top-right' />
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode >,
=======
import { router } from './App.jsx'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position='top-right'/>
    <RouterProvider router={router} />
  </StrictMode>,
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
)
