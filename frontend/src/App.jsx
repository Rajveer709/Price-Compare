import React, { Suspense, lazy } from 'react';
import { 
  ChakraProvider, 
  Box, 
  Container, 
  Flex, 
  Spinner,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages (with lazy loading for better performance)
const Home = lazy(() => import('./pages/Home'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Account = lazy(() => import('./pages/account/Account'));
const Watchlist = lazy(() => import('./pages/account/Watchlist'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    },
  },
});

// Loading component for Suspense fallback
const PageLoading = () => (
  <Flex minH="100vh" align="center" justify="center">
    <Spinner size="xl" color="primary.500" />
  </Flex>
);

// Error boundary fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Box textAlign="center" py={20} px={4}>
      <Box color="red.500" mb={4}>
        <Box as="span" fontSize="4xl">⚠️</Box>
      </Box>
      <Box as="h2" fontSize="xl" fontWeight="bold" mb={2}>
        Oops! Something went wrong.
      </Box>
      <Box color="gray.500" mb={6} maxW="md" mx="auto">
        {error.message}
      </Box>
      <Box>
        <button
          onClick={resetErrorBoundary}
          style={{
            backgroundColor: '#3182ce',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </Box>
    </Box>
  );
};

// Auth wrapper component
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Main App component
function App() {
  return (
    <HelmetProvider>
      <ChakraProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<PageLoading />}>
                <Box minH="100vh" display="flex" flexDirection="column">
                  <Header />
                  <Box as="main" flex={1} pt="64px">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={
                        <MainLayout>
                          <Home />
                        </MainLayout>
                      } />
                      
                      <Route path="/search" element={
                        <MainLayout>
                          <SearchResults />
                        </MainLayout>
                      } />
                      
                      <Route path="/product/:id" element={
                        <MainLayout>
                          <ProductDetails />
                        </MainLayout>
                      } />
                      
                      {/* Auth Routes */}
                      <Route path="/login" element={
                        <MainLayout>
                          <Login />
                        </MainLayout>
                      } />
                      
                      <Route path="/register" element={
                        <MainLayout>
                          <Register />
                        </MainLayout>
                      } />
                      
                      {/* Protected Routes */}
                      <Route path="/account" element={
                        <RequireAuth>
                          <MainLayout>
                            <Account />
                          </MainLayout>
                        </RequireAuth>
                      } />
                      
                      <Route path="/watchlist" element={
                        <RequireAuth>
                          <MainLayout>
                            <Watchlist />
                          </MainLayout>
                        </RequireAuth>
                      } />
                      
                      {/* 404 Not Found */}
                      <Route path="*" element={
                        <MainLayout>
                          <NotFound />
                        </MainLayout>
                      } />
                    </Routes>
                  </Box>
                  <Footer />
                  
                  {/* Toast notifications */}
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      duration: 5000,
                      style: {
                        background: '#2D3748',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        theme: {
                          primary: 'green',
                          secondary: 'black',
                        },
                      },
                      error: {
                        style: {
                          background: '#E53E3E',
                        },
                      },
                    }}
                  />
                </Box>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </HelmetProvider>
                  >
                    {new Date().getFullYear()} PriceCompare. All rights reserved.
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
