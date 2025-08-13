import { Box, Heading, Text, Button, VStack, Container, SimpleGrid, useColorModeValue } from '@chakra-ui/react';
import { FiSearch, FiTrendingUp, FiClock, FiHeart } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, colorScheme = 'primary' }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      p={6}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      boxShadow="sm"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        transition: 'all 0.2s',
      }}
    >
      <Box
        display="inline-flex"
        p={3}
        bg={`${colorScheme}.100`}
        color={`${colorScheme}.600`}
        borderRadius="full"
        mb={4}
      >
        {icon}
      </Box>
      <Heading as="h3" size="md" mb={2}>
        {title}
      </Heading>
      <Text color={useColorModeValue('gray.600', 'gray.400')}>
        {description}
      </Text>
    </Box>
  );
};

const Home = () => {
  const heroBg = useColorModeValue('primary.50', 'primary.900');
  const buttonBg = useColorModeValue('primary.600', 'primary.500');
  const buttonHover = useColorModeValue('primary.700', 'primary.400');

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={heroBg} py={20} px={4} textAlign="center">
        <Container maxW="4xl">
          <Heading as="h1" size="2xl" mb={6} lineHeight="1.2">
            Find the Best Deals Across Multiple Retailers
          </Heading>
          <Text fontSize="xl" color={useColorModeValue('gray.600', 'gray.300')} mb={8} maxW="2xl" mx="auto">
            Compare prices, track price history, and save money on your online purchases with our powerful price comparison tool.
          </Text>
          <Button
            as={RouterLink}
            to="/search"
            size="lg"
            colorScheme="primary"
            leftIcon={<FiSearch />}
            bg={buttonBg}
            _hover={{ bg: buttonHover }}
            px={8}
            py={6}
            fontSize="lg"
          >
            Start Searching
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="6xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center" maxW="2xl" mx="auto">
            <Text color="primary.500" fontWeight="semibold" mb={3}>
              WHY CHOOSE US
            </Text>
            <Heading as="h2" size="xl" mb={4}>
              Save Time and Money
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Our platform helps you find the best prices across multiple retailers, track price history, and get alerts when prices drop.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
            <FeatureCard
              icon={<FiSearch size={24} />}
              title="Easy Search"
              description="Quickly find products and compare prices across multiple retailers with our intuitive search."
              colorScheme="blue"
            />
            <FeatureCard
              icon={<FiTrendingUp size={24} />}
              title="Price Tracking"
              description="Track price history and get alerts when prices drop on your favorite products."
              colorScheme="green"
            />
            <FeatureCard
              icon={<FiClock size={24} />}
              title="Save Time"
              description="No need to check multiple websites. We do the work for you."
              colorScheme="orange"
            />
            <FeatureCard
              icon={<FiHeart size={24} />}
              title="Wishlist"
              description="Save products to your wishlist and get notified when prices drop."
              colorScheme="pink"
            />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg={useColorModeValue('gray.50', 'gray.800')} py={16}>
        <Container maxW="4xl" textAlign="center">
          <Heading as="h2" size="xl" mb={6}>
            Ready to Start Saving?
          </Heading>
          <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.300')} mb={8} maxW="2xl" mx="auto">
            Join thousands of smart shoppers who are already saving money with our price comparison tool.
          </Text>
          <Button
            as={RouterLink}
            to="/register"
            size="lg"
            colorScheme="primary"
            px={8}
            py={6}
            fontSize="lg"
          >
            Sign Up for Free
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
