import { createRoot } from 'react-dom/client'
import './styles/base.css'
import { TodosToday } from './screens/todos-today/todos-today.tsx'

createRoot(document.getElementById('root')!).render(<TodosToday />)
