import React, { useState } from 'react';
import { 
  ChakraProvider, 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Link, 
  IconButton,
  useColorMode, 
  useColorModeValue, 
  ColorModeScript, 
  CSSReset, 
  VStack,
  HStack
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import theme from './theme';
import ProductsPage from './pages/ProductsPage';
import HomePage from './pages/HomePage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Theme toggle component
function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = colorMode === 'light' ? MoonIcon : SunIcon;
  const text = colorMode === 'light' ? 'dark' : 'light';

  return (
    <IconButton
      size="md"
      fontSize="lg"
      aria-label={`Switch to ${text} mode`}
      variant="ghost"
      color={colorMode === 'light' ? 'gray.700' : 'whiteAlpha.900'}
      _hover={{
        bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200',
      }}
      onClick={toggleColorMode}
      icon={<SwitchIcon />}
    />
  );
}

// Navigation bar component with enhanced design
function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      as="nav" 
      position="fixed" 
      top={0} 
      left={0} 
      right={0} 
      bg={bg} 
      borderBottomWidth="1px" 
      borderColor={borderColor}
      zIndex={1000}
      px={4}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo/Brand */}
          <Flex alignItems="center">
            <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
              <Heading size="md" color={useColorModeValue('brand.500', 'brand.300')}>
                PriceCompare
              </Heading>
            </Link>
          </Flex>

          {/* Navigation Links */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Link 
              as={RouterLink} 
              to="/" 
              px={3} 
              py={2} 
              rounded="md"
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              _activeLink={{
                color: useColorModeValue('brand.500', 'brand.300'),
                fontWeight: 'semibold'
              }}
            >
              Home
            </Link>
            <Link 
              as={RouterLink} 
              to="/products" 
              px={3} 
              py={2} 
              rounded="md"
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              _activeLink={{
                color: useColorModeValue('brand.500', 'brand.300'),
                fontWeight: 'semibold'
              }}
            >
              Products
            </Link>
          </HStack>

          {/* Right side icons */}
          <HStack spacing={4}>
            <ThemeToggle />
            
            {/* Search icon */}
            <IconButton
              aria-label="Search"
              icon={<SearchIcon />}
              variant="ghost"
              size="md"
              onClick={() => document.getElementById('search-input')?.focus()}
            />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

// Error boundary fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box p={8} textAlign="center">
      <Heading size="lg" mb={4}>Something went wrong</Heading>
      <Text color="red.500" mb={4}>{error.message}</Text>
      <Button colorScheme="brand" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </Box>
  );
}

// Main App component
function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <CSSReset />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <NavBar />
            <Box as="main" pt={16} pb={8} minH="calc(100vh - 64px)">
              <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
                    direction={{ base: 'column', md: 'row' }} 
                    justify="space-between" 
                    align="center"
                    gap={4}
                  >
                    <Text 
                      color={useColorModeValue('gray.600', 'gray.400')}
                      textAlign={{ base: 'center', md: 'left' }}
                      fontSize="sm"
                    >
                      {new Date().getFullYear()} PriceCompare. All rights reserved.
                    </Text>
                    <Flex gap={6} wrap="wrap" justify={{ base: 'center', md: 'flex-end' }}>
                      {['Terms', 'Privacy', 'Contact'].map((item) => (
                        <Link 
                          key={item}
                          href="#" 
                          color={useColorModeValue('gray.600', 'gray.400')}
                          _hover={{ 
                            color: useColorModeValue('brand.500', 'brand.300'),
                            textDecoration: 'none',
                            transform: 'translateY(-1px)'
                          }}
                          transition="all 0.2s"
                          fontSize="sm"
                        >
                          {item}
                        </Link>
                      ))}
                    </Flex>
                  </Flex>
                </Container>
              </Box>
            </Box>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
