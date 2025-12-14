import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import Loading from '../components/Loading'
import ReviewFramework from '../components/ReviewFramework'
import { getReview } from '../services/api'

function ReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true)
        const data = await getReview(id)
        if (!data) {
          setError('Review not found')
        } else {
          setReview(data)
          setError(null)
        }
      } catch (err) {
        setError('Failed to load review. Please try again later.')
        console.error('Error fetching review:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReview()
    }
  }, [id])

  if (loading) {
    return (
      <>
        <SEO
          title="Loading Review | Dobeu Tech Solutions"
          description="Loading software review..."
        />
        <Loading message="Loading review..." />
      </>
    )
  }

  if (error || !review) {
    return (
      <>
        <SEO
          title="Review Not Found | Dobeu Tech Solutions"
          description="The review you're looking for doesn't exist."
        />
        <div className="review-detail-page">
          <div className="review-detail-container">
            <div className="alert alert-error">
              <p>{error || 'Review not found'}</p>
            </div>
            <div className="review-actions">
              <Link to="/reviews" className="btn-primary">
                Browse All Reviews
              </Link>
              <button onClick={() => navigate(-1)} className="btn-secondary">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title={`${review.title || review.toolName} Review | Dobeu Tech Solutions`}
        description={review.verdict?.text || review.painPoint || 'Software review'}
      />
      <div className="review-detail-page">
        <div className="review-detail-container">
          <div className="review-detail-nav">
            <Link to="/reviews" className="back-link">
              ← Back to Reviews
            </Link>
          </div>
          <ReviewFramework review={review} />
        </div>
      </div>
    </>
  )
}

export default ReviewDetailPage

