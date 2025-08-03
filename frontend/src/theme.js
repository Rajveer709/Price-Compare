import { extendTheme } from '@chakra-ui/react';
import { keyframes } from '@chakra-ui/system';
import { mode } from '@chakra-ui/theme-tools';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
};

const styles = {
  global: (props) => ({
    'html, body, #root': {
      height: '100%',
      width: '100%',
      margin: 0,
      padding: 0,
      bg: mode('white', 'gray.900')(props),
      color: mode('gray.800', 'whiteAlpha.900')(props),
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
      transition: 'background-color 0.2s, color 0.2s',
      scrollBehavior: 'smooth',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '::selection': {
      bg: mode('brand.100', 'brand.900')(props),
      color: mode('brand.700', 'brand.100')(props),
    },
    '::-webkit-scrollbar': {
      width: '10px',
      height: '10px',
    },
    '::-webkit-scrollbar-track': {
      bg: mode('gray.100', 'gray.800')(props),
    },
    '::-webkit-scrollbar-thumb': {
      bg: mode('gray.300', 'gray.600')(props),
      borderRadius: 'full',
      border: '2px solid',
      borderColor: mode('gray.100', 'gray.800')(props),
      '&:hover': {
        bg: mode('gray.400', 'gray.500')(props),
      },
    },
    'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
      WebkitBoxShadow: `0 0 0 30px ${mode('#fff', '#1a202c')(props)} inset !important`,
      WebkitTextFillColor: mode('gray.800', 'white')(props),
      caretColor: mode('gray.800', 'white')(props),
    },
  }),
};

const components = {
  Container: {
    baseStyle: (props) => ({
      maxW: 'container.xl',
      px: { base: 4, md: 6, lg: 8 },
      py: 8,
      animation: 'fadeIn 0.3s ease-out',
    }),
  },
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
      transition: 'all 0.2s',
      _focus: {
        ring: '2px',
        ringColor: 'brand.500',
        ringOffset: '2px',
      },
    },
    variants: {
      solid: (props) => ({
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          transform: 'translateY(-1px)',
          boxShadow: 'sm',
          _disabled: {
            bg: 'brand.500',
            transform: 'none',
          },
        },
        _active: {
          bg: 'brand.700',
          transform: 'translateY(0)',
        },
      }),
      ghost: (props) => ({
        color: mode('gray.700', 'whiteAlpha.900')(props),
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.200')(props),
          transform: 'translateY(-1px)',
        },
        _active: {
          bg: mode('gray.200', 'whiteAlpha.300')(props),
          transform: 'translateY(0)',
        },
      }),
    },
  },
  Card: {
    baseStyle: (props) => ({
      container: {
        bg: mode('white', 'gray.800')(props),
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: mode('gray.200', 'gray.700')(props),
        boxShadow: 'sm',
        transition: 'all 0.2s',
        _hover: {
          boxShadow: 'lg',
          transform: 'translateY(-2px)',
        },
      },
    }),
    variants: {
      elevated: (props) => ({
        container: {
          bg: mode('white', 'gray.700')(props),
          boxShadow: 'lg',
        },
      }),
    },
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
    variants: {
      filled: (props) => ({
        field: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
          _hover: {
            bg: mode('gray.200', 'whiteAlpha.200')(props),
          },
          _focus: {
            bg: 'transparent',
            borderColor: 'brand.500',
          },
        },
      }),
    },
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
    variants: {
      filled: (props) => ({
        bg: mode('gray.100', 'whiteAlpha.100')(props),
        _hover: {
          bg: mode('gray.200', 'whiteAlpha.200')(props),
        },
        _focus: {
          bg: 'transparent',
          borderColor: 'brand.500',
        },
      }),
    },
  },
  Link: {
    baseStyle: (props) => ({
      color: 'brand.500',
      _hover: {
        textDecoration: 'none',
        color: 'brand.600',
      },
    }),
  },
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  shadows: {
    outline: '0 0 0 3px var(--chakra-colors-brand-500)',
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
    mono: `'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: '2',
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  radii: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  zIndices: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  transitions: {
    property: {
      common: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      transform: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
  },
  layerStyles: {
    card: {
      bg: 'white',
      _dark: {
        bg: 'gray.800',
      },
      boxShadow: 'md',
      rounded: 'xl',
      p: 6,
      transition: 'all 0.2s',
      _hover: {
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      },
    },
    'card-elevated': {
      bg: 'white',
      _dark: {
        bg: 'gray.800',
      },
      boxShadow: 'lg',
      rounded: 'xl',
      p: 6,
      transition: 'all 0.2s',
      _hover: {
        transform: 'translateY(-3px)',
        boxShadow: 'xl',
      },
    },
  },
  textStyles: {
    h1: {
      fontSize: { base: '2.25rem', md: '3rem', lg: '3.75rem' },
      fontWeight: 'bold',
      lineHeight: '1.1',
      letterSpacing: '-0.025em',
      mb: 6,
    },
    h2: {
      fontSize: { base: '1.875rem', md: '2.25rem' },
      fontWeight: 'bold',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      mb: 5,
    },
    h3: {
      fontSize: { base: '1.5rem', md: '1.875rem' },
      fontWeight: 'semibold',
      lineHeight: '1.25',
      letterSpacing: '-0.015em',
      mb: 4,
    },
    h4: {
      fontSize: { base: '1.25rem', md: '1.5rem' },
      fontWeight: 'semibold',
      lineHeight: '1.25',
      mb: 3,
    },
    subtitle: {
      fontSize: { base: '1rem', md: '1.125rem' },
      fontWeight: 'normal',
      color: 'gray.600',
      _dark: {
        color: 'gray.400',
      },
      lineHeight: '1.5',
      mb: 4,
    },
  },
  styles: {
    global: (props) => ({
      'html, body, #root': {
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        bg: mode('white', 'gray.900')(props),
        color: mode('gray.800', 'whiteAlpha.900')(props),
        fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
        transition: 'background-color 0.2s, color 0.2s',
        scrollBehavior: 'smooth',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        bg: mode('brand.100', 'brand.900')(props),
        color: mode('brand.700', 'brand.100')(props),
      },
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        bg: mode('gray.100', 'gray.800')(props),
      },
      '::-webkit-scrollbar-thumb': {
        bg: mode('gray.300', 'gray.600')(props),
        borderRadius: 'full',
        border: '2px solid',
        borderColor: mode('gray.100', 'gray.800')(props),
        '&:hover': {
          bg: mode('gray.400', 'gray.500')(props),
        },
      },
      'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
        WebkitBoxShadow: `0 0 0 30px ${mode('#fff', '#1a202c')(props)} inset !important`,
        WebkitTextFillColor: mode('gray.800', 'white')(props),
        caretColor: mode('gray.800', 'white')(props),
      },
    }),
  },
});

export default theme;
