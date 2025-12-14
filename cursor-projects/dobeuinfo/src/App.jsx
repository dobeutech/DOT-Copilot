import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import ToastContainer from './components/ToastContainer'
import { ToastProvider, useToastContext } from './contexts/ToastContext'
import HomePage from './pages/HomePage'
import ReviewsPage from './pages/ReviewsPage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import SubmissionPage from './pages/SubmissionPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

function AppContent() {
  const toast = useToastContext()

  return (
    <Layout>
      <ScrollToTop />
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />
        <Route path="/submit" element={<SubmissionPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App

