# Price Comparison App

A React application built with Vite for comparing prices across different platforms.

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm (v7 or later) or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for deployment on Netlify.

### Deploy to Netlify

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Log in to your [Netlify](https://app.netlify.com/) account
3. Click on "Add new site" > "Import an existing project"
4. Select your repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Environment Variables

If your application requires environment variables, add them in the Netlify site settings under "Site settings" > "Build & deploy" > "Environment".

## Development

This project uses:
- React 18
- Vite
- Tailwind CSS
- Framer Motion
