import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- Google Analytics ---
const GA_MEASUREMENT_ID = 'G-22W3B2H1HD'

// Insertar script gtag.js
const script = document.createElement('script')
script.async = true
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
document.head.appendChild(script)

// Inicializar GA
window.dataLayer = window.dataLayer || []
function gtag(){ window.dataLayer.push(arguments) }
window.gtag = gtag
gtag('js', new Date())
gtag('config', GA_MEASUREMENT_ID)

// --- Render principal ---
createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <App />
  //</StrictMode>,
)