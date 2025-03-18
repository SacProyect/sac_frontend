import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { router } from './App.jsx'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position='top-right'/>
    <RouterProvider router={router} />
  </StrictMode>,
)
