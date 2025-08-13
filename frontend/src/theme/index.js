import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    // Primary color (Blue)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb', // Main brand color
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a8a',
    },
    // Success/Green color
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981', // Main success color
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    // Warning/Amber color
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning color
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Gray scale
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
  },
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  styles: {
    global: (props) => ({
      'html, body': {
        bg: 'white',
        color: 'gray.800',
        minHeight: '100vh',
        fontSize: '16px',
        lineHeight: 'tall',
      },
      '*, *::before, &::after': {
        borderColor: 'gray.200',
      },
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: 'gray.100',
      },
      '::-webkit-scrollbar-thumb': {
        background: 'gray.400',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: 'gray.500',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        _focus: {
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.4)',
        },
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
            _disabled: {
              bg: 'primary.500',
              transform: 'none',
              boxShadow: 'none',
            },
          },
          _active: {
            bg: 'primary.700',
            transform: 'translateY(0)',
          },
        },
        outline: {
          border: '1px solid',
          borderColor: 'gray.300',
          _hover: {
            bg: 'gray.50',
            borderColor: 'gray.400',
          },
          _active: {
            bg: 'gray.100',
          },
        },
        ghost: {
          _hover: {
            bg: 'gray.100',
          },
          _active: {
            bg: 'gray.200',
          },
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'solid',
      },
    },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
          _hover: {
            boxShadow: 'md',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s',
          },
        },
      },
    },
  },
});

export default theme;
