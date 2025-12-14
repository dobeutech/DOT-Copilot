import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from '../components/Text';

describe('Text Component', () => {
  it('renders with children', () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders as h1 for heading variant', () => {
    render(<Text variant="heading">Heading</Text>);
    const element = screen.getByText('Heading');
    expect(element.tagName).toBe('H1');
  });

  it('renders as h2 for subheading variant', () => {
    render(<Text variant="subheading">Subheading</Text>);
    const element = screen.getByText('Subheading');
    expect(element.tagName).toBe('H2');
  });

  it('renders as p for body variant', () => {
    render(<Text variant="body">Body text</Text>);
    const element = screen.getByText('Body text');
    expect(element.tagName).toBe('P');
  });

  it('applies bold class when bold prop is true', () => {
    render(<Text bold>Bold text</Text>);
    expect(screen.getByText('Bold text')).toHaveClass('text-bold');
  });

  it('applies alignment class', () => {
    render(<Text align="center">Centered</Text>);
    expect(screen.getByText('Centered')).toHaveClass('text-center');
  });
});

