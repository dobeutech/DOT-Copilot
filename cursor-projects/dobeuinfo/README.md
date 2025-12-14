# Dobeu.info

A platform for honest, independent software reviews and real-world product trials. Built with React, Vite, and modern web technologies.

## About

Dobeu.info provides transparent, unbiased software reviews based on real-world testing. We test products in actual business scenarios and provide honest feedback—no vendor bias, no sponsored content.

## Features

- **Homepage** with hero section, mission statement, and differentiators
- **Product Submission** form for companies to submit their products for review
- **SEO Optimized** with React Helmet for meta tags
- **Responsive Design** with modern CSS
- **React Router** for navigation
- **Clean Architecture** with component-based structure

## Tech Stack

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **React Router DOM 7** - Client-side routing
- **React Helmet Async** - SEO and meta tag management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
dobeuinfo/
├── public/           # Static assets
├── src/
│   ├── components/  # Reusable React components
│   │   ├── CTASection.jsx
│   │   ├── Differentiators.jsx
│   │   ├── Hero.jsx
│   │   ├── Layout.jsx
│   │   ├── MissionStatement.jsx
│   │   ├── ReviewFramework.jsx
│   │   └── SEO.jsx
│   ├── pages/       # Page components
│   │   ├── HomePage.jsx
│   │   └── SubmissionPage.jsx
│   ├── styles/       # Global styles
│   │   └── global.css
│   ├── App.jsx       # Main app component with routes
│   └── main.jsx      # Application entry point
├── index.html
├── vite.config.js
└── package.json
```

## Development

The development server runs on `http://localhost:5173` by default.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment

The `dist/` folder contains the production build. Deploy this folder to your hosting service:

- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions or deploy manually

## Contributing

This is a private project. For questions or suggestions, contact Jeremy Williams at jeremyw@dobeu.net.

## License

Copyright © 2025 Dobeu Tech Solutions. All rights reserved.

## Contact

- **Website**: https://dobeu.net
- **Email**: jeremyw@dobeu.net
- **Twitter**: @dobeutech

