import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  useToast,
} from '@chakra-ui/react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) throw error;
      
      setEmailSent(true);
      
      toast({
        title: 'Email sent',
        description: 'Check your email for the password reset link',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Box maxW="md" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
        <VStack spacing={6} textAlign="center">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Check Your Email
            </Heading>
            <Text color="gray.600">
              We've sent a password reset link to {email}
            </Text>
          </Box>
          <Text>
            Didn't receive the email?{' '}
            <Button variant="link" colorScheme="blue" onClick={() => setEmailSent(false)}>
              Try again
            </Button>
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => navigate('/login')}
            mt={4}
          >
            Back to Login
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl">Reset Password</Heading>
          <Text mt={2} color="gray.600">
            Enter your email and we'll send you a link to reset your password
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

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              mt={4}
              isLoading={isLoading}
              loadingText="Sending email..."
            >
              Send Reset Link
            </Button>
          </VStack>
        </form>

        <Box textAlign="center" mt={4}>
          <Link to="/login" style={{ color: '#3182ce' }}>
            Back to Login
          </Link>
        </Box>
      </VStack>
    </Box>
  );
};

export default ForgotPasswordPage;
