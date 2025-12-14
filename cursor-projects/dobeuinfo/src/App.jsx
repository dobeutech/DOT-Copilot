import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReviewsPage from './pages/ReviewsPage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import SubmissionPage from './pages/SubmissionPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />
        <Route path="/submit" element={<SubmissionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App

