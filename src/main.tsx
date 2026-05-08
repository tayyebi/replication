import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSimulation } from './store/simulationStore'

startSimulation()

createRoot(document.getElementById('root')!).render(<App />)
