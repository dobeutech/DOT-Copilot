import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Loading from '../components/Loading'
import { getReviews } from '../services/api'

function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const data = await getReviews()
        setReviews(data)
        setError(null)
      } catch (err) {
        setError('Failed to load reviews. Please try again later.')
        console.error('Error fetching reviews:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (loading) {
    return (
      <>
        <SEO
          title="Software Reviews | Dobeu Tech Solutions"
          description="Browse our collection of honest, independent software reviews based on real-world testing."
        />
        <Loading message="Loading reviews..." />
      </>
    )
  }

  if (error) {
    return (
      <>
        <SEO
          title="Software Reviews | Dobeu Tech Solutions"
          description="Browse our collection of honest, independent software reviews based on real-world testing."
        />
        <div className="reviews-page">
          <div className="reviews-container">
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Software Reviews | Dobeu Tech Solutions"
        description="Browse our collection of honest, independent software reviews based on real-world testing."
      />
      <div className="reviews-page">
        <div className="reviews-container">
          <h1 className="page-title">Software Reviews</h1>
          <p className="page-intro">
            Real-world testing, honest results. No vendor bias, no marketing fluff.
          </p>

          {reviews.length === 0 ? (
            <div className="empty-state">
              <h2>No Reviews Yet</h2>
              <p>We're currently testing products and preparing reviews. Check back soon!</p>
              <Link to="/submit" className="btn-primary">
                Submit Your Product
              </Link>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-card-header">
                    <h2 className="review-card-title">
                      <Link to={`/reviews/${review.id}`}>{review.title || review.toolName}</Link>
                    </h2>
                    {review.verdict?.status && (
                      <span className={`verdict-badge verdict-${review.verdict.status}`}>
                        {review.verdict.status}
                      </span>
                    )}
                  </div>
                  {review.painPoint && (
                    <p className="review-card-pain-point">{review.painPoint}</p>
                  )}
                  {review.verdict?.text && (
                    <p className="review-card-verdict">{review.verdict.text.substring(0, 150)}...</p>
                  )}
                  <div className="review-card-footer">
                    <Link to={`/reviews/${review.id}`} className="review-card-link">
                      Read Full Review →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ReviewsPage

