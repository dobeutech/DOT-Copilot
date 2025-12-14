import React from 'react';
import './Text.css';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'heading' | 'subheading' | 'caption';
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  bold = false,
  align = 'left',
  className = '',
  ...props
}) => {
  const Tag = variant === 'heading' ? 'h1' : variant === 'subheading' ? 'h2' : 'p';
  
  const classes = [
    'text',
    `text-${variant}`,
    bold && 'text-bold',
    `text-${align}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

