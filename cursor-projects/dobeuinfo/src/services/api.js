// API service layer
// TODO: Implement actual API endpoints when backend is ready

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Submit a product for review
 * @param {Object} formData - Product submission data
 * @returns {Promise<Object>} - Response from API
 */
export const submitProduct = async (formData) => {
  // TODO: Replace with actual API call
  // For now, simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success
      resolve({
        success: true,
        message: 'Product submitted successfully',
        id: Date.now().toString(),
      })
      
      // Uncomment to simulate error
      // reject(new Error('Failed to submit product'))
    }, 1000)
  })

  // When ready, uncomment and implement:
  /*
  try {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error('Failed to submit product')
    }

    return await response.json()
  } catch (error) {
    throw new Error(error.message || 'Failed to submit product')
  }
  */
}

/**
 * Get all product reviews
 * @returns {Promise<Array>} - List of reviews
 */
export const getReviews = async () => {
  // TODO: Implement when backend is ready
  return Promise.resolve([])
}

/**
 * Get a single review by ID
 * @param {string} id - Review ID
 * @returns {Promise<Object>} - Review data
 */
export const getReview = async (id) => {
  // TODO: Implement when backend is ready
  return Promise.resolve(null)
}

