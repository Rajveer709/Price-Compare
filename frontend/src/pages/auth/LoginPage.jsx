import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      toast({
        title: 'Successfully logged in',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error logging in',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      
      if (error) throw error;
      
      toast({
        title: 'Successfully logged in with Google',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Error signing in with Google',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const dividerBg = useColorModeValue('gray.300', 'gray.600');
  const dividerTextBg = useColorModeValue('white', 'gray.800');

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>Welcome Back</Heading>
          <Text color="gray.500">Sign in to your account</Text>
        </Box>

        {/* Google Sign-In Button */}
        <Button
          variant="outline"
          leftIcon={<FcGoogle size={20} />}
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          loadingText="Signing in with Google"
          size="lg"
          py={6}
          borderColor={useColorModeValue('gray.300', 'gray.600')}
          _hover={{
            bg: useColorModeValue('gray.50', 'gray.700'),
          }}
          _active={{
            bg: useColorModeValue('gray.100', 'gray.600'),
          }}
        >
          Continue with Google
        </Button>

        {/* Divider with "or" text */}
        <Box position="relative" py={4}>
          <Divider borderColor={dividerBg} />
          <Text
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            px={4}
            bg={dividerTextBg}
            color="gray.500"
            fontSize="sm"
          >
            OR
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    _hover={{ bg: 'transparent' }}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              mt={4}
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
          </VStack>
        </form>

        <Box textAlign="center" mt={4}>
          <Text>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#3182ce', fontWeight: '500' }}>
              Sign up
            </Link>
          </Text>
          <Text mt={2}>
            <Link 
              to="/forgot-password" 
              style={{ color: '#3182ce', fontSize: '0.875rem' }}
            >
              Forgot password?
            </Link>
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default LoginPage;
