import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.tsx'

window.addEventListener('error', (e) => { (window as any).__ERR = ((window as any).__ERR || '') + '\n' + e.message + ' ' + String(e.error?.stack).slice(0, 800) })
window.addEventListener('unhandledrejection', (e) => { (window as any).__ERR = ((window as any).__ERR || '') + '\nREJ ' + String(e.reason?.stack || e.reason).slice(0, 800) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
