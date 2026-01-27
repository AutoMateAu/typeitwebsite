import React from 'react'
import ReactDOM from 'react-dom/client'
import GradientBackground from './components/ui/GradientBackground'

// Mount gradient background to the gradient-bg element if it exists
const gradientElement = document.getElementById('gradient-root')
if (gradientElement) {
  ReactDOM.createRoot(gradientElement).render(
    <React.StrictMode>
      <GradientBackground />
    </React.StrictMode>
  )
}
