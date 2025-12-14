import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found | Dobeu Tech Solutions"
        description="The page you're looking for doesn't exist."
      />
      <div className="not-found-page">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-message">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn-primary">
              Go to Homepage
            </Link>
            <Link to="/submit" className="btn-secondary">
              Submit a Product
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage

