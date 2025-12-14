function Differentiators() {
  const points = [
    "Real trials, not feature lists",
    "Pain-point–first reviews (not vendor-first)",
    "Established tools and overlooked upstarts",
    "Transparent failures included",
    "Zero cost to readers"
  ]

  return (
    <section className="differentiators">
      <h2 className="section-title">What Makes This Different</h2>
      <ul className="differentiators-list">
        {points.map((point, index) => (
          <li key={index} className="differentiator-item">
            {point}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Differentiators

