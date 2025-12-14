import { Link } from 'react-router-dom'

function ReviewCard({ review }) {
  if (!review) return null

  const { id, title, toolName, painPoint, verdict } = review

  return (
    <article className="review-card">
      <div className="review-card-header">
        <h2 className="review-card-title">
          <Link to={`/reviews/${id}`}>{title || toolName}</Link>
        </h2>
        {verdict?.status && (
          <span className={`verdict-badge verdict-${verdict.status}`}>
            {verdict.status}
          </span>
        )}
      </div>
      {painPoint && (
        <p className="review-card-pain-point">{painPoint}</p>
      )}
      {verdict?.text && (
        <p className="review-card-verdict">
          {verdict.text.length > 150 
            ? `${verdict.text.substring(0, 150)}...` 
            : verdict.text}
        </p>
      )}
      <div className="review-card-footer">
        <Link to={`/reviews/${id}`} className="review-card-link">
          Read Full Review →
        </Link>
      </div>
    </article>
  )
}

export default ReviewCard

