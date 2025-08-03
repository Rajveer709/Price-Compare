import React from 'react';
import { 
  Box, 
  SimpleGrid, 
  Skeleton, 
  VStack, 
  HStack, 
  Divider 
} from '@chakra-ui/react';

export const ProductCardSkeleton = () => (
  <Box 
    bg="white" 
    borderRadius="lg" 
    overflow="hidden" 
    borderWidth="1px" 
    borderColor="gray.200"
    _dark={{
      bg: 'gray.800',
      borderColor: 'gray.700'
    }}
  >
    <Skeleton height="180px" width="100%" />
    <Box p={4}>
      <VStack align="stretch" spacing={3}>
        <Skeleton height="24px" width="80%" />
        <Skeleton height="16px" width="60%" />
        <Divider />
        <HStack justify="space-between">
          <Skeleton height="24px" width="80px" />
          <Skeleton height="20px" width="60px" />
        </HStack>
        <Skeleton height="40px" width="100%" borderRadius="md" mt={2} />
      </VStack>
    </Box>
  </Box>
);

export const FilterSkeleton = () => (
  <VStack spacing={4} align="stretch" mb={6}>
    <HStack spacing={4} wrap="wrap">
      <Skeleton height="40px" width="200px" borderRadius="md" />
      <Skeleton height="40px" width="150px" borderRadius="md" />
      <Skeleton height="40px" width="120px" borderRadius="md" />
    </HStack>
    <HStack spacing={4}>
      <Skeleton height="40px" width="100%" borderRadius="md" />
      <Skeleton height="40px" width="100px" borderRadius="md" />
    </HStack>
  </VStack>
);

export const ProductsGridSkeleton = ({ count = 6 }) => (
  <SimpleGrid 
    columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
    spacing={6}
    width="100%"
  >
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </SimpleGrid>
);

export default ProductsGridSkeleton;
