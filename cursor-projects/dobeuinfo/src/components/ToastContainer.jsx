import { createPortal } from 'react-dom'
import Toast from './Toast'

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>,
    document.body
  )
}

export default ToastContainer

