import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  fullScreen = false,
  message 
}) => {
  const spinner = (
    <div className={`loading-spinner ${fullScreen ? 'full-screen' : ''}`}>
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );

  return spinner;
};

