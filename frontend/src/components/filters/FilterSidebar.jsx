import { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Divider,
  Button,
  Collapse,
  Checkbox,
  CheckboxGroup,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useDisclosure,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiDollarSign, FiX } from 'react-icons/fi';

const FilterSection = ({ title, children, isOpen: isOpenProp = true }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: isOpenProp });
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box w="full">
      <Button
        variant="ghost"
        size="sm"
        w="full"
        justifyContent="space-between"
        onClick={onToggle}
        px={0}
        py={2}
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
        rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
      >
        <Heading as="h3" size="sm" fontWeight="semibold">
          {title}
        </Heading>
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box pt={2} pb={4} pl={2}>
          {children}
        </Box>
      </Collapse>
      <Divider borderColor={borderColor} />
    </Box>
  );
};

const PriceRangeFilter = ({ value, onChange, min = 0, max = 1000, step = 10 }) => {
  const [minPrice, setMinPrice] = useState(value?.[0] || min);
  const [maxPrice, setMaxPrice] = useState(value?.[1] || max);
  
  const handleChange = (values) => {
    setMinPrice(values[0]);
    setMaxPrice(values[1]);
    onChange(values);
  };

  const handleMinInputChange = (e) => {
    const newMin = Math.min(Number(e.target.value), maxPrice - step);
    setMinPrice(newMin);
    onChange([newMin, maxPrice]);
  };

  const handleMaxInputChange = (e) => {
    const newMax = Math.max(Number(e.target.value), minPrice + step);
    setMaxPrice(newMax);
    onChange([minPrice, newMax]);
  };

  return (
    <VStack spacing={4} align="stretch">
      <RangeSlider
        aria-label={['min price', 'max price']}
        min={min}
        max={max}
        step={step}
        value={[minPrice, maxPrice]}
        onChange={handleChange}
      >
        <RangeSliderTrack bg="gray.200">
          <RangeSliderFilledTrack bg="primary.500" />
        </RangeSliderTrack>
        <RangeSliderThumb index={0} />
        <RangeSliderThumb index={1} />
      </RangeSlider>
      
      <HStack spacing={4}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" color="gray.500">
            <FiDollarSign size={14} />
          </InputLeftElement>
          <Input
            type="number"
            value={minPrice}
            onChange={handleMinInputChange}
            min={min}
            max={maxPrice - step}
            step={step}
            pl={6}
          />
        </InputGroup>
        
        <Text fontSize="sm" color="gray.500">
          to
        </Text>
        
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" color="gray.500">
            <FiDollarSign size={14} />
          </InputLeftElement>
          <Input
            type="number"
            value={maxPrice}
            onChange={handleMaxInputChange}
            min={minPrice + step}
            max={max}
            step={step}
            pl={6}
          />
        </InputGroup>
      </HStack>
    </VStack>
  );
};

const CheckboxFilter = ({ options = [], value = [], onChange, isCollapsible = false, maxVisible = 5 }) => {
  const [showAll, setShowAll] = useState(!isCollapsible);
  const visibleOptions = showAll ? options : options.slice(0, maxVisible);
  
  const handleChange = (selected) => {
    onChange(selected);
  };

  return (
    <VStack align="stretch" spacing={2}>
      <CheckboxGroup value={value} onChange={handleChange}>
        {visibleOptions.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            size="sm"
            colorScheme="primary"
            py={1}
          >
            <Box display="flex" justifyContent="space-between" w="full">
              <Text as="span" fontSize="sm">
                {option.label}
              </Text>
              {option.count !== undefined && (
                <Text as="span" fontSize="xs" color="gray.500">
                  {option.count}
                </Text>
              )}
            </Box>
          </Checkbox>
        ))}
      </CheckboxGroup>
      
      {isCollapsible && options.length > maxVisible && (
        <Button
          variant="link"
          size="sm"
          colorScheme="primary"
          onClick={() => setShowAll(!showAll)}
          mt={1}
          ml={6}
        >
          {showAll ? 'Show less' : `Show ${options.length - maxVisible} more`}
        </Button>
      )}
    </VStack>
  );
};

