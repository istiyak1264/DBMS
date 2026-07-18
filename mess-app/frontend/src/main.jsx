import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './App.css'

// Performance monitoring
const reportWebVitals = (metric) => {
  // Send to analytics or monitoring service
  if (import.meta.env.PROD) {
    console.log('Web Vitals:', metric)
  }
}

// Error boundary for the entire app
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
reportWebVitals()