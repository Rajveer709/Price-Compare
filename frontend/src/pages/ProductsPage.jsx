import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { 
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Flex,
  Grid,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuOptionGroup,
  MenuItemOption,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  VStack,
  StackDivider,
  Badge,
  useColorModeValue,
  useToast,
  useDisclosure,
  useBreakpointValue,
  ScaleFade,
  Fade,
  SlideFade,
  FormControl,
  FormLabel,
  useOutsideClick,
  FormErrorMessage,
  FormHelperText,
  Checkbox,
  CheckboxGroup,
  Tooltip,
  Center,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Avatar,
  AvatarBadge,
  AvatarGroup,
  Wrap,
  WrapItem,
  useColorMode,
  Icon,
  Divider,
  Collapse,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  TabIndicator,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Tag,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
  TagCloseButton,
  useClipboard,
  usePrefersReducedMotion,
  useTheme,
  useStyleConfig,
  useMultiStyleConfig,
  useToken,
  useMediaQuery
} from '@chakra-ui/react';
import { motion, AnimatePresence, AnimateSharedLayout } from 'framer-motion';
import { ProductsGridSkeleton, FilterSkeleton } from '../components/SkeletonLoader';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};
import { 
  AddIcon, 
  ExternalLinkIcon, 
  SearchIcon, 
  CloseIcon, 
  ChevronDownIcon, 
  StarIcon, 
  CheckIcon, 
  RepeatIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowDownIcon, 
  ArrowUpIcon,
  HomeIcon
} from '@chakra-ui/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

// Animation for loading cards
const cardFadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

