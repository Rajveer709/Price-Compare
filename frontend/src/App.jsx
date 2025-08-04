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
  Fade,
  VStack,
  HStack,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Badge,
  Tooltip,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon, BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Routes, Route, Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import theme from './theme';
import ProductsPage from './pages/ProductsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const activeBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Navigation links
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    ...(user ? [
      { label: 'Price Tracker', to: '/tracker' },
      { label: 'Deals', to: '/deals' },
    ] : []),
  ];
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Show loading state
  if (loading) {
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
      >
        <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
          <Flex h={16} alignItems="center" justifyContent="center">
            <Spinner size="sm" />
          </Flex>
        </Container>
      </Box>
    );
  }
  
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
            
            {user ? (
              <>
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
                
                <Menu isOpen={isMenuOpen} onOpen={() => setIsMenuOpen(true)} onClose={() => setIsMenuOpen(false)}>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    rightIcon={<ChevronDownIcon />}
                    px={2}
                    _hover={{ bg: hoverBg }}
                    _active={{ bg: activeBg }}
                  >
                    <HStack spacing={2}>
                      <Avatar 
                        name={user?.email} 
                        src={user?.user_metadata?.avatar_url}
                        bg="brand.500"
                        color="white"
                        size="sm"
                      />
                      <Text display={{ base: 'none', md: 'block' }} fontSize="sm">
                        {user?.email?.split('@')[0] || 'Account'}
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList zIndex="dropdown" minW="200px">
                    <Box px={3} py={2} borderBottomWidth="1px">
                      <Text fontWeight="medium" fontSize="sm">{user?.email}</Text>
                      <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                        {user?.email}
                      </Text>
                    </Box>
                    <MenuDivider m={0} />
                    <MenuItem 
                      icon={<Box as={FiUser} size={16} />}
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={FiSettings} size={16} />}
                      onClick={() => {
                        navigate('/settings');
                        setIsMenuOpen(false);
                      }}
                    >
                      Settings
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem 
                      icon={<Box as={FiLogOut} size={16} />}
                      onClick={handleSignOut}
                      color={useColorModeValue('red.600', 'red.400')}
                      _hover={{
                        bg: useColorModeValue('red.50', 'red.900'),
                        color: useColorModeValue('red.700', 'red.300'),
                      }}
                    >
                      Sign out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <HStack spacing={2}>
                <Button 
                  as={RouterLink} 
                  to="/login" 
                  variant="ghost"
                  colorScheme="gray"
                  size="sm"
                >
                  Log In
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/signup" 
                  colorScheme="brand"
                  size="sm"
                >
                  Sign Up
                </Button>
              </HStack>
            )}
            
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
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <CSSReset />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AuthProvider>
            <Box minH="100vh" display="flex" flexDirection="column">
              <NavBar />
              <Box as="main" flex="1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/products" 
                    element={
                      <ProtectedRoute>
                        <ProductsPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Redirect any unknown paths to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
              <Box 
                as="footer"
                bg={useColorModeValue('white', 'gray.800')}
                borderTopWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
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
