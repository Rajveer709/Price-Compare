import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Extend the theme to include custom colors, fonts, etc.
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7f7',
      100: '#b3e6e6',
      200: '#80d4d4',
      300: '#4dc3c3',
      400: '#26b0b0',
      500: '#009d9d',
      600: '#008b8b',
      700: '#007373',
      800: '#005c5c',
      900: '#004545',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      'html, body': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
    },
  },
});

// Create root and render the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>
);
