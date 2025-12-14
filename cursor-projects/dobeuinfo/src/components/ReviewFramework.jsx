function ReviewFramework({ review }) {
  if (!review) {
    return null
  }

  const {
    title,
    toolName,
    painPoint,
    selectionCriteria,
    trialMethodology,
    verdict,
    pros,
    cons,
    useCaseRecommendations
  } = review

  return (
    <article className="review">
      <header className="review-header">
        <h1 className="review-title">{title || toolName}</h1>
      </header>

      <section className="review-section">
        <h2 className="review-section-title">Pain Point</h2>
        <p className="review-content">{painPoint}</p>
      </section>

      {selectionCriteria && (
        <section className="review-section">
          <h2 className="review-section-title">Why This Tool</h2>
          <p className="review-content">{selectionCriteria}</p>
        </section>
      )}

      {trialMethodology && (
        <section className="review-section">
          <h2 className="review-section-title">How We Tested</h2>
          <p className="review-content">{trialMethodology}</p>
        </section>
      )}

      <section className="review-section">
        <h2 className="review-section-title">Verdict</h2>
        <div className={`verdict verdict-${verdict?.status || 'neutral'}`}>
          <p className="review-content">{verdict?.text}</p>
        </div>
      </section>

      {(pros || cons) && (
        <section className="review-section">
          <div className="pros-cons">
            {pros && pros.length > 0 && (
              <div className="pros">
                <h3 className="pros-cons-title">Pros</h3>
                <ul className="pros-cons-list">
                  {pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {cons && cons.length > 0 && (
              <div className="cons">
                <h3 className="pros-cons-title">Cons</h3>
                <ul className="pros-cons-list">
                  {cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {useCaseRecommendations && (
        <section className="review-section">
          <h2 className="review-section-title">Best For</h2>
          <p className="review-content">{useCaseRecommendations}</p>
        </section>
      )}
    </article>
  )
}

export default ReviewFramework

