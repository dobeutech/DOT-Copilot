import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Loading from '../components/Loading'
import { getReviews } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'

function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const debouncedSearch = useDebounce(searchQuery, 300)

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

  const filteredReviews = useMemo(() => {
    let filtered = reviews

    // Filter by search query
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (review) =>
          (review.title || review.toolName || '').toLowerCase().includes(query) ||
          (review.painPoint || '').toLowerCase().includes(query) ||
          (review.verdict?.text || '').toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (review) => review.verdict?.status === filterStatus
      )
    }

    return filtered
  }, [reviews, debouncedSearch, filterStatus])

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

          {reviews.length > 0 && (
            <div className="reviews-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-box">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Reviews</option>
                  <option value="approved">Approved</option>
                  <option value="recommended">Recommended</option>
                  <option value="neutral">Neutral</option>
                  <option value="not-recommended">Not Recommended</option>
                </select>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state">
              <h2>No Reviews Yet</h2>
              <p>We're currently testing products and preparing reviews. Check back soon!</p>
              <Link to="/submit" className="btn-primary">
                Submit Your Product
              </Link>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="empty-state">
              <h2>No Reviews Found</h2>
              <p>Try adjusting your search or filter criteria.</p>
              {(debouncedSearch || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((review) => (
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

