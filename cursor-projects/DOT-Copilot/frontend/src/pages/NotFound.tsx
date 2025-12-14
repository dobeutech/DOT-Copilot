import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text } from '../components';
import './NotFound.css';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <Text variant="heading" align="center" className="not-found-title">
          404
        </Text>
        <Text variant="subheading" align="center" className="not-found-subtitle">
          Page Not Found
        </Text>
        <Text variant="body" align="center" className="not-found-message">
          The page you're looking for doesn't exist.
        </Text>
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          className="not-found-button"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

