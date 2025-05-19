import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import StudyNotes from './pages/StudyNotes'
import QuestionBank from './pages/QuestionBank'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/study-notes" replace />} />
        <Route path="study-notes" element={<StudyNotes />} />
        <Route path="question-bank" element={<QuestionBank />} />
      </Route>
    </Routes>
  )
}

export default App