import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Stack,
  Badge,
  Image,
  Card,
  CardBody,
  Skeleton,
  SkeletonText,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  IconButton,
  Tooltip,
  Divider,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  AspectRatio,
  Link,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Collapse,
  useBreakpointValue,
  Center,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  ScaleFade,
  SlideFade,
} from '@chakra-ui/react';
import {
  SearchIcon,
  ViewIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  HeartIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  CloseIcon,
  WarningIcon,
  RepeatIcon,
  TimeIcon,
  CheckIcon,
} from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Motion components
const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionGrid = motion(SimpleGrid);

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Enhanced mock data with more realistic products
const mockProducts = [
  {
    id: '1',
    title: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium (Unlocked)',
    price: { value: 1199.99, currency: 'USD' },
    originalPrice: { value: 1299.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600',
    condition: 'New',
    seller: { name: 'TechStore Pro', rating: 4.8, feedbackCount: 15420 },
    shipping: { cost: 0, time: '2-3 days', method: 'Free shipping' },
    discount: 8,
    itemWebUrl: 'https://ebay.com/item/123456789',
    location: 'California, US',
    watchers: 127,
    sold: 45,
    category: 'Electronics',
  },
  {
    id: '2',
    title: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black (Factory Unlocked)',
    price: { value: 999.99, currency: 'USD' },
    originalPrice: { value: 1199.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600',
    condition: 'New',
    seller: { name: 'Galaxy Store Official', rating: 4.9, feedbackCount: 28350 },
    shipping: { cost: 15.99, time: '1-2 days', method: 'Express shipping' },
    discount: 17,
    itemWebUrl: 'https://ebay.com/item/123456790',
    location: 'New York, US',
    watchers: 89,
    sold: 23,
    category: 'Electronics',
  },
  {
    id: '3',
    title: 'MacBook Pro 16" M3 Max 1TB SSD 36GB RAM - Space Black (2024)',
    price: { value: 2899.99, currency: 'USD' },
    originalPrice: { value: 3199.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600',
    condition: 'New',
    seller: { name: 'Apple Authorized Reseller', rating: 4.7, feedbackCount: 9876 },
    shipping: { cost: 0, time: '3-5 days', method: 'Free shipping' },
    discount: 9,
    itemWebUrl: 'https://ebay.com/item/123456791',
    location: 'Texas, US',
    watchers: 203,
    sold: 12,
    category: 'Computers',
  },
  {
    id: '4',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones - Black',
    price: { value: 299.99, currency: 'USD' },
    originalPrice: { value: 399.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=600',
    condition: 'New',
    seller: { name: 'AudioTech Plus', rating: 4.6, feedbackCount: 5432 },
    shipping: { cost: 9.99, time: '2-4 days', method: 'Standard shipping' },
    discount: 25,
    itemWebUrl: 'https://ebay.com/item/123456792',
    location: 'Florida, US',
    watchers: 67,
    sold: 156,
    category: 'Electronics',
  },
  {
    id: '5',
    title: 'Nintendo Switch OLED Model - White Console with Joy-Con Controllers',
    price: { value: 329.99, currency: 'USD' },
    originalPrice: { value: 349.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=600',
    condition: 'New',
    seller: { name: 'GameHub Central', rating: 4.8, feedbackCount: 12890 },
    shipping: { cost: 0, time: '1-3 days', method: 'Free shipping' },
    discount: 6,
    itemWebUrl: 'https://ebay.com/item/123456793',
    location: 'Washington, US',
    watchers: 234,
    sold: 89,
    category: 'Gaming',
  },
  {
    id: '6',
    title: 'Dell XPS 13 Plus Laptop - Intel i7, 16GB RAM, 512GB SSD - Platinum',
    price: { value: 1299.99, currency: 'USD' },
    originalPrice: { value: 1599.99, currency: 'USD' },
    image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=600',
    condition: 'Refurbished',
    seller: { name: 'Dell Outlet Store', rating: 4.5, feedbackCount: 7654 },
    shipping: { cost: 0, time: '3-7 days', method: 'Free shipping' },
    discount: 19,
    itemWebUrl: 'https://ebay.com/item/123456794',
    location: 'Illinois, US',
    watchers: 45,
    sold: 34,
    category: 'Computers',
  },
];

// Enhanced Product Card Component
const ProductCard = ({ product, viewMode = 'grid', onSave, savedItems = [] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const isSaved = savedItems.includes(product.id);

  const handleSave = useCallback((e) => {
    e?.stopPropagation();
    onSave(product.id);
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved for later',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  }, [isSaved, onSave, product.id, toast]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(price.value);
  }, []);

  const renderStars = useCallback((rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        boxSize={3}
        color={i < Math.floor(rating) ? 'yellow.400' : 'gray.300'}
      />
    ));
  }, []);

  const calculateSavings = useCallback(() => {
    if (product.originalPrice && product.originalPrice.value > product.price.value) {
      return product.originalPrice.value - product.price.value;
    }
    return 0;
  }, [product]);

  // List view layout
  if (viewMode === 'list') {
    return (
      <MotionCard
        bg={cardBg}
        borderColor={borderColor}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        cursor="pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        transition={{ duration: 0.2 }}
        _hover={{
          borderColor: 'brand.400',
          bg: hoverBg,
        }}
        onClick={onOpen}
      >
        <Flex>
          <Box position="relative" minW="200px" w="200px">
            <AspectRatio ratio={1}>
              {imageError ? (
                <Center bg="gray.100" color="gray.500">
                  <VStack>
                    <WarningIcon boxSize={8} />
                    <Text fontSize="sm">Image unavailable</Text>
                  </VStack>
                </Center>
              ) : (
                <Image
                  src={product.image}
                  alt={product.title}
                  objectFit="cover"
                  transition="transform 0.3s"
                  transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  opacity={imageLoaded ? 1 : 0}
                />
              )}
            </AspectRatio>
            
            {product.discount > 0 && (
              <Badge
                position="absolute"
                top={2}
                left={2}
                colorScheme="red"
                variant="solid"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                -{product.discount}%
              </Badge>
            )}
          </Box>
          
          <CardBody flex="1" p={6}>
            <Flex justify="space-between" align="start" h="100%">
              <VStack align="start" spacing={3} flex="1" mr={4}>
                <Text
                  fontSize="lg"
                  fontWeight="semibold"
                  color={textColor}
                  noOfLines={2}
                  lineHeight="1.3"
                  _hover={{ color: 'brand.500' }}
                  transition="color 0.2s"
                >
                  {product.title}
                </Text>
                
                <HStack spacing={2} flexWrap="wrap">
                  <Badge colorScheme="green" variant="subtle" borderRadius="md">
                    {product.condition}
                  </Badge>
                  <Badge colorScheme="blue" variant="outline" borderRadius="md">
                    {product.category}
                  </Badge>
                  {product.sold > 0 && (
                    <Badge colorScheme="purple" variant="subtle" borderRadius="md">
                      {product.sold} sold
                    </Badge>
                  )}
                </HStack>
                
                <HStack spacing={1} align="center">
                  {renderStars(product.seller.rating)}
                  <Text fontSize="sm" color={mutedColor} ml={1}>
                    {product.seller.name} ({product.seller.feedbackCount.toLocaleString()})
                  </Text>
                </HStack>
                
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={mutedColor}>
                    <Text as="span" fontWeight="semibold">Shipping:</Text>{' '}
                    {product.shipping.cost === 0 ? 'Free' : formatPrice({ value: product.shipping.cost, currency: 'USD' })} • {product.shipping.time}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    <Text as="span" fontWeight="semibold">Location:</Text> {product.location}
                  </Text>
                  {product.watchers > 0 && (
                    <Text fontSize="sm" color={mutedColor}>
                      <Text as="span" fontWeight="semibold">Watchers:</Text> {product.watchers}
                    </Text>
                  )}
                </VStack>
              </VStack>
              
              <VStack align="end" spacing={3} minW="200px">
                <VStack align="end" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    {formatPrice(product.price)}
                  </Text>
                  {product.originalPrice && product.originalPrice.value > product.price.value && (
                    <VStack align="end" spacing={0}>
                      <Text
                        fontSize="sm"
                        color={mutedColor}
                        textDecoration="line-through"
                      >
                        {formatPrice(product.originalPrice)}
                      </Text>
                      <Text fontSize="sm" color="green.500" fontWeight="semibold">
                        Save ${calculateSavings().toFixed(2)}
                      </Text>
                    </VStack>
                  )}
                </VStack>
                
                <HStack spacing={2}>
                  <Tooltip label={isSaved ? 'Remove from saved' : 'Save for later'}>
                    <IconButton
                      icon={<HeartIcon />}
                      size="sm"
                      variant={isSaved ? 'solid' : 'ghost'}
                      colorScheme={isSaved ? 'red' : 'gray'}
                      onClick={handleSave}
                      _hover={{
                        transform: 'scale(1.1)',
                      }}
                      transition="all 0.2s"
                    />
                  </Tooltip>
                  
                  <Button
                    size="sm"
                    colorScheme="brand"
                    rightIcon={<ExternalLinkIcon />}
                    as={Link}
                    href={product.itemWebUrl}
                    isExternal
                    onClick={(e) => e.stopPropagation()}
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'md',
                    }}
                    transition="all 0.2s"
                  >
                    View on eBay
                  </Button>
                </HStack>
              </VStack>
            </Flex>
          </CardBody>
        </Flex>
      </MotionCard>
    );
  }

  // Grid view layout
  return (
    <MotionCard
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.3 }}
      _hover={{
        borderColor: 'brand.400',
      }}
      h="100%"
      display="flex"
      flexDirection="column"
      onClick={onOpen}
    >
      <Box position="relative">
        <AspectRatio ratio={4/3}>
          {imageError ? (
            <Center bg="gray.100" color="gray.500">
              <VStack>
                <WarningIcon boxSize={8} />
                <Text fontSize="sm">Image unavailable</Text>
              </VStack>
            </Center>
          ) : (
            <Image
              src={product.image}
              alt={product.title}
              objectFit="cover"
              transition="transform 0.3s"
              transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              opacity={imageLoaded ? 1 : 0}
            />
          )}
        </AspectRatio>
        
        {!imageLoaded && !imageError && (
          <Skeleton position="absolute" top={0} left={0} right={0} bottom={0} />
        )}
        
        {product.discount > 0 && (
          <Badge
            position="absolute"
            top={3}
            left={3}
            colorScheme="red"
            variant="solid"
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="bold"
          >
            -{product.discount}%
          </Badge>
        )}
        
        <IconButton
          icon={<HeartIcon />}
          position="absolute"
          top={3}
          right={3}
          size="sm"
          variant={isSaved ? 'solid' : 'ghost'}
          bg={isSaved ? 'red.500' : 'whiteAlpha.900'}
          color={isSaved ? 'white' : 'gray.600'}
          _hover={{
            bg: isSaved ? 'red.600' : 'whiteAlpha.800',
            transform: 'scale(1.1)',
          }}
          onClick={handleSave}
          opacity={isHovered || isSaved ? 1 : 0.7}
          transition="all 0.2s"
          borderRadius="full"
        />

        {product.watchers > 0 && (
          <Badge
            position="absolute"
            bottom={3}
            left={3}
            colorScheme="blue"
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            opacity={isHovered ? 1 : 0}
            transition="opacity 0.2s"
          >
            <ViewIcon boxSize={2} mr={1} />
            {product.watchers} watching
          </Badge>
        )}
      </Box>
      
      <CardBody p={4} flex="1" display="flex" flexDirection="column">
        <VStack align="start" spacing={3} flex="1">
          <Text
            fontSize="md"
            fontWeight="semibold"
            color={textColor}
            noOfLines={2}
            lineHeight="1.3"
            _hover={{ color: 'brand.500' }}
            transition="color 0.2s"
            minH="2.6em"
          >
            {product.title}
          </Text>
          
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme="green" variant="subtle" fontSize="xs" borderRadius="md">
              {product.condition}
            </Badge>
            {product.sold > 0 && (
              <Badge colorScheme="purple" variant="subtle" fontSize="xs" borderRadius="md">
                {product.sold} sold
              </Badge>
            )}
          </HStack>
          
          <VStack align="start" spacing={2} flex="1">
            <HStack spacing={0} align="baseline">
              <Text fontSize="xl" fontWeight="bold" color="brand.500">
                {formatPrice(product.price)}
              </Text>
              {product.originalPrice && product.originalPrice.value > product.price.value && (
                <Text
                  fontSize="sm"
                  color={mutedColor}
                  textDecoration="line-through"
                  ml={2}
                >
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
            </HStack>
            
            {calculateSavings() > 0 && (
              <Text fontSize="sm" color="green.500" fontWeight="semibold">
                Save ${calculateSavings().toFixed(2)}
              </Text>
            )}
            
            <Text fontSize="xs" color={mutedColor}>
              {product.shipping.cost === 0 ? 'Free shipping' : `+${formatPrice({ value: product.shipping.cost, currency: 'USD' })} shipping`} • {product.shipping.time}
            </Text>
          </VStack>
          
          <HStack spacing={1} align="center" w="100%">
            {renderStars(product.seller.rating)}
            <Text fontSize="xs" color={mutedColor} ml={1} noOfLines={1}>
              {product.seller.name}
            </Text>
          </HStack>
        </VStack>
        
        <Button
          size="sm"
          colorScheme="brand"
          rightIcon={<ExternalLinkIcon />}
          as={Link}
          href={product.itemWebUrl}
          isExternal
          mt={3}
          w="100%"
          onClick={(e) => e.stopPropagation()}
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          }}
          transition="all 0.2s"
        >
          View on eBay
        </Button>
      </CardBody>

      {/* Enhanced Product Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader pb={2}>
            <VStack align="start" spacing={2}>
              <Text fontSize="xl" fontWeight="bold" noOfLines={2}>
                {product.title}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle">
                  {product.condition}
                </Badge>
                <Badge colorScheme="blue" variant="outline">
                  {product.category}
                </Badge>
                {product.discount > 0 && (
                  <Badge colorScheme="red" variant="solid">
                    -{product.discount}% OFF
                  </Badge>
                )}
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
              <Box>
                <AspectRatio ratio={1} mb={4}>
                  <Image
                    src={product.image}
                    alt={product.title}
                    objectFit="cover"
                    borderRadius="lg"
                    boxShadow="lg"
                  />
                </AspectRatio>
                
                <VStack align="start" spacing={3}>
                  <Heading size="md" color={textColor}>
                    Product Details
                  </Heading>
                  
                  <SimpleGrid columns={2} spacing={4} w="100%">
                    <Box>
                      <Text fontSize="sm" color={mutedColor} fontWeight="semibold">
                        Condition
                      </Text>
                      <Text fontSize="md">{product.condition}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color={mutedColor} fontWeight="semibold">
                        Category
                      </Text>
                      <Text fontSize="md">{product.category}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color={mutedColor} fontWeight="semibold">
                        Location
                      </Text>
                      <Text fontSize="md">{product.location}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color={mutedColor} fontWeight="semibold">
                        Watchers
                      </Text>
                      <Text fontSize="md">{product.watchers}</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Box>
              
              <VStack align="start" spacing={6}>
                <VStack align="start" spacing={3} w="100%">
                  <HStack spacing={0} align="baseline">
                    <Text fontSize="4xl" fontWeight="bold" color="brand.500">
                      {formatPrice(product.price)}
                    </Text>
                    {product.originalPrice && product.originalPrice.value > product.price.value && (
                      <Text
                        fontSize="xl"
                        color={mutedColor}
                        textDecoration="line-through"
                        ml={3}
                      >
                        {formatPrice(product.originalPrice)}
                      </Text>
                    )}
                  </HStack>
                  
                  {calculateSavings() > 0 && (
                    <HStack>
                      <Badge colorScheme="green" variant="solid" fontSize="md" px={4} py={2} borderRadius="full">
                        <CheckIcon boxSize={3} mr={2} />
                        You save ${calculateSavings().toFixed(2)} ({product.discount}%)
                      </Badge>
                    </HStack>
                  )}
                </VStack>
                
                <Divider />
                
                <VStack align="start" spacing={4} w="100%">
                  <Heading size="md" color={textColor}>
                    Seller Information
                  </Heading>
                  
                  <HStack justify="space-between" w="100%">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold" fontSize="lg">
                        {product.seller.name}
                      </Text>
                      <HStack>
                        {renderStars(product.seller.rating)}
                        <Text fontSize="sm" color={mutedColor}>
                          ({product.seller.feedbackCount.toLocaleString()} reviews)
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <Box w="100%" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="semibold">Shipping:</Text>
                        <Text>
                          {product.shipping.cost === 0 ? 'Free' : formatPrice({ value: product.shipping.cost, currency: 'USD' })}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="semibold">Delivery:</Text>
                        <Text>{product.shipping.time}</Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="semibold">Method:</Text>
                        <Text>{product.shipping.method}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
                
                <Divider />
                
                <VStack spacing={4} w="100%">
                  <Button
                    size="lg"
                    colorScheme="brand"
                    rightIcon={<ExternalLinkIcon />}
                    as={Link}
                    href={product.itemWebUrl}
                    isExternal
                    w="100%"
                    py={6}
                    fontSize="lg"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                    transition="all 0.2s"
                  >
                    View on eBay
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    leftIcon={<HeartIcon />}
                    onClick={handleSave}
                    w="100%"
                    py={6}
                    fontSize="lg"
                    colorScheme={isSaved ? 'red' : 'gray'}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'md',
                    }}
                    transition="all 0.2s"
                  >
                    {isSaved ? 'Remove from Saved' : 'Save for Later'}
                  </Button>
                </VStack>
              </VStack>
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionCard>
  );
};

// Enhanced Filters Component
const FiltersSidebar = ({ filters, onFiltersChange, isOpen, onClose }) => {
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 5000]);
  const [selectedConditions, setSelectedConditions] = useState(filters.conditions || []);
  const [minRating, setMinRating] = useState(filters.minRating || 0);
  const [shippingOptions, setShippingOptions] = useState(filters.shipping || []);
  const [selectedCategories, setSelectedCategories] = useState(filters.categories || []);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const conditions = ['New', 'Used', 'Refurbished', 'For parts or not working'];
  const shipping = ['Free shipping', 'Fast shipping', 'Local pickup'];
  const categories = ['Electronics', 'Computers', 'Gaming', 'Mobile Phones', 'Audio'];

  const handleApplyFilters = useCallback(() => {
    const newFilters = {
      priceRange,
      conditions: selectedConditions,
      minRating,
      shipping: shippingOptions,
      categories: selectedCategories,
    };
    onFiltersChange(newFilters);
    onClose();
  }, [priceRange, selectedConditions, minRating, shippingOptions, selectedCategories, onFiltersChange, onClose]);

  const handleClearFilters = useCallback(() => {
    setPriceRange([0, 5000]);
    setSelectedConditions([]);
    setMinRating(0);
    setShippingOptions([]);
    setSelectedCategories([]);
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFiltersCount = [
    selectedConditions.length > 0,
    minRating > 0,
    shippingOptions.length > 0,
    selectedCategories.length > 0,
    priceRange[0] > 0 || priceRange[1] < 5000,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <VStack spacing={6} align="stretch">
      {/* Price Range */}
      <Box>
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold">Price Range</Text>
          <Text fontSize="sm" color="gray.500">
            ${priceRange[0]} - ${priceRange[1]}
          </Text>
        </HStack>
        <RangeSlider
          value={priceRange}
          onChange={setPriceRange}
          min={0}
          max={5000}
          step={50}
          colorScheme="brand"
        >
          <RangeSliderTrack>
            <RangeSliderFilledTrack />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} />
          <RangeSliderThumb index={1} />
        </RangeSlider>
      </Box>

      <Divider />

      {/* Categories */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Categories
        </Text>
        <CheckboxGroup value={selectedCategories} onChange={setSelectedCategories}>
          <VStack align="start" spacing={2}>
            {categories.map((category) => (
              <Checkbox key={category} value={category} size="sm" colorScheme="brand">
                {category}
              </Checkbox>
            ))}
          </VStack>
        </CheckboxGroup>
      </Box>

      <Divider />

      {/* Condition */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Condition
        </Text>
        <CheckboxGroup value={selectedConditions} onChange={setSelectedConditions}>
          <VStack align="start" spacing={2}>
            {conditions.map((condition) => (
              <Checkbox key={condition} value={condition} size="sm" colorScheme="brand">
                {condition}
              </Checkbox>
            ))}
          </VStack>
        </CheckboxGroup>
      </Box>

      <Divider />

      {/* Seller Rating */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Minimum Seller Rating
        </Text>
        <RadioGroup value={minRating.toString()} onChange={(value) => setMinRating(Number(value))}>
          <VStack align="start" spacing={2}>
            {[4, 3, 2, 1, 0].map((rating) => (
              <Radio key={rating} value={rating.toString()} size="sm" colorScheme="brand">
                <HStack spacing={1}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      boxSize={3}
                      color={i < rating ? 'yellow.400' : 'gray.300'}
                    />
                  ))}
                  <Text fontSize="sm" ml={1}>
                    {rating > 0 ? `${rating}+ stars` : 'Any rating'}
                  </Text>
                </HStack>
              </Radio>
            ))}
          </VStack>
        </RadioGroup>
      </Box>

      <Divider />

      {/* Shipping Options */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Shipping
        </Text>
        <CheckboxGroup value={shippingOptions} onChange={setShippingOptions}>
          <VStack align="start" spacing={2}>
            {shipping.map((option) => (
              <Checkbox key={option} value={option} size="sm" colorScheme="brand">
                {option}
              </Checkbox>
            ))}
          </VStack>
        </CheckboxGroup>
      </Box>

      <VStack spacing={3} pt={4}>
        <Button colorScheme="brand" onClick={handleApplyFilters} w="100%" size="md">
          Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="outline" onClick={handleClearFilters} w="100%" size="sm">
            Clear All Filters
          </Button>
        )}
      </VStack>
    </VStack>
  );

  return (
    <Box
      bg={bg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      h="fit-content"
      position="sticky"
      top={4}
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">
          Filters {activeFiltersCount > 0 && (
            <Badge colorScheme="brand" ml={2} borderRadius="full">
              {activeFiltersCount}
            </Badge>
          )}
        </Heading>
        <IconButton
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          onClick={onClose}
          display={{ base: 'flex', lg: 'none' }}
        />
      </Flex>

      <FilterContent />
    </Box>
  );
};

