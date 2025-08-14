import { Box, Flex, Heading, Text, Image, Badge, Link, useColorModeValue } from '@chakra-ui/react';
import { FiExternalLink, FiHeart, FiStar, FiShoppingCart } from 'react-icons/fi';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBorderColor = useColorModeValue('primary.300', 'primary.500');
  const ratingColor = useColorModeValue('yellow.500', 'yellow.400');

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Calculate savings percentage if original price is available
  const savingsPercentage = product.originalPrice && product.price < product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <Flex
        direction={{ base: 'column', md: 'row' }}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        _hover={{
          borderColor: hoverBorderColor,
          boxShadow: 'md',
          transform: 'translateY(-2px)',
        }}
        transition="all 0.2s"
        h="full"
      >
        {/* Product Image */}
        <Box
          w={{ base: '100%', md: '240px' }}
          h={{ base: '200px', md: 'auto' }}
          flexShrink={0}
          position="relative"
        >
          <Image
            src={product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.title}
            objectFit="contain"
            w="100%"
            h="100%"
            p={4}
          />
          {savingsPercentage > 0 && (
            <Badge
              position="absolute"
              top={2}
              right={2}
              bg="red.500"
              color="white"
              borderRadius="full"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="bold"
            >
              {savingsPercentage}% OFF
            </Badge>
          )}
        </Box>

        {/* Product Details */}
        <Flex direction="column" flex={1} p={4}>
          <Flex justify="space-between" align="start" mb={2}>
            <Box>
              <Link
                href={product.url}
                isExternal
                _hover={{ textDecoration: 'none' }}
                color={useColorModeValue('gray.800', 'white')}
              >
                <Heading as="h3" size="md" mb={2} lineHeight="short">
                  {product.title}
                  <FiExternalLink style={{ display: 'inline-block', marginLeft: '8px' }} size={16} />
                </Heading>
              </Link>
              
              {product.brand && (
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={2}>
                  Brand: {product.brand}
                </Text>
              )}
            </Box>
            
            <Box textAlign="right">
              <Flex align="center" justify="flex-end" mb={1}>
                <Box as="span" fontSize="xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                  {formatPrice(product.price)}
                </Box>
                {savingsPercentage > 0 && (
                  <Box as="span" ml={2} textDecoration="line-through" color="gray.500" fontSize="sm">
                    {formatPrice(product.originalPrice)}
                  </Box>
                )}
              </Flex>
              
              {product.shippingCost && (
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  + {formatPrice(product.shippingCost)} shipping
                </Text>
              )}
            </Box>
          </Flex>

          {/* Rating and Reviews */}
          {product.rating && product.reviewCount && (
            <Flex align="center" mb={3}>
              <Box display="flex" alignItems="center" mr={2}>
                <FiStar color={ratingColor} fill={ratingColor} />
                <Text ml={1} fontWeight="medium">
                  {product.rating.toFixed(1)}
                </Text>
              </Box>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                ({product.reviewCount.toLocaleString()} reviews)
              </Text>
            </Flex>
          )}

          {/* Condition */}
          {product.condition && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
              Condition: <Badge colorScheme={product.condition === 'New' ? 'green' : 'orange'}>{product.condition}</Badge>
            </Text>
          )}

          {/* Seller Info */}
          {product.seller && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
              Sold by: {product.seller}
            </Text>
          )}

          {/* Actions */}
          <Flex mt="auto" pt={2} justify="space-between" align="center" borderTopWidth="1px" borderColor={borderColor}>
            <Flex>
              <Button
                leftIcon={<FiHeart />}
                variant="ghost"
                size="sm"
                colorScheme="pink"
                mr={2}
              >
                Save
              </Button>
              <Button
                leftIcon={<FiShoppingCart />}
                variant="outline"
                size="sm"
                colorScheme="primary"
              >
                Add to Cart
              </Button>
            </Flex>
            
            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
              {product.timeLeft || 'Limited time deal'}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  // Default grid view
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      _hover={{
        borderColor: hoverBorderColor,
        boxShadow: 'md',
        transform: 'translateY(-4px)',
      }}
      transition="all 0.2s"
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Product Image */}
      <Box position="relative" pt="100%" bg={useColorModeValue('gray.50', 'gray.700')}>
        <Box position="absolute" top={0} left={0} right={0} bottom={0} p={4}>
          <Image
            src={product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.title}
            objectFit="contain"
            w="100%"
            h="100%"
          />
        </Box>
        
        {savingsPercentage > 0 && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            bg="red.500"
            color="white"
            borderRadius="full"
            px={2}
            py={1}
            fontSize="xs"
            fontWeight="bold"
          >
            {savingsPercentage}% OFF
          </Badge>
        )}
        
        <Button
          position="absolute"
          bottom={2}
          right={2}
          size="sm"
          colorScheme="pink"
          variant="ghost"
          p={1}
          minW="auto"
          h="auto"
          borderRadius="full"
        >
          <FiHeart size={18} />
        </Button>
      </Box>

      {/* Product Details */}
      <Box p={4} flex={1} display="flex" flexDirection="column">
        <Link
          href={product.url}
          isExternal
          _hover={{ textDecoration: 'none' }}
          color={useColorModeValue('gray.800', 'white')}
          mb={2}
        >
          <Heading as="h3" size="sm" noOfLines={2} lineHeight="short">
            {product.title}
          </Heading>
        </Link>
        
        {/* Rating */}
        {product.rating && product.reviewCount && (
          <Flex align="center" mb={2}>
            <Box display="flex" alignItems="center" mr={1}>
              <FiStar color={ratingColor} fill={ratingColor} size={14} />
              <Text ml={1} fontSize="sm" fontWeight="medium">
                {product.rating.toFixed(1)}
              </Text>
            </Box>
            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
              ({product.reviewCount.toLocaleString()})
            </Text>
          </Flex>
        )}
        
        {/* Price */}
        <Box mt="auto">
          <Flex align="center" mb={1}>
            <Box as="span" fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
              {formatPrice(product.price)}
            </Box>
            {savingsPercentage > 0 && (
              <Box as="span" ml={2} textDecoration="line-through" color="gray.500" fontSize="sm">
                {formatPrice(product.originalPrice)}
              </Box>
            )}
          </Flex>
          
          {product.shippingCost && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={2}>
              + {formatPrice(product.shippingCost)} shipping
            </Text>
          )}
          
          {product.condition && (
            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={2}>
              <Badge colorScheme={product.condition === 'New' ? 'green' : 'orange'} fontSize="0.6em" mr={1}>
                {product.condition}
              </Badge>
              {product.timeLeft && ` • ${product.timeLeft}`}
            </Text>
          )}
          
          <Button
            leftIcon={<FiShoppingCart />}
            colorScheme="primary"
            size="sm"
            w="full"
            mt={2}
          >
            Add to Cart
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductCard;
