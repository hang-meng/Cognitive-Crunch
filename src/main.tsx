import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 注册 PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      () => console.log('SW registered'),
      (err) => console.log('SW registration failed:', err)
    )
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
