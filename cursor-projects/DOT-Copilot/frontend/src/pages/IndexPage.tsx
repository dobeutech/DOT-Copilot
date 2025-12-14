import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Text } from '../components';
import './IndexPage.css';

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/driver-dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="index-page">
      <div className="index-container">
        <Text variant="heading" align="center" className="index-title">
          Welcome
        </Text>
        <Text variant="body" align="center" className="index-subtitle">
          Sign in to continue
        </Text>

        <form onSubmit={handleSubmit} className="index-form">
          {error && (
            <div className="index-error">
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

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="index-submit-button"
          >
            Sign In
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate('/reset-pw')}
            className="index-reset-button"
          >
            Forgot Password?
          </Button>
        </form>
      </div>
    </div>
  );
};

