// Validation utilities

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates required field
 * @param {string} value - Value to check
 * @returns {boolean} - True if not empty
 */
export const isRequired = (value) => {
  return value && value.trim().length > 0
}

/**
 * Validates form data for product submission
 * @param {Object} formData - Form data object
 * @returns {Object} - Object with errors (empty if valid)
 */
export const validateSubmissionForm = (formData) => {
  const errors = {}

  if (!isRequired(formData.companyName)) {
    errors.companyName = 'Company/Product name is required'
  }

  if (!isRequired(formData.productUrl)) {
    errors.productUrl = 'Product URL is required'
  } else if (!isValidUrl(formData.productUrl)) {
    errors.productUrl = 'Please enter a valid URL'
  }

  if (!isRequired(formData.contactEmail)) {
    errors.contactEmail = 'Contact email is required'
  } else if (!isValidEmail(formData.contactEmail)) {
    errors.contactEmail = 'Please enter a valid email address'
  }

  if (!isRequired(formData.description)) {
    errors.description = 'Brief description is required'
  }

  if (!isRequired(formData.painPoints)) {
    errors.painPoints = 'Pain points addressed is required'
  }

  if (!formData.stage) {
    errors.stage = 'Please select current stage'
  }

  return errors
}

