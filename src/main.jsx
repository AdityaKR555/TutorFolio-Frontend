import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PlatformDialog from './components/PlatformDialog.jsx'
import { BrowserRouter } from 'react-router-dom'
import './style.css'
import './components/mobile-platform.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <PlatformDialog />
    </BrowserRouter>
  </StrictMode>,
)
