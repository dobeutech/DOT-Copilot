import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Text } from '../components';
import './ResetPassword.css';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      // Error is handled by store
    }
  };

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <Text variant="heading" align="center">
            Check Your Email
          </Text>
          <Text variant="body" align="center" className="success-message">
            We've sent a password reset link to {email}
          </Text>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/')}
            className="back-button"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <Text variant="heading" align="center">
          Reset Password
        </Text>
        <Text variant="body" align="center" className="reset-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <form onSubmit={handleSubmit} className="reset-form">
          {error && (
            <div className="reset-error">
              <Text variant="caption" className="error-text">
                {error}
              </Text>
            </div>
          )}

          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="reset-submit-button"
          >
            Send Reset Link
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate('/')}
            className="back-button"
          >
            Back to Login
          </Button>
        </form>
      </div>
    </div>
  );
};

