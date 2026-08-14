import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dictionaryText from '../public/dictionary.txt?raw'
import { dictionary } from './game/dictionary'
import App from './App'
import './index.css'

dictionary.loadFromText(dictionaryText)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