function ProductCard({ product }) {
  // Default to in_stock: true if not specified
  const isInStock = product.in_stock !== false;
  const [isHovered, setIsHovered] = useState(false);
  
  // Helper function to get the appropriate URL
  const getProductUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('https')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return null;
  };

  const productUrl = getProductUrl(product.url);
  const hasValidUrl = productUrl && (productUrl.startsWith('http') || productUrl.startsWith('/'));
  const hasDiscount = product.original_price && product.original_price > (product.price || 0);
  const discountPercentage = hasDiscount 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0;

  // Theme values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('white', 'gray.750');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  return (
    <Box 
      position="relative"
      h="100%"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <Box
          position="absolute"
          top="12px"
          right="12px"
          bg="red.500"
          color="white"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          fontWeight="bold"
          zIndex="1"
          boxShadow="sm"
          transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
          transition="all 0.2s ease-in-out"
        >
          {discountPercentage}% OFF
        </Box>
      )}
      
      <Card 
        variant="elevated"
        h="100%"
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
        position="relative"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{ 
          transform: 'translateY(-8px)',
          boxShadow: `0 10px 25px -5px ${shadowColor}, 0 8px 10px -6px ${shadowColor}`,
          borderColor: 'brand.400',
        }}
      >
        {/* Product Image */}
        <Box 
          h="180px" 
          bg={useColorModeValue('gray.100', 'gray.700')} 
          position="relative"
          overflow="hidden"
        >
          {product.image_url ? (
            <Box
              as="img"
              src={product.image_url}
              alt={product.name}
              objectFit="cover"
              w="100%"
              h="100%"
              transition="transform 0.5s ease-in-out"
              transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
            />
          ) : (
            <Center h="100%" color={mutedColor}>
              <ImageIcon boxSize={10} />
            </Center>
          )}
          
          {/* Stock Status Overlay */}
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            bg={isInStock ? 'green.500' : 'red.500'}
            color="white"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="medium"
            textAlign="center"
            opacity="0.95"
          >
            {isInStock ? 'In Stock' : 'Out of Stock'}
          </Box>
        </Box>

        <CardHeader pb={2} px={4} pt={4}>
          <Heading 
            size="md" 
            noOfLines={2} 
            minH="3.5rem" 
            lineHeight="1.3"
            fontWeight="semibold"
            color={useColorModeValue('gray.800', 'white')}
            transition="color 0.2s"
            _hover={{ color: 'brand.500' }}
          >
            {product.name}
          </Heading>
          
          {/* Rating */}
          {product.rating && (
            <HStack mt={2} spacing={1}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  color={star <= Math.round(product.rating) ? 'yellow.400' : 'gray.300'}
                  boxSize={4}
                />
              ))}
              <Text fontSize="sm" color={mutedColor} ml={1}>
                ({product.review_count || '0'})
              </Text>
            </HStack>
          )}
        </CardHeader>
        
        <CardBody px={4} py={2}>
          <Text 
            fontSize="sm" 
            color={textColor} 
            mb={4} 
            noOfLines={3} 
            minH="4.5rem"
          >
            {product.description || 'No description available'}
          </Text>
          
          {/* Price Section */}
          <Box mt="auto">
            <Flex alignItems="center" flexWrap="wrap">
              <Text 
                as="span" 
                fontSize="xl" 
                fontWeight="bold" 
                color="brand.500"
                mr={2}
              >
                ${product.price ? Number(product.price).toFixed(2) : 'N/A'}
              </Text>
              
              {hasDiscount && (
                <>
                  <Text 
                    as="s" 
                    fontSize="sm" 
                    color={mutedColor} 
                    mr={2}
                  >
                    ${Number(product.original_price).toFixed(2)}
                  </Text>
                </>
              )}
              
              {product.shipping_info && (
                <Badge 
                  colorScheme="green" 
                  variant="subtle" 
                  fontSize="xs"
                  ml="auto"
                >
                  {product.shipping_info}
                </Badge>
              )}
            </Flex>
            
            {product.last_updated && (
              <Text fontSize="xs" color={mutedColor} mt={1}>
                Updated: {new Date(product.last_updated).toLocaleDateString()}
              </Text>
            )}
          </Box>
        </CardBody>
        
        <CardFooter p={4} pt={0}>
          <Button
            as="a"
            href={hasValidUrl ? productUrl : '#'}
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<ExternalLinkIcon />}
            colorScheme="brand"
            size="md"
            width="100%"
            isDisabled={!hasValidUrl}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            transition="all 0.2s"
            borderRadius="lg"
            py={2}
            height="auto"
          >
            {hasValidUrl ? 'View on Store' : 'No URL Available'}
          </Button>
        </CardFooter>
      </Card>
    </Box>
  );
}

