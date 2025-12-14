import { Helmet } from 'react-helmet-async'
import { DEFAULT_SEO, APP_NAME } from '../utils/constants'

function SEO({ 
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  url = typeof window !== 'undefined' ? window.location.href : 'https://dobeu.info',
  type = "website",
  image = null,
  author = "Jeremy Williams"
}) {
  const fullTitle = title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`
  const ogImage = image || `${url}/og-image.jpg`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={ogImage} />}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
    </Helmet>
  )
}

export default SEO

