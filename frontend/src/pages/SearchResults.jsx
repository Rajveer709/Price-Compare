import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Select,
  Stack,
  useColorModeValue,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import { FiFilter, FiGrid, FiList, FiAlertCircle } from 'react-icons/fi';
import ProductCard from '../components/products/ProductCard';
import FilterSidebar from '../components/filters/FilterSidebar';
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [filters, setFilters] = useState({
    sort: 'best_match',
    minPrice: '',
    maxPrice: '',
    condition: [],
    freeShipping: false,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch products based on search query and filters
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => searchProducts(query, filters),
    enabled: !!query, // Only run query when there's a search term
    retry: 3,
  });

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error loading products',
        description: error.message || 'Failed to load search results',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isError, error, toast]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Container maxW="container.xl" py={6}>
      {/* Search Header */}
      <Box mb={6}>
        <Heading as="h1" size="lg" mb={2}>
          {query ? `Results for "${query}"` : 'Search Products'}
        </Heading>
        <Text color={useColorModeValue('gray.600', 'gray.400')}>
          {data?.totalResults ? `${data.totalResults} items found` : 'Search for products to see results'}
        </Text>
      </Box>

      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        {/* Filters Sidebar - Mobile */}
        <Box
          display={{ base: showFilters ? 'block' : 'none', md: 'block' }}
          position={{ base: 'fixed', md: 'sticky' }}
          top={{ base: 0, md: '100px' }}
          left={0}
          right={0}
          bottom={0}
          bg={bgColor}
          zIndex={20}
          p={{ base: 4, md: 0 }}
          overflowY="auto"
          maxH={{ base: '100vh', md: 'calc(100vh - 120px)' }}
          borderRight={{ md: '1px solid' }}
          borderColor={{ md: borderColor }}
          w={{ base: '100%', md: '280px' }}
          flexShrink={0}
        >
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        </Box>

        {/* Main Content */}
        <Box flex={1}>
          {/* Toolbar */}
          <Flex
            justify="space-between"
            align="center"
            mb={6}
            p={3}
            bg={bgColor}
            borderRadius="md"
            border="1px"
            borderColor={borderColor}
          >
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              {data?.totalResults ? `Showing ${data.products?.length} of ${data.totalResults} results` : 'No results'}
            </Text>
            
            <Flex align="center" gap={4}>
              <Button
                leftIcon={<FiFilter />}
                variant="outline"
                size="sm"
                display={{ base: 'flex', md: 'none' }}
                onClick={toggleFilters}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              <Select
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                size="sm"
                width="200px"
                variant="outline"
              >
                <option value="best_match">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="ending_soonest">Ending Soonest</option>
              </Select>
              
              <Flex borderWidth="1px" borderRadius="md" overflow="hidden">
                <IconButton
                  icon={<FiGrid />}
                  size="sm"
                  variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'grid' ? 'primary' : 'gray'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  borderRadius="none"
                />
                <IconButton
                  icon={<FiList />}
                  size="sm"
                  variant={viewMode === 'list' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'list' ? 'primary' : 'gray'}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  borderRadius="none"
                  borderLeftWidth="1px"
                  borderColor="inherit"
                />
              </Flex>
            </Flex>
          </Flex>

          {/* Results */}
          {isLoading ? (
            <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }} gap={6}>
              {[...Array(8)].map((_, i) => (
                <GridItem key={i}>
                  <Skeleton height="350px" borderRadius="md" />
                </GridItem>
              ))}
            </Grid>
          ) : isError ? (
            <Box textAlign="center" py={10}>
              <Box as={FiAlertCircle} size={12} color="red.500" mx="auto" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Failed to load products
              </Text>
              <Text color={useColorModeValue('gray.600', 'gray.400')} mb={4}>
                {error?.message || 'An error occurred while fetching products.'}
              </Text>
              <Button colorScheme="primary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Box>
          ) : data?.products?.length > 0 ? (
            <Grid
              templateColumns={
                viewMode === 'list' 
                  ? '1fr' 
                  : { base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }
              }
              gap={6}
            >
              {data.products.map((product) => (
                <GridItem key={product.id}>
                  <ProductCard product={product} viewMode={viewMode} />
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={20}>
              <Text fontSize="xl" fontWeight="medium" mb={2}>
                No products found
              </Text>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Try adjusting your search or filter criteria
              </Text>
            </Box>
          )}

          {/* Pagination */}
          {data?.totalResults > 0 && (
            <Flex justify="center" mt={10}>
              <Stack direction="row" spacing={2}>
                <Button size="sm" disabled={!data?.pagination?.previousPage}>
                  Previous
                </Button>
                {data?.pagination?.pages?.map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    colorScheme={data.pagination.currentPage === page ? 'primary' : 'gray'}
                    variant={data.pagination.currentPage === page ? 'solid' : 'outline'}
                  >
                    {page}
                  </Button>
                ))}
                <Button size="sm" disabled={!data?.pagination?.nextPage}>
                  Next
                </Button>
              </Stack>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default SearchResults;
