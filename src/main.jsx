import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import WebsiteHostBoundary from './components/WebsiteHostBoundary.jsx'
import PlatformDialog from './components/PlatformDialog.jsx'
import { BrowserRouter } from 'react-router-dom'
import './style.css'
import './components/mobile-platform.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <WebsiteHostBoundary><App /></WebsiteHostBoundary>
      <PlatformDialog />
    </BrowserRouter>
  </StrictMode>,
)
