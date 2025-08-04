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

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: "Passwords don't match",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) throw error;
      
      toast({
        title: 'Success!',
        description: 'Check your email to confirm your account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error creating account',
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
        title: 'Successfully signed up with Google',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Error signing up with Google',
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
          <Heading as="h1" size="xl" mb={2}>Create an account</Heading>
          <Text color="gray.500">Fill in the form to get started</Text>
        </Box>

        {/* Google Sign-Up Button */}
        <Button
          variant="outline"
          leftIcon={<FcGoogle size={20} />}
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          loadingText="Signing up with Google"
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
                  placeholder="Create a password"
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

            <FormControl id="confirmPassword" isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              mt={4}
              isLoading={isLoading}
              loadingText="Creating account..."
            >
              Sign Up
            </Button>
          </VStack>
        </form>

        <Box textAlign="center" mt={4}>
          <Text>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3182ce', fontWeight: '500' }}>
              Sign in
            </Link>
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SignupPage;