// Loading Skeleton Component
const ProductSkeleton = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card>
        <Flex>
          <Skeleton width="200px" height="200px" />
          <CardBody flex="1">
            <VStack align="start" spacing={3}>
              <Skeleton height="20px" width="80%" />
              <Skeleton height="16px" width="60%" />
              <HStack>
                <Skeleton height="20px" width="60px" />
                <Skeleton height="20px" width="80px" />
              </HStack>
              <Skeleton height="16px" width="70%" />
            </VStack>
          </CardBody>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Skeleton height="200px" />
      <CardBody>
        <VStack align="start" spacing={3}>
          <Skeleton height="20px" width="90%" />
          <Skeleton height="16px" width="70%" />
          <HStack>
            <Skeleton height="20px" width="60px" />
            <Skeleton height="20px" width="40px" />
          </HStack>
          <Skeleton height="32px" width="100%" />
        </VStack>
      </CardBody>
    </Card>
  );
};

// Main ProductsPage Component
const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('best_match');
  const [filters, setFilters] = useState({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [error, setError] = useState(null);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const toast = useToast();
  const queryClient = useQueryClient();

  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Load saved items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedItems');
    if (saved) {
      setSavedItems(JSON.parse(saved));
    }
    
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save items to localStorage
  const handleSaveItem = useCallback((productId) => {
    setSavedItems(prev => {
      const newSaved = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem('savedItems', JSON.stringify(newSaved));
      return newSaved;
    });
  }, []);

  // Search function with error handling
  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add to search history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock data based on search query
      const filtered = mockProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setProducts(filtered);
      
      if (filtered.length === 0) {
        toast({
          title: 'No results found',
          description: `No products found for "${query}". Try different keywords.`,
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      setError('Search failed. Please try again.');
      toast({
        title: 'Search failed',
        description: 'Please check your connection and try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchHistory, toast]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (filters.priceRange) {
      filtered = filtered.filter(p => 
        p.price.value >= filters.priceRange[0] && p.price.value <= filters.priceRange[1]
      );
    }
    
    if (filters.conditions?.length > 0) {
      filtered = filtered.filter(p => filters.conditions.includes(p.condition));
    }
    
    if (filters.categories?.length > 0) {
      filtered = filtered.filter(p => filters.categories.includes(p.category));
    }
    
    if (filters.minRating > 0) {
      filtered = filtered.filter(p => p.seller.rating >= filters.minRating);
    }
    
    if (filters.shipping?.includes('Free shipping')) {
      filtered = filtered.filter(p => p.shipping.cost === 0);
    }
    
    return filtered;
  }, [products, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.price.value - b.price.value);
      case 'price_high':
        return sorted.sort((a, b) => b.price.value - a.price.value);
      case 'rating':
        return sorted.sort((a, b) => b.seller.rating - a.seller.rating);
      case 'discount':
        return sorted.sort((a, b) => b.discount - a.discount);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      filters.conditions?.length > 0,
      filters.categories?.length > 0,
      filters.minRating > 0,
      filters.shipping?.length > 0,
      filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000),
    ].filter(Boolean).length;
  }, [filters]);

  return (
    <Box bg={bg} minH="100vh">
      <Container maxW="container.xl" py={8}>
        {/* Enhanced Search Header */}
        <VStack spacing={6} mb={8}>
          <Box w="100%" maxW="3xl">
            <VStack spacing={4}>
              <InputGroup size="lg">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search for products on eBay..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  bg={cardBg}
                  borderColor="gray.300"
                  borderWidth="2px"
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{ 
                    borderColor: 'brand.500', 
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' 
                  }}
                  fontSize="md"
                />
                <InputRightElement width="5rem">
                  <Button
                    h="2rem"
                    size="sm"
                    colorScheme="brand"
                    onClick={() => handleSearch()}
                    isLoading={isLoading}
                    loadingText="..."
                  >
                    Search
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <Box w="100%">
                  <Text fontSize="sm" color="gray.600" mb={2}>Recent searches:</Text>
                  <Wrap>
                    {searchHistory.map((term, index) => (
                      <WrapItem key={index}>
                        <Tag
                          size="sm"
                          variant="subtle"
                          colorScheme="brand"
                          cursor="pointer"
                          onClick={() => {
                            setSearchQuery(term);
                            handleSearch(term);
                          }}
                          _hover={{ bg: 'brand.100' }}
                        >
                          <TagLabel>{term}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </VStack>
          </Box>

          {/* Enhanced Controls */}
          <Flex
            w="100%"
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={4}
          >
            <HStack spacing={4} flexWrap="wrap">
              <Button
                leftIcon={<FilterIcon />}
                variant="outline"
                onClick={() => setIsFiltersOpen(true)}
                display={{ base: 'flex', lg: 'none' }}
                position="relative"
              >
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    colorScheme="red"
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  View:
                </Text>
                <IconButton
                  icon={<GridIcon />}
                  size="sm"
                  variant={viewMode === 'grid' ? 'solid' : 'outline'}
                  colorScheme="brand"
                  onClick={() => setViewMode('grid')}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                />
                <IconButton
                  icon={<ListIcon />}
                  size="sm"
                  variant={viewMode === 'list' ? 'solid' : 'outline'}
                  colorScheme="brand"
                  onClick={() => setViewMode('list')}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                />
              </HStack>
              
              {savedItems.length > 0 && (
                <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
                  {savedItems.length} saved
                </Badge>
              )}
            </HStack>

            <HStack spacing={4} flexWrap="wrap">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {sortedProducts.length} result{sortedProducts.length !== 1 ? 's' : ''}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied)`}
              </Text>
              
              <Select
                size="sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                w="220px"
                bg={cardBg}
                borderColor="gray.300"
                _hover={{ borderColor: 'brand.400' }}
              >
                <option value="best_match">Best Match</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Best Deals</option>
                <option value="newest">Newest First</option>
              </Select>
            </HStack>
          </Flex>
        </VStack>

        {/* Error Display */}
        {error && (
          <Alert status="error" mb={6} borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              ml="auto"
              size="sm"
              leftIcon={<RepeatIcon />}
              onClick={() => handleSearch()}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Main Content */}
        <Grid
          templateColumns={{ base: '1fr', lg: '320px 1fr' }}
          gap={8}
          alignItems="start"
        >
          {/* Filters Sidebar - Desktop */}
          <GridItem display={{ base: 'none', lg: 'block' }}>
            <FiltersSidebar
              filters={filters}
              onFiltersChange={setFilters}
              isOpen={true}
              onClose={() => {}}
            />
          </GridItem>

          {/* Products Grid */}
          <GridItem>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <MotionGrid
                  key="loading"
                  columns={{ base: 1, sm: 2, md: viewMode === 'grid' ? 3 : 1, xl: viewMode === 'grid' ? 4 : 1 }}
                  spacing={6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} viewMode={viewMode} />
                  ))}
                </MotionGrid>
              ) : sortedProducts.length > 0 ? (
                <MotionGrid
                  key="products"
                  columns={{ base: 1, sm: 2, md: viewMode === 'grid' ? 3 : 1, xl: viewMode === 'grid' ? 4 : 1 }}
                  spacing={6}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, staggerChildren: 0.1 }}
                >
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onSave={handleSaveItem}
                        savedItems={savedItems}
                      />
                    </motion.div>
                  ))}
                </MotionGrid>
              ) : (
                <Center py={20}>
                  <VStack spacing={4}>
                    <SearchIcon boxSize={16} color="gray.400" />
                    <Heading size="lg" color="gray.500">
                      No products found
                    </Heading>
                    <Text color="gray.500" textAlign="center" maxW="md">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </Text>
                    <Button
                      colorScheme="brand"
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({});
                        setProducts(mockProducts);
                      }}
                    >
                      Clear Search & Filters
                    </Button>
                  </VStack>
                </Center>
              )}
            </AnimatePresence>
          </GridItem>
        </Grid>

        {/* Mobile Filters Drawer */}
        <Drawer
          isOpen={isFiltersOpen}
          placement="left"
          onClose={() => setIsFiltersOpen(false)}
          size="sm"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              Filters
              {activeFiltersCount > 0 && (
                <Badge colorScheme="brand" ml={2} borderRadius="full">
                  {activeFiltersCount}
                </Badge>
              )}
            </DrawerHeader>

            <DrawerBody>
              <FiltersSidebar
                filters={filters}
                onFiltersChange={setFilters}
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Container>
    </Box>
  );
};

export default ProductsPage;