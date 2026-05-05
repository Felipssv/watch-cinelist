import './styles/default_shadcn_theme.css'
import './styles/globals.css'
import './styles/theme.css'
import './styles/fonts.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
