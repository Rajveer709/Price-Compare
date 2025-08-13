import React from 'react';
import { 
  Box, 
  Spinner, 
  VStack, 
  Text, 
  useColorModeValue,
  keyframes 
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const MotionBox = motion(Box);

const LoadingSpinner = ({ 
  size = 'xl', 
  message = 'Loading...', 
  showMessage = true,
  variant = 'default' 
}) => {
  const spinnerColor = useColorModeValue('brand.500', 'brand.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const bgColor = useColorModeValue('white', 'gray.800');

  if (variant === 'overlay') {
    return (
      <MotionBox
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Box
          bg={bgColor}
          p={8}
          borderRadius="xl"
          boxShadow="2xl"
          textAlign="center"
        >
          <VStack spacing={4}>
            <Box animation={`${pulse} 2s infinite`}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color={spinnerColor}
                size={size}
              />
            </Box>
            {showMessage && (
              <Text color={textColor} fontSize="lg" fontWeight="medium">
                {message}
              </Text>
            )}
          </VStack>
        </Box>
      </MotionBox>
    );
  }

  if (variant === 'inline') {
    return (
      <VStack spacing={3} py={8}>
        <Spinner
          thickness="3px"
          speed="0.65s"
          emptyColor="gray.200"
          color={spinnerColor}
          size={size}
        />
        {showMessage && (
          <Text color={textColor} fontSize="md">
            {message}
          </Text>
        )}
      </VStack>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="200px"
      w="100%"
    >
      <VStack spacing={4}>
        <Box animation={`${pulse} 2s infinite`}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color={spinnerColor}
            size={size}
          />
        </Box>
        {showMessage && (
          <Text color={textColor} fontSize="lg" fontWeight="medium">
            {message}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default LoadingSpinner;