function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    source: 'amazon',
    price: '',
    description: '',
    category: 'Electronics',
    in_stock: true
  });
  
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch products with error boundary and loading states
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await productService.getAllProducts({ 
          signal: controller.signal 
        });
        
        if (isMounted) {
          setProducts(response.data);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
          setError(null);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching products:', err);
          setError('Failed to load products. Please try again later.');
          toast({
            title: 'Error',
            description: 'Failed to load products',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right'
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Small delay to prevent flashing on fast networks

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [toast]);

  // Filter and sort products with debounce
  const filteredAndSortedProducts = useMemo(() => {
    setIsFiltering(true);
    let result = [...products];

    // Apply search with debounce
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          product.category?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    const activeFilters = {};
    
    if (filters.inStock) {
      result = result.filter((product) => product.in_stock);
      activeFilters.inStock = true;
    }
    
    if (filters.category) {
      result = result.filter((product) => 
        product.category?.toLowerCase() === filters.category.toLowerCase()
      );
      activeFilters.category = filters.category;
    }
    
    if (filters.minPrice) {
      const min = Number(filters.minPrice);
      result = result.filter((product) => product.price >= min);
      activeFilters.minPrice = min;
    }
    
    if (filters.maxPrice) {
      const max = Number(filters.maxPrice);
      result = result.filter((product) => product.price <= max);
      activeFilters.maxPrice = max;
    }

    // Update applied filters
    setAppliedFilters(activeFilters);

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name?.localeCompare(b.name) || 0;
      } else if (sortBy === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'rating') {
        comparison = (a.rating || 0) - (b.rating || 0);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Update total pages based on filtered results
    const totalFilteredItems = result.length;
    setTotalPages(Math.ceil(totalFilteredItems / itemsPerPage) || 1);
    
    // Reset to first page if current page is invalid
    if (page > Math.ceil(totalFilteredItems / itemsPerPage)) {
      setPage(1);
    }
    
    // Pagination
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedResult = result.slice(startIndex, startIndex + itemsPerPage);
    
    // Small delay to show loading state for better UX
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 300);
    
    return () => clearTimeout(timer);
    
    return paginatedResult;
  }, [products, searchQuery, filters, sortBy, sortOrder, page, itemsPerPage]);
  
  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    products.forEach((product) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const mutation = useMutation({
    mutationFn: (data) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast({
        title: 'Product added',
        description: 'The product has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Product</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Product Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Price ($)</FormLabel>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Product URL</FormLabel>
                <Input
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com/product"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Source</FormLabel>
                <Select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="amazon">Amazon</option>
                  <option value="flipkart">Flipkart</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Electronics, Clothing"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Stock Status</FormLabel>
                <Select
                  name="in_stock"
                  value={formData.in_stock}
                  onChange={(e) => setFormData({
                    ...formData,
                    in_stock: e.target.value === 'true'
                  })}
                >
                  <option value={true}>In Stock</option>
                  <option value={false}>Out of Stock</option>
                </Select>
              </FormControl>
              
              <FormControl gridColumn={{ base: '1 / -1', md: '1 / -1' }}>
                <FormLabel>Description</FormLabel>
                <Input
                  as="textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows={3}
                />
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              isLoading={mutation.isLoading}
              isDisabled={!formData.name || !formData.url || !formData.price}
            >
              Add Product
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default function ProductsPage() {
  // State management
  const [products, setProducts] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    inStock: false,
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  
  // Refs and hooks
  const filterPanelRef = useRef();
  const filterButtonRef = useRef();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Close filter panel when clicking outside
  useOutsideClick({
    ref: filterPanelRef,
    handler: (event) => {
      if (isFilterPanelOpen && !filterButtonRef.current?.contains(event.target)) {
        setIsFilterPanelOpen(false);
      }
    },
  });
  
  // Memoize the handler to prevent unnecessary re-renders
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);
  
  // Add missing dependency to useCallback
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));  
  }, [setFilters]);
  
  // Memoize the filtered products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      if (!product || typeof product !== 'object') return false;
      
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = product.name?.toLowerCase().includes(searchTermLower) ||
                         product.description?.toLowerCase().includes(searchTermLower);
      
      const matchesFilters = Object.entries(appliedFilters).every(([key, value]) => {
        if (!value && value !== false) return true;
        if (key === 'inStock') return product.inStock === value;
        if (key === 'category') return product.category === value;
        if (key === 'minPrice') return Number(product.price) >= Number(value);
        if (key === 'maxPrice') return Number(product.price) <= Number(value);
        return true;
      });
      
      return matchesSearch && matchesFilters;
    });
  }, [products, debouncedSearchTerm, appliedFilters]);
  
  // Handle smooth scroll to top on page/filter change
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
    
    const timer = setTimeout(scrollToTop, 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, [page, filters, sortBy, sortOrder, isFilterPanelOpen]);
  
  // Define prop types for components
  const ProductCardProps = {
    product: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      imageUrl: PropTypes.string,
      url: PropTypes.string,
      source: PropTypes.string,
      rating: PropTypes.number,
      reviewCount: PropTypes.number,
      inStock: PropTypes.bool,
      category: PropTypes.string,
      lastUpdated: PropTypes.string,
      description: PropTypes.string
    }).isRequired,
  };
  
  const AddProductModalProps = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
  };
  
  // Assign prop types to components
  ProductCard.propTypes = ProductCardProps;
  AddProductModal.propTypes = AddProductModalProps;
  
  // Animation variants for grid items with spring effect
  const gridItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 0.5
      }
    }),
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { 
        duration: 0.15,
        ease: 'easeIn'
      }
    },
    hover: {
      y: -5,
      boxShadow: 'lg',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };
  
  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Fetch products
  const { 
    data: productsData, 
    isLoading, 
    isError, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['products', { page, search: debouncedSearchTerm, sortBy, sortOrder }],
    queryFn: () => productService.getProducts({ 
      page, 
      search: debouncedSearchTerm,
      sortBy,
      sortOrder
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Theme values - Enhanced for better contrast and visual hierarchy
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.300', 'gray.500');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const mutedText = useColorModeValue('gray.600', 'gray.300');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerShadow = useColorModeValue('sm', 'dark-lg');
  const brandColor = useColorModeValue('brand.500', 'brand.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('gray.200', 'gray.600');
  const subtleBg = useColorModeValue('gray.50', 'gray.900');
  const shadow = useColorModeValue('sm', 'dark-lg');
  const cardShadow = useColorModeValue('md', 'xl');
  const prefersReducedMotion = usePrefersReducedMotion();
  const theme = useTheme();
  
  // Animation variants
  const fadeIn = prefersReducedMotion
    ? { opacity: 1 }
    : {
        opacity: 0,
        y: 20,
        transition: { duration: 0.3, ease: 'easeOut' },
      };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Handle error state
  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading products</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load products. Please try again later.'}
            </AlertDescription>
          </Box>
        </Alert>
        <Button 
          colorScheme="brand" 
          onClick={() => queryClient.refetchQueries(['products'])}
          leftIcon={<RepeatIcon />}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Sticky Header */}
      <Box 
        as="header" 
        position="sticky" 
        top="0" 
        zIndex="sticky" 
        bg={headerBg}
        boxShadow={headerShadow}
        borderBottomWidth="1px"
        borderColor={borderColor}
        backdropFilter="blur(10px)"
        sx={{
          '@supports (backdrop-filter: blur(10px))': {
            bg: colorMode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 32, 44, 0.8)',
          },
        }}
      >
        <Container maxW="container.xl" py={3}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Button 
                as={RouterLink} 
                to="/" 
                variant="ghost" 
                leftIcon={<ChevronLeftIcon />}
                _hover={{ bg: hoverBg }}
                _active={{ bg: activeBg }}
                size={{ base: 'sm', md: 'md' }}
              >
                Back to Home
              </Button>
              <Button
                as={RouterLink}
                to="/"
                variant="ghost"
                leftIcon={<HomeIcon />}
                size={{ base: 'sm', md: 'md' }}
                _hover={{ bg: hoverBg }}
                _active={{ bg: activeBg }}
                display={{ base: 'none', md: 'flex' }}
              >
                Home
              </Button>
            </HStack>
            <HStack spacing={3}>
              <IconButton
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle color mode"
                _hover={{ bg: hoverBg }}
                _active={{ bg: activeBg }}
                size={{ base: 'sm', md: 'md' }}
              />
              <Button
                as={RouterLink}
                to="/products/new"
                colorScheme="brand"
                leftIcon={<AddIcon />}
                size={{ base: 'sm', md: 'md' }}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                transition="all 0.2s"
              >
                <Box as="span" display={{ base: 'none', md: 'inline' }}>Add Product</Box>
                <Box as="span" display={{ base: 'inline', md: 'none' }}><AddIcon /></Box>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8} px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          {/* Page Header */}
          <Box mb={6}>
            <Heading size="2xl" color={textColor} mb={2} fontWeight="bold">
              Tracked Products
            </Heading>
            <Text fontSize="lg" color={mutedText}>
              {productsData?.total || 'No'} product{productsData?.total !== 1 ? 's' : ''} found
              {searchTerm && ` matching "${searchTerm}"`}
            </Text>
          </Box>

          {/* Search and Filter Bar */}
          <Box
            mb={8}
            p={6}
            bg={sectionBg}
            borderRadius="xl"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            transition="all 0.2s"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-1px)'
            }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              {/* Search Input */}
              <Box flex="1">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search products by name, category, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{
                      borderColor: useColorModeValue('gray.300', 'gray.500'),
                    }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    }}
                    pr="4.5rem"
                    borderRadius="lg"
                  />
                  {searchQuery && (
                    <InputRightElement width="4.5rem">
                      <IconButton
                        aria-label="Clear search"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setSearchQuery('')}
                        colorScheme="gray"
                        borderRadius="full"
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>

              {/* Sort and Filter Buttons */}
              <HStack spacing={3}>
                {/* Sort Dropdown */}
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    minW={{ base: '100%', md: '200px' }}
                    textAlign="left"
                    size="lg"
                    id="sort-button"
                    _hover={{
                      bg: useColorModeValue('gray.100', 'gray.700'),
                    }}
                    _active={{
                      bg: useColorModeValue('gray.200', 'gray.600'),
                    }}
                  >
                    <Flex align="center">
                      <Box as={FiFilter} mr={2} />
                      <Text isTruncated>{getSortLabel()}</Text>
                    </Flex>
                  </MenuButton>
                  <MenuList minW="220px" zIndex="popover">
                    <MenuGroup title="Sort By" fontSize="sm" px={3} py={1} color="gray.500">
                      <MenuItem
                        onClick={() => {
                          setSortBy('price');
                          setSortOrder('asc');
                        }}
                        bg={sortBy === 'price' && sortOrder === 'asc' ? 'brand.50' : 'transparent'}
                        _dark={{
                          bg: sortBy === 'price' && sortOrder === 'asc' ? 'brand.800' : 'transparent',
                        }}
                      >
                        <Text>Price: Low to High</Text>
                        {sortBy === 'price' && sortOrder === 'asc' && (
                          <CheckIcon ml="auto" color="brand.500" />
                        )}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSortBy('price');
                          setSortOrder('desc');
                        }}
                        bg={sortBy === 'price' && sortOrder === 'desc' ? 'brand.50' : 'transparent'}
                        _dark={{
                          bg: sortBy === 'price' && sortOrder === 'desc' ? 'brand.800' : 'transparent',
                        }}
                      >
                        <Text>Price: High to Low</Text>
                        {sortBy === 'price' && sortOrder === 'desc' && (
                          <CheckIcon ml="auto" color="brand.500" />
                        )}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder('asc');
                        }}
                        bg={sortBy === 'name' && sortOrder === 'asc' ? 'brand.50' : 'transparent'}
                        _dark={{
                          bg: sortBy === 'name' && sortOrder === 'asc' ? 'brand.800' : 'transparent',
                        }}
                      >
                        <Text>Name: A to Z</Text>
                        {sortBy === 'name' && sortOrder === 'asc' && (
                          <CheckIcon ml="auto" color="brand.500" />
                        )}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder('desc');
                        }}
                        bg={sortBy === 'name' && sortOrder === 'desc' ? 'brand.50' : 'transparent'}
                        _dark={{
                          bg: sortBy === 'name' && sortOrder === 'desc' ? 'brand.800' : 'transparent',
                        }}
                      >
                        <Text>Name: Z to A</Text>
                        {sortBy === 'name' && sortOrder === 'desc' && (
                          <CheckIcon ml="auto" color="brand.500" />
                        )}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSortBy('rating');
                          setSortOrder('desc');
                        }}
                        bg={sortBy === 'rating' ? 'brand.50' : 'transparent'}
                        _dark={{
                          bg: sortBy === 'rating' ? 'brand.800' : 'transparent',
                        }}
                      >
                        <Text>Highest Rated</Text>
                        {sortBy === 'rating' && <CheckIcon ml="auto" color="brand.500" />}
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Menu>

                {/* Filter Button */}
                <Tooltip label="Filter products" placement="top" hasArrow>
                  <Button
                    ref={filterButtonRef}
                    leftIcon={<FiFilter />}
                    variant="outline"
                    size="lg"
                    onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    aria-label="Filter products"
                    bg={isFilterPanelOpen ? 'brand.50' : 'transparent'}
                    _dark={{
                      bg: isFilterPanelOpen ? 'brand.800' : 'transparent',
                    }}
                    _hover={{
                      bg: useColorModeValue('gray.100', 'gray.700'),
                    }}
                    _active={{
                      bg: useColorModeValue('gray.200', 'gray.600'),
                    }}
                  >
                    <Text display={{ base: 'none', md: 'block' }}>Filters</Text>
                    {Object.keys(appliedFilters).length > 0 && (
                      <Badge
                        ml={2}
                        colorScheme="brand"
                        borderRadius="full"
                        variant="solid"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                      >
                        {Object.keys(appliedFilters).length}
                      </Badge>
                    )}
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>

            {/* Filter Panel */}
            <Collapse in={isFilterPanelOpen} animateOpacity>
              <Box
                ref={filterPanelRef}
                mt={4}
                pt={4}
                borderTopWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <VStack align="stretch" spacing={6}>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Filters</Heading>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={clearAllFilters}
                      isDisabled={Object.keys(appliedFilters).length === 0}
                      leftIcon={<FiX />}
                    >
                      Clear All
                    </Button>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    {/* In Stock Toggle */}
                    <Box>
                      <FormControl display="flex" alignItems="center">
                        <Checkbox
                          id="in-stock"
                          isChecked={filters.inStock}
                          onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                          size="lg"
                          colorScheme="brand"
                        >
                          <Text fontWeight="medium">In Stock Only</Text>
                        </Checkbox>
                      </FormControl>
                    </Box>

                    {/* Category Filter */}
                    <Box>
                      <FormControl>
                        <FormLabel fontWeight="medium" htmlFor="category">
                          Category
                        </FormLabel>
                        <Select
                          id="category"
                          placeholder="All Categories"
                          value={filters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          size="lg"
                        >
                          {['Electronics', 'Fashion', 'Home Goods'].map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Price Range */}
                    <Box>
                      <FormLabel fontWeight="medium" display="block" mb={2}>
                        Price Range
                      </FormLabel>
                      <HStack spacing={3}>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filters.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            size="lg"
                          />
                        </FormControl>
                        <Box color="gray.500" flexShrink={0}>
                          <FiMinus />
                        </Box>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filters.maxPrice}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            size="lg"
                          />
                        </FormControl>
                      </HStack>
                    </Box>
                  </SimpleGrid>

                  {/* Applied Filters */}
                  {Object.keys(appliedFilters).length > 0 && (
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Active Filters:
                      </Text>
                      <Flex wrap="wrap" gap={2}>
                        {filters.inStock && (
                          <Badge
                            key="in-stock"
                            colorScheme="green"
                            px={3}
                            py={1}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                          >
                            In Stock
                            <IconButton
                              icon={<FiX size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="green"
                              ml={1}
                              onClick={() => handleFilterChange('inStock', false)}
                              aria-label="Remove in stock filter"
                            />
                          </Badge>
                        )}
                        {filters.category && (
                          <Badge
                            key="category"
                            colorScheme="blue"
                            px={3}
                            py={1}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                          >
                            {filters.category}
                            <IconButton
                              icon={<FiX size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              ml={1}
                              onClick={() => handleFilterChange('category', '')}
                              aria-label="Remove category filter"
                            />
                          </Badge>
                        )}
                        {(filters.minPrice || filters.maxPrice) && (
                          <Badge
                            key="price-range"
                            colorScheme="purple"
                            px={3}
                            py={1}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                          >
                            ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                            <IconButton
                              icon={<FiX size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="purple"
                              ml={1}
                              onClick={() => {
                                handleFilterChange('minPrice', '');
                                handleFilterChange('maxPrice', '');
                              }}
                              aria-label="Remove price filter"
                            />
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Collapse>

            <Box>
              {isLoading ? (
                <ProductsGridSkeleton count={12} />
              ) : error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Error loading products</AlertTitle>
                    <AlertDescription>{error.message || 'Failed to load products. Please try again later.'}</AlertDescription>
                  </Box>
                </Alert>
              ) : productsData?.data?.length > 0 ? (
                <>
                  <Grid
                    templateColumns={{
                      base: 'repeat(1, 1fr)',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)'
                    }}
                    gap={6}
                  >
                    {productsData.data.map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index % 10}
                        layout
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </Grid>
                  
                  {/* Pagination */}
                  {productsData?.data?.length > 0 && (
                    <Flex 
                      justify="space-between" 
                      align="center" 
                      mt={8}
                      flexDirection={{ base: 'column', sm: 'row' }}
                      gap={4}
                    >
                      <Text color={mutedText} fontSize="sm">
                        Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, productsData?.total || 0)} of {productsData?.total || 0} products
                      </Text>
                      
                      <HStack spacing={2}>
                        <Button
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          isDisabled={page === 1 || isLoading}
                          leftIcon={<ChevronLeftIcon />}
                          variant="outline"
                          size="sm"
                          _disabled={{
                            opacity: 0.5,
                            cursor: 'not-allowed',
                          }}
                        >
                          Previous
                        </Button>
                        
                        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                          {Array.from({ length: Math.min(5, productsData?.total_pages || 1) }, (_, i) => {
                            let pageNum;
                            if (productsData?.total_pages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= (productsData?.total_pages || 0) - 2) {
                              pageNum = (productsData?.total_pages || 0) - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                colorScheme={page === pageNum ? 'brand' : 'gray'}
                                variant={page === pageNum ? 'solid' : 'outline'}
                                size="sm"
                                minW="40px"
                                px={3}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          
                          {(productsData?.total_pages || 0) > 5 && page < (productsData?.total_pages || 0) - 2 && (
                            <Text px={2}>...</Text>
                          )}
                          
                          {(productsData?.total_pages || 0) > 5 && page < (productsData?.total_pages || 0) - 2 && (
                            <Button
                              onClick={() => setPage(productsData?.total_pages || 1)}
                              variant="outline"
                              size="sm"
                              minW="40px"
                              px={3}
                            >
                              {productsData?.total_pages}
                            </Button>
                          )}
                        </HStack>
                        
                        <Button
                          onClick={() => setPage((p) => p + 1)}
                          isDisabled={!productsData?.has_next_page || isLoading}
                          rightIcon={<ChevronRightIcon />}
                          variant="outline"
                          size="sm"
                          _disabled={{
                            opacity: 0.5,
                            cursor: 'not-allowed',
                          }}
                        >
                          Next
                        </Button>
                      </HStack>
                    </Flex>
                  )}
                </>
              ) : (
                <Box textAlign="center" py={20}>
                  <SearchIcon boxSize={8} color={mutedText} mb={4} />
                  <Heading size="md" mb={2} color={textColor}>
                    No products found
                  </Heading>
                  <Text color={mutedText} mb={6} maxW="md" mx="auto">
                    {searchTerm 
                      ? 'No products match your search. Try different keywords.'
                      : 'You haven\'t added any products yet. Start by adding your first product!'}
                  </Text>
                  <Button 
                    as={RouterLink}
                    to="/products/new"
                    colorScheme="brand" 
                    leftIcon={<AddIcon />}
                    size="lg"
                  >
                    Add Your First Product
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
