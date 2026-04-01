import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import axios from 'axios'
import './index.css'

axios.defaults.baseURL = import.meta.env.PROD ? 'http://146.190.230.28:5000' : '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
