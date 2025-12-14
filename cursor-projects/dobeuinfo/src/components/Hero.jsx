const taglines = [
  "Software reviews without the sales breath.",
  "Tools tested in the real world, not slide decks.",
  "Independent trials for companies tired of guessing.",
  "Because marketing demos aren't reality."
]

function Hero() {
  const tagline = taglines[0] // Using first tagline, can be rotated later
  
  return (
    <section className="hero">
      <h1 className="hero-title">
        Dobeu Tech Solutions
      </h1>
      <p className="hero-subtitle">
        Honest Software Reviews & Real-World Trials
      </p>
      <p className="hero-tagline">
        {tagline}
      </p>
    </section>
  )
}

export default Hero

