import { useState } from 'react'
import SEO from '../components/SEO'
import { CONTACT_EMAIL } from '../utils/constants'
import { isValidEmail } from '../utils/validation'

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
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

    // Create mailto link (can be replaced with API call later)
    const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}`
    
    try {
      window.location.href = mailtoLink
      setStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <>
      <SEO
        title="Contact Us | Dobeu Tech Solutions"
        description="Get in touch with Dobeu Tech Solutions. Questions, feedback, or partnership inquiries."
      />
      <div className="contact-page">
        <div className="contact-container">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-intro">
            Have questions, feedback, or want to discuss a partnership? We'd love to hear from you.
          </p>

          <div className="contact-content">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                For general inquiries, product submissions, or business partnerships, 
                please use the form or reach out directly.
              </p>
              <div className="contact-details">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a href="https://dobeu.net" target="_blank" rel="noopener noreferrer">
                    dobeu.net
                  </a>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              {status === 'success' && (
                <div className="alert alert-success">
                  <p>Thank you for your message! We'll get back to you soon.</p>
                </div>
              )}

              {status === 'error' && (
                <div className="alert alert-error">
                  <p>Something went wrong. Please try again or email us directly.</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="subject">
                  Subject <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={errors.subject ? 'error' : ''}
                  required
                />
                {errors.subject && <span className="error-message">{errors.subject}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className={errors.message ? 'error' : ''}
                  required
                />
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactPage

