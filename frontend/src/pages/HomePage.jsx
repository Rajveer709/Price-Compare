import { keyframes } from '@emotion/react';
import { 
  VStack, HStack, Heading, Text, Button, Box, Container, 
  useColorModeValue, SimpleGrid, Icon, useBreakpointValue,
  Divider, Avatar, Stack, Link as ChakraLink, Flex
} from '@chakra-ui/react';
import { 
  SearchIcon, StarIcon, TimeIcon, ArrowForwardIcon, 
  CheckCircleIcon, ChevronRightIcon, ArrowRightIcon
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Box
      p={8}
      bg={useColorModeValue('white', 'gray.800')}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      boxShadow="sm"
      textAlign="center"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'xl',
        borderColor: 'brand.400',
      }}
      h="100%"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        bgGradient="linear(to-r, brand.400, blue.400)"
      />
      <Box
        display="inline-flex"
        p={4}
        bg={useColorModeValue('brand.50', 'brand.900')}
        color="brand.500"
        borderRadius="xl"
        mb={6}
        mx="auto"
        boxShadow="sm"
      >
        {icon}
      </Box>
      <Heading 
        as="h3" 
        size="lg" 
        mb={3} 
        color={useColorModeValue('gray.800', 'white')}
        fontWeight="semibold"
      >
        {title}
      </Heading>
      <Text 
        color={useColorModeValue('gray.600', 'gray.300')} 
        flexGrow={1}
        fontSize="md"
        lineHeight="tall"
      >
        {description}
      </Text>
      <Button
        mt={6}
        variant="ghost"
        colorScheme="brand"
        size="sm"
        rightIcon={<ArrowRightIcon />}
        alignSelf="center"
        _hover={{
          transform: 'translateX(4px)',
        }}
        transition="all 0.2s"
      >
        Learn more
      </Button>
    </Box>
  </motion.div>
);

function HomePage() {
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.50, blue.50, purple.50)',
    'linear(to-r, gray.900, gray.800, gray.900)'
  );

  const features = [
    {
      icon: <SearchIcon boxSize={6} />,
      title: 'Smart Price Tracking',
      description: 'Automatically monitor price changes for your favorite products and receive instant notifications when prices drop below your target.'
    },
    {
      icon: <StarIcon boxSize={6} />,
      title: 'Multi-Store Comparison',
      description: 'Compare prices across multiple retailers simultaneously to ensure you always get the best possible deal available.'
    },
    {
      icon: <TimeIcon boxSize={6} />,
      title: 'Price History & Trends',
      description: 'Analyze historical price data and trends to identify the perfect time to make your purchase and maximize savings.'
    }
  ];

  return (
    <Box overflowX="hidden">
      {/* Hero Section */}
      <Box 
        bgGradient={bgGradient}
        borderRadius={{ base: 'none', md: 'xl' }}
        py={{ base: 16, md: 28 }}
        px={{ base: 4, md: 8 }}
        mb={16}
        position="relative"
        overflow="hidden"
      >
        {/* Animated background elements */}
        <Box
          position="absolute"
          top={-10}
          right={-10}
          w="300px"
          h="300px"
          bgGradient="radial(circle, brand.200 0%, transparent 70%)"
          borderRadius="full"
          opacity={0.6}
          filter="blur(60px)"
          zIndex={0}
        />
        <Box
          position="absolute"
          bottom={-20}
          left={-20}
          w="400px"
          h="400px"
          bgGradient="radial(circle, blue.200 0%, transparent 70%)"
          borderRadius="full"
          opacity={0.4}
          filter="blur(70px)"
          zIndex={0}
        />
        
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack 
            spacing={8} 
            textAlign="center" 
            position="relative"
            zIndex={1}
            maxW="4xl"
            mx="auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Text
                color="brand.500"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={3}
                fontSize="sm"
              >
                Smart Shopping Starts Here
              </Text>
              <Heading 
                as="h1" 
                size={{ base: '3xl', md: '4xl' }} 
                fontWeight="extrabold"
                lineHeight="1.1"
                mb={6}
              >
                <Box as="span" display="block" color={useColorModeValue('gray.900', 'white')}>
                  Never Overpay Again
                </Box>
                <Box 
                  as="span" 
                  display="block" 
                  bgGradient={useColorModeValue(
                    'linear(to-r, brand.600, blue.600)',
                    'linear(to-r, brand.300, blue.300)'
                  )}
                  bgClip="text"
                >
                  Shop Smarter
                </Box>
              </Heading>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Text 
                fontSize={{ base: 'lg', md: 'xl' }} 
                color={useColorModeValue('gray.700', 'gray.300')}
                maxW="2xl"
                mx="auto"
                lineHeight="tall"
              >
                Track price drops, compare products, and save money on your favorite items across multiple retailers. 
                <Box as="span" display={{ base: 'none', md: 'inline' }}>
                  {' '}Join thousands of smart shoppers today!
                </Box>
              </Text>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <HStack spacing={4} pt={4} flexWrap="wrap" justify="center">
                <Button 
                  size="lg" 
                  colorScheme="brand" 
                  onClick={() => navigate('/products')}
                  px={8}
                  py={6}
                  fontSize="lg"
                  rightIcon={<ArrowForwardIcon />}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                >
                  Start Tracking Prices
                </Button>
                <Button 
                  size="lg" 
                  variant={isMobile ? 'ghost' : 'outline'}
                  onClick={() => navigate('/products/new')}
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: useColorModeValue('gray.100', 'whiteAlpha.200'),
                    transform: 'translateY(-2px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                >
                  Add a Product
                </Button>
              </HStack>
              
              <Text 
                mt={6} 
                color={useColorModeValue('gray.600', 'gray.400')}
                fontSize="sm"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CheckCircleIcon color="green.500" mr={2} />
                No credit card required • Free forever
              </Text>
            </motion.div>
          </VStack>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <HStack 
              spacing={8} 
              mt={16} 
              justify="center"
              flexWrap="wrap"
              divider={
                <Box 
                  h="40px" 
                  w="1px" 
                  bg={useColorModeValue('gray.200', 'gray.600')} 
                  mx={2}
                />
              }
            >
              {[
                { value: '10,000+', label: 'Active Users' },
                { value: '1M+', label: 'Products Tracked' },
                { value: '50+', label: 'Retailers' },
                { value: '24/7', label: 'Price Monitoring' },
              ].map((stat, index) => (
                <Box key={index} textAlign="center" px={4} py={2}>
                  <Text 
                    fontSize={{ base: '2xl', md: '3xl' }} 
                    fontWeight="bold"
                    color={useColorModeValue('gray.800', 'white')}
                    lineHeight="1"
                  >
                    {stat.value}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={useColorModeValue('gray.600', 'gray.400')}
                    mt={1}
                  >
                    {stat.label}
                  </Text>
                </Box>
              ))}
            </HStack>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20} position="relative">
        {/* Decorative elements */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="300px"
          h="300px"
          bgGradient="radial(circle, blue.50 0%, transparent 70%)"
          borderRadius="full"
          filter="blur(60px)"
          zIndex={-1}
          opacity={0.6}
        />
        
        <VStack spacing={16} position="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={4} textAlign="center" maxW="3xl" mx="auto">
              <Text 
                color="brand.500" 
                fontWeight="semibold" 
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Powerful Features
              </Text>
              <Heading as="h2" size="2xl" fontWeight="bold" lineHeight="1.2">
                Everything You Need to Save Money
              </Heading>
              <Text 
                color={useColorModeValue('gray.600', 'gray.300')} 
                fontSize="lg"
                maxW="2xl"
              >
                Our platform is packed with powerful tools to help you find the best deals and never overpay again.
              </Text>
            </VStack>
          </motion.div>

          <Box width="100%">
            <SimpleGrid 
              columns={{ base: 1, md: 3 }} 
              spacing={8}
              position="relative"
            >
              {features.map((feature, index) => (
                <FeatureCard 
                  key={index}
                  {...feature}
                  delay={index * 0.1}
                />
              ))}
            </SimpleGrid>
          </Box>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <VStack spacing={6} mt={8} maxW="2xl" mx="auto">
              <Text 
                color={useColorModeValue('gray.600', 'gray.300')}
                textAlign="center"
                fontSize="lg"
              >
                And many more features to help you save money and shop smarter...
              </Text>
              <Button 
                rightIcon={<ChevronRightIcon />}
                variant="link"
                colorScheme="brand"
                size="lg"
                onClick={() => navigate('/features')}
                _hover={{
                  textDecoration: 'none',
                  '& > svg': {
                    transform: 'translateX(4px)',
                  },
                }}
                sx={{
                  '& > svg': {
                    transition: 'transform 0.2s',
                  },
                }}
              >
                Explore all features
              </Button>
            </VStack>
          </motion.div>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box 
        as="section"
        position="relative"
        overflow="hidden"
        py={20}
        mt={24}
        bgGradient={useColorModeValue(
          'linear(to-r, brand.50, blue.50, purple.50)',
          'linear(to-r, gray.900, gray.800, gray.900)'
        )}
      >
        {/* Decorative elements */}
        <Box
          position="absolute"
          top={-100}
          left={-100}
          w="400px"
          h="400px"
          bgGradient="radial(circle, brand.200 0%, transparent 70%)"
          borderRadius="full"
          opacity={0.6}
          filter="blur(60px)"
        />
        <Box
          position="absolute"
          bottom={-50}
          right={-50}
          w="300px"
          h="300px"
          bgGradient="radial(circle, blue.200 0%, transparent 70%)"
          borderRadius="full"
          opacity={0.4}
          filter="blur(50px)"
        />
        
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={8} textAlign="center" maxW="3xl" mx="auto" px={4}>
              <Box>
                <Text 
                  color="brand.500" 
                  fontWeight="semibold" 
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={3}
                >
                  Ready to Start Saving?
                </Text>
                <Heading as="h2" size="2xl" fontWeight="bold" lineHeight="1.2" mb={4}>
                  Join Thousands of Smart Shoppers
                </Heading>
                <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} maxW="2xl" mx="auto">
                  Start tracking prices today and never overpay again. It's free to get started, no credit card required.
                </Text>
              </Box>
              
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Button 
                  size="lg" 
                  colorScheme="brand" 
                  onClick={() => navigate('/signup')}
                  rightIcon={<ArrowForwardIcon />}
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                >
                  Get Started for Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/products')}
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: useColorModeValue('white', 'whiteAlpha.200'),
                    transform: 'translateY(-2px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  transition="all 0.2s"
                >
                  Browse Products
                </Button>
              </HStack>
              
              <VStack spacing={1} pt={4}>
                <HStack spacing={2} color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                  <CheckCircleIcon color="green.500" />
                  <Text>No credit card required</Text>
                  <Box w="4px" h="4px" borderRadius="full" bg="gray.400" />
                  <Text>Free forever</Text>
                  <Box w="4px" h="4px" borderRadius="full" bg="gray.400" />
                  <Text>Cancel anytime</Text>
                </HStack>
                <Text color={useColorModeValue('gray.500', 'gray.500')} fontSize="sm">
                  Trusted by 10,000+ shoppers worldwide
                </Text>
              </VStack>
            </VStack>
          </motion.div>
        </Container>
      </Box>
      
      {/* Footer */}
      <Box as="footer" bg={useColorModeValue('gray.50', 'gray.900')} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.800')}>
        <Container maxW="container.xl" py={12}>
          <VStack spacing={8}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8} width="100%">
              <Box>
                <Heading size="md" mb={4} color={useColorModeValue('gray.800', 'white')}>
                  PriceCompare
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Helping you find the best deals and save money on your favorite products.
                </Text>
              </Box>
              
              <Box>
                <Heading size="sm" mb={4} color={useColorModeValue('gray.800', 'white')}>
                  Product
                </Heading>
                <VStack align="start" spacing={2}>
                  <ChakraLink href="/features" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Features</ChakraLink>
                  <ChakraLink href="/pricing" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Pricing</ChakraLink>
                  <ChakraLink href="/blog" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Blog</ChakraLink>
                  <ChakraLink href="/changelog" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Changelog</ChakraLink>
                </VStack>
              </Box>
              
              <Box>
                <Heading size="sm" mb={4} color={useColorModeValue('gray.800', 'white')}>
                  Resources
                </Heading>
                <VStack align="start" spacing={2}>
                  <ChakraLink href="/help" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Help Center</ChakraLink>
                  <ChakraLink href="/api" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>API</ChakraLink>
                  <ChakraLink href="/browser-extension" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Browser Extension</ChakraLink>
                  <ChakraLink href="/mobile-app" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Mobile App</ChakraLink>
                </VStack>
              </Box>
              
              <Box>
                <Heading size="sm" mb={4} color={useColorModeValue('gray.800', 'white')}>
                  Company
                </Heading>
                <VStack align="start" spacing={2}>
                  <ChakraLink href="/about" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>About Us</ChakraLink>
                  <ChakraLink href="/careers" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Careers</ChakraLink>
                  <ChakraLink href="/contact" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Contact</ChakraLink>
                  <ChakraLink href="/press" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }}>Press</ChakraLink>
                </VStack>
              </Box>
            </SimpleGrid>
            
            <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} />
            
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              justify="space-between" 
              align="center" 
              width="100%"
              pt={4}
            >
              <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                {new Date().getFullYear()} PriceCompare. All rights reserved.
              </Text>
              <HStack spacing={6} mt={{ base: 4, md: 0 }}>
                <ChakraLink href="/privacy" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }} fontSize="sm">Privacy Policy</ChakraLink>
                <ChakraLink href="/terms" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }} fontSize="sm">Terms of Service</ChakraLink>
                <ChakraLink href="/cookies" color={useColorModeValue('gray.600', 'gray.400')} _hover={{ color: 'brand.500' }} fontSize="sm">Cookie Policy</ChakraLink>
              </HStack>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Box>
  );

};

export default HomePage;
