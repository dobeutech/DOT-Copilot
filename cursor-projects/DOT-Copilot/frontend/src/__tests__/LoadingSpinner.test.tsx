import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Happy Path - All Props', () => {
    it('renders with all props provided', () => {
      render(
        <LoadingSpinner 
          size="large" 
          fullScreen={true} 
          message="Loading data..." 
        />
      );
      
      const spinner = screen.getByText('Loading data...').closest('.loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('full-screen');
      expect(screen.getByText('Loading data...')).toHaveClass('loading-message');
    });

    it('renders with default props', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).not.toHaveClass('full-screen');
    });
  });

  describe('Size Variants', () => {
    it('renders small size spinner', () => {
      render(<LoadingSpinner size="small" />);
      
      const spinner = document.querySelector('.spinner-small');
      expect(spinner).toBeInTheDocument();
    });

    it('renders medium size spinner (default)', () => {
      render(<LoadingSpinner size="medium" />);
      
      const spinner = document.querySelector('.spinner-medium');
      expect(spinner).toBeInTheDocument();
    });

    it('renders large size spinner', () => {
      render(<LoadingSpinner size="large" />);
      
      const spinner = document.querySelector('.spinner-large');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Full Screen Mode', () => {
    it('applies full-screen class when fullScreen is true', () => {
      render(<LoadingSpinner fullScreen={true} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toHaveClass('full-screen');
    });

    it('does not apply full-screen class when fullScreen is false', () => {
      render(<LoadingSpinner fullScreen={false} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).not.toHaveClass('full-screen');
    });

    it('does not apply full-screen class by default', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).not.toHaveClass('full-screen');
    });
  });

  describe('Message Display', () => {
    it('displays message when provided', () => {
      const message = 'Please wait while we load your data';
      render(<LoadingSpinner message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(message)).toHaveClass('loading-message');
    });

    it('does not display message when not provided', () => {
      render(<LoadingSpinner />);
      
      const message = document.querySelector('.loading-message');
      expect(message).not.toBeInTheDocument();
    });

    it('handles empty string message', () => {
      render(<LoadingSpinner message="" />);
      
      const message = document.querySelector('.loading-message');
      expect(message).not.toBeInTheDocument();
    });
  });

  describe('Spinner Rings', () => {
    it('renders four spinner rings', () => {
      render(<LoadingSpinner />);
      
      const rings = document.querySelectorAll('.spinner-ring');
      expect(rings).toHaveLength(4);
    });

    it('spinner rings are within spinner container', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.spinner');
      const rings = spinner?.querySelectorAll('.spinner-ring');
      expect(rings).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles null message gracefully', () => {
      render(<LoadingSpinner message={null as any} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
      
      const message = document.querySelector('.loading-message');
      expect(message).not.toBeInTheDocument();
    });

    it('handles undefined message gracefully', () => {
      render(<LoadingSpinner message={undefined} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
      
      const message = document.querySelector('.loading-message');
      expect(message).not.toBeInTheDocument();
    });

    it('handles very long message text', () => {
      const longMessage = 'A'.repeat(500);
      render(<LoadingSpinner message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in message', () => {
      const specialMessage = '<script>alert("xss")</script> & "quotes" \'apostrophes\'';
      render(<LoadingSpinner message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('spinner container has appropriate structure', () => {
      render(<LoadingSpinner message="Loading..." />);
      
      const container = document.querySelector('.loading-spinner');
      expect(container).toBeInTheDocument();
      
      const spinner = container?.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('message is readable by screen readers', () => {
      render(<LoadingSpinner message="Loading your content" />);
      
      const message = screen.getByText('Loading your content');
      expect(message).toBeVisible();
    });

    it('maintains semantic HTML structure', () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);
      
      const paragraph = container.querySelector('p.loading-message');
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Component Combinations', () => {
    it('renders small spinner with full screen', () => {
      render(<LoadingSpinner size="small" fullScreen={true} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toHaveClass('full-screen');
      expect(document.querySelector('.spinner-small')).toBeInTheDocument();
    });

    it('renders large spinner with message', () => {
      render(<LoadingSpinner size="large" message="Processing..." />);
      
      expect(document.querySelector('.spinner-large')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders full screen with message', () => {
      render(<LoadingSpinner fullScreen={true} message="Please wait" />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toHaveClass('full-screen');
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });
  });

  describe('Rendering Consistency', () => {
    it('renders consistently across multiple instances', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      expect(document.querySelector('.spinner-small')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="large" />);
      expect(document.querySelector('.spinner-large')).toBeInTheDocument();
      expect(document.querySelector('.spinner-small')).not.toBeInTheDocument();
    });

    it('maintains structure when props change', () => {
      const { rerender } = render(<LoadingSpinner message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      rerender(<LoadingSpinner message="Almost done..." />);
      expect(screen.getByText('Almost done...')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
