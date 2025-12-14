import { Helmet } from 'react-helmet-async'

function SEO({ 
  title = "Dobeu Tech Solutions | Honest Software Reviews & Real-World Trials",
  description = "Software shouldn't feel like a gamble. Dobeu.info is a free, independent software review hub run by Jeremy Williams—a lifelong technologist with zero vendor bias. We break down real business pain points, evaluate top providers, surface underrated tools, and document hands-on trials so companies can make smarter decisions without marketing noise. Vendors and startups can also submit their products for transparent, real-world testing.",
  url = "https://dobeu.info",
  type = "website"
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}

export default SEO

