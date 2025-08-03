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
  Fade,
  VStack,
  HStack,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { SearchIcon, BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
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
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const activeBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  
  // Navigation links
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Price Tracker', to: '/tracker' },
    { label: 'Deals', to: '/deals' },
  ];
  
  return (
    <Box 
      as="header"
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex="sticky"
      boxShadow="sm"
      backdropFilter="blur(10px)"
      transition="all 0.2s ease-in-out"
    >
      <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <Flex alignItems="center">
            <RouterLink to="/">
              <HStack spacing={2}>
                <Box 
                  bg="brand.500" 
                  color="white" 
                  p={1.5} 
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 9L12 16L21 9L12 2Z" fill="currentColor" />
                    <path d="M3 17L12 24L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 13L12 20L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <Heading 
                  size="lg" 
                  bgGradient="linear(to-r, brand.500, brand.600)"
                  bgClip="text"
                  fontWeight="bold"
                  letterSpacing="tighter"
                >
                  PriceCompare
                </Heading>
              </HStack>
            </RouterLink>
          </Flex>
          
          {/* Navigation Links */}
          <Flex 
            as="nav" 
            display={{ base: 'none', md: 'flex' }}
            alignItems="center" 
            gap={1}
          >
            {navItems.map((item) => (
              <RouterLink key={item.to} to={item.to}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    color={isActive ? 'brand.500' : color}
                    fontWeight={isActive ? 'semibold' : 'normal'}
                    _hover={{
                      bg: hoverBg,
                      transform: 'translateY(-1px)',
                    }}
                    _active={{
                      bg: activeBg,
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                    px={4}
                    py={6}
                    borderRadius="none"
                    borderBottom="2px solid"
                    borderColor={isActive ? 'brand.500' : 'transparent'}
                  >
                    {item.label}
                  </Button>
                )}
              </RouterLink>
            ))}
          </Flex>
          
          {/* Right side actions */}
          <Flex alignItems="center" gap={2}>
            <IconButton
              aria-label="Search products"
              icon={<SearchIcon />}
              variant="ghost"
              colorScheme="gray"
              size="md"
              fontSize="xl"
              borderRadius="full"
            />
            <IconButton
              aria-label="View notifications"
              icon={<BellIcon />}
              variant="ghost"
              colorScheme="gray"
              size="md"
              fontSize="xl"
              borderRadius="full"
              position="relative"
            >
              <Box
                position="absolute"
                top={2}
                right={2}
                w={2}
                h={2}
                bg="red.500"
                borderRadius="full"
              />
            </IconButton>
            <ThemeToggle />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

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
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const footerBg = useColorModeValue('white', 'gray.800');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const footerTextColor = useColorModeValue('gray.600', 'gray.400');
  const linkHoverColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <CSSReset />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Box 
            minH="100vh" 
            display="flex" 
            flexDirection="column"
            bg={bgColor}
          >
            <NavBar />
            <Box 
              as="main" 
              flex="1"
              pt={{ base: 6, md: 8 }}
              pb={8}
              px={{ base: 4, md: 6, lg: 8 }}
            >
              <Container 
                maxW="container.xl" 
                px={0}
                height="100%"
              >
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Box width="100%" height="100%">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/new" element={<Navigate to="/products" />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Box>
                </ErrorBoundary>
              </Container>
            </Box>
            
            {/* Footer */}
            <Box 
              as="footer"
              bg={footerBg}
              borderTopWidth="1px"
              borderColor={footerBorderColor}
              py={6}
            >
              <Container maxW="container.xl">
                <Flex
                  direction={{ base: 'column', md: 'row' }} 
                  justify="space-between" 
                  align="center"
                  gap={4}
                >
                  <Text 
                    color={footerTextColor}
                    textAlign={{ base: 'center', md: 'left' }}
                    fontSize="sm"
                  >
                    © {new Date().getFullYear()} PriceCompare. All rights reserved.
                  </Text>
                  <Flex gap={6} wrap="wrap" justify={{ base: 'center', md: 'flex-end' }}>
                    {['Terms', 'Privacy', 'Contact'].map((item) => (
                      <Link 
                        key={item}
                        href="#" 
                        color={footerTextColor}
                        _hover={{ 
                          color: linkHoverColor,
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
        </ErrorBoundary>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