const ActiveFilters = ({ filters, onRemoveFilter }) => {
  if (!filters || Object.keys(filters).length === 0) return null;

  const filterLabels = [];
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || 0;
    const max = filters.maxPrice || '∞';
    filterLabels.push({
      key: 'price',
      label: `$${min} - $${max}`,
      value: 'price',
    });
  }
  
  // Condition filter
  if (filters.condition?.length > 0) {
    filters.condition.forEach((cond) => {
      filterLabels.push({
        key: `condition-${cond}`,
        label: `Condition: ${cond}`,
        value: `condition-${cond}`,
      });
    });
  }
  
  // Free shipping filter
  if (filters.freeShipping) {
    filterLabels.push({
      key: 'freeShipping',
      label: 'Free Shipping',
      value: 'freeShipping',
    });
  }
  
  // Add more filter types as needed

  if (filterLabels.length === 0) return null;

  return (
    <Box mb={4}>
      <HStack flexWrap="wrap" spacing={2}>
        <Text fontSize="sm" fontWeight="medium" mr={2}>
          Filters:
        </Text>
        {filterLabels.map((filter) => (
          <Button
            key={filter.key}
            size="xs"
            variant="outline"
            rightIcon={<FiX size={12} />}
            onClick={() => onRemoveFilter(filter)}
            borderRadius="full"
          >
            {filter.label}
          </Button>
        ))}
        <Button
          size="xs"
          variant="ghost"
          colorScheme="red"
          onClick={() => onRemoveFilter({ clearAll: true })}
          ml="auto"
        >
          Clear all
        </Button>
      </HStack>
    </Box>
  );
};

const FilterSidebar = ({ filters = {}, onFilterChange, onClose }) => {
  const handlePriceChange = (range) => {
    const [minPrice, maxPrice] = range;
    onFilterChange({
      ...filters,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 1000 ? maxPrice : undefined,
    });
  };

  const handleConditionChange = (conditions) => {
    onFilterChange({
      ...filters,
      condition: conditions.length > 0 ? conditions : undefined,
    });
  };

  const handleFreeShippingChange = (e) => {
    onFilterChange({
      ...filters,
      freeShipping: e.target.checked || undefined,
    });
  };

  const handleRemoveFilter = (filter) => {
    if (filter.clearAll) {
      onFilterChange({});
      return;
    }

    if (filter.key === 'price') {
      const { minPrice, maxPrice, ...rest } = filters;
      onFilterChange(rest);
    } else if (filter.key.startsWith('condition-')) {
      const conditionValue = filter.key.replace('condition-', '');
      const updatedConditions = (filters.condition || []).filter(c => c !== conditionValue);
      onFilterChange({
        ...filters,
        condition: updatedConditions.length > 0 ? updatedConditions : undefined,
      });
    } else if (filter.key === 'freeShipping') {
      const { freeShipping, ...rest } = filters;
      onFilterChange(rest);
    }
  };

  // Mock data - in a real app, this would come from your API
  const conditionOptions = [
    { value: 'New', label: 'New', count: 1245 },
    { value: 'Used', label: 'Used', count: 876 },
    { value: 'Refurbished', label: 'Refurbished', count: 321 },
  ];

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics', count: 2345 },
    { value: 'clothing', label: 'Clothing', count: 1890 },
    { value: 'home', label: 'Home & Garden', count: 1567 },
    { value: 'sports', label: 'Sports & Outdoors', count: 987 },
    { value: 'toys', label: 'Toys & Games', count: 765 },
  ];

  return (
    <VStack align="stretch" spacing={4} h="full">
      {/* Mobile header */}
      <Flex justify="space-between" align="center" display={{ base: 'flex', md: 'none' }} mb={4}>
        <Heading size="md">Filters</Heading>
        <IconButton
          icon={<FiX />}
          variant="ghost"
          onClick={onClose}
          aria-label="Close filters"
        />
      </Flex>

      {/* Active filters */}
      <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />

      {/* Price Range Filter */}
      <FilterSection title="Price Range">
        <PriceRangeFilter
          value={[
            filters.minPrice || 0,
            filters.maxPrice || 1000,
          ]}
          onChange={handlePriceChange}
          min={0}
          max={1000}
          step={10}
        />
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection title="Condition">
        <CheckboxFilter
          options={conditionOptions}
          value={filters.condition || []}
          onChange={handleConditionChange}
        />
      </FilterSection>

      {/* Free Shipping Filter */}
      <FilterSection title="Shipping">
        <Checkbox
          isChecked={filters.freeShipping || false}
          onChange={handleFreeShippingChange}
          size="sm"
          colorScheme="primary"
        >
          Free Shipping
        </Checkbox>
      </FilterSection>

      {/* Categories Filter */}
      <FilterSection title="Categories">
        <CheckboxFilter
          options={categoryOptions}
          isCollapsible
          maxVisible={5}
        />
      </FilterSection>

      {/* Apply/Clear Buttons (Mobile) */}
      <Box display={{ base: 'flex', md: 'none' }} mt="auto" pt={4} gap={2}>
        <Button
          variant="outline"
          size="sm"
          flex={1}
          onClick={() => onFilterChange({})}
        >
          Clear All
        </Button>
        <Button
          colorScheme="primary"
          size="sm"
          flex={1}
          onClick={onClose}
        >
          Apply Filters
        </Button>
      </Box>
    </VStack>
  );
};

export default FilterSidebar;
