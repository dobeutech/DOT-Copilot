import { useState } from 'react'
import SEO from '../components/SEO'

function SubmissionPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    productUrl: '',
    contactEmail: '',
    description: '',
    painPoints: '',
    stage: '',
    demoVideo: ''
  })
  const [status, setStatus] = useState(null) // 'success', 'error', or null
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company/Product name is required'
    }
    if (!formData.productUrl.trim()) {
      newErrors.productUrl = 'Product URL is required'
    } else if (!/^https?:\/\/.+/.test(formData.productUrl)) {
      newErrors.productUrl = 'Please enter a valid URL'
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Brief description is required'
    }
    if (!formData.painPoints.trim()) {
      newErrors.painPoints = 'Pain points addressed is required'
    }
    if (!formData.stage) {
      newErrors.stage = 'Please select current stage'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setStatus('submitting')
    
    // TODO: Replace with actual submission endpoint
    // For now, simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus('success')
      setFormData({
        companyName: '',
        productUrl: '',
        contactEmail: '',
        description: '',
        painPoints: '',
        stage: '',
        demoVideo: ''
      })
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <>
      <SEO 
        title="Submit Your Product | Dobeu Tech Solutions"
        description="Submit your software product for an honest, independent trial. Real-world testing, transparent results."
      />
      <div className="submission-page">
        <div className="submission-container">
          <h1 className="page-title">Submit Your Product for Review</h1>
          <p className="page-intro">
            Building something useful? We'll test it in real-world scenarios and provide honest feedback. 
            If it works, it shows. If it doesn't, you'll know why.
          </p>

          {status === 'success' && (
            <div className="alert alert-success">
              <p>Thank you for your submission! We'll review your product and get back to you soon.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error">
              <p>Something went wrong. Please try again or contact us directly.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="submission-form">
            <div className="form-group">
              <label htmlFor="companyName">
                Company/Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={errors.companyName ? 'error' : ''}
                required
              />
              {errors.companyName && <span className="error-message">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="productUrl">
                Product URL <span className="required">*</span>
              </label>
              <input
                type="url"
                id="productUrl"
                name="productUrl"
                value={formData.productUrl}
                onChange={handleChange}
                placeholder="https://example.com"
                className={errors.productUrl ? 'error' : ''}
                required
              />
              {errors.productUrl && <span className="error-message">{errors.productUrl}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">
                Contact Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className={errors.contactEmail ? 'error' : ''}
                required
              />
              {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Brief Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={errors.description ? 'error' : ''}
                required
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="painPoints">
                Pain Points Addressed <span className="required">*</span>
              </label>
              <textarea
                id="painPoints"
                name="painPoints"
                value={formData.painPoints}
                onChange={handleChange}
                rows="3"
                placeholder="What business problems does your product solve?"
                className={errors.painPoints ? 'error' : ''}
                required
              />
              {errors.painPoints && <span className="error-message">{errors.painPoints}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stage">
                Current Stage <span className="required">*</span>
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className={errors.stage ? 'error' : ''}
                required
              >
                <option value="">Select stage...</option>
                <option value="beta">Beta</option>
                <option value="launched">Launched</option>
                <option value="early-access">Early Access</option>
                <option value="pre-launch">Pre-Launch</option>
              </select>
              {errors.stage && <span className="error-message">{errors.stage}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="demoVideo">
                Demo Video Link (Optional)
              </label>
              <input
                type="url"
                id="demoVideo"
                name="demoVideo"
                value={formData.demoVideo}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default SubmissionPage

