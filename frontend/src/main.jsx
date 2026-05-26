import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { TourProvider } from './context/TourContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TourProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TourProvider>
    </AuthProvider>
  </React.StrictMode>,
)
