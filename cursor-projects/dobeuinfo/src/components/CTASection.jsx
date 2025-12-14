import { Link } from 'react-router-dom'

function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-readers">
        <h2 className="cta-title">For Readers</h2>
        <p className="cta-text">Explore reviews. Compare solutions. Skip the regret.</p>
        <Link to="/reviews" className="cta-button">
          Browse Reviews
        </Link>
      </div>
      <div className="cta-vendors">
        <h2 className="cta-title">For Vendors / Builders</h2>
        <p className="cta-text">
          Building something useful?
        </p>
        <p className="cta-text">
          Submit your product for an honest trial. If it works, it shows. If it doesn't, you'll know why.
        </p>
        <Link to="/submit" className="cta-button">
          Submit Your Product
        </Link>
      </div>
    </section>
  )
}

export default CTASection

