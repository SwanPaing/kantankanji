import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
<<<<<<< HEAD
import { ErrorBoundary } from './ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
=======

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
>>>>>>> 5db5a9378ee347600fc6d98b99866292a8ce424d
  </StrictMode>,
)
