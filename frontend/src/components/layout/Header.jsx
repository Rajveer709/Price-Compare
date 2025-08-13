import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  useDisclosure,
  useColorModeValue,
  useColorMode,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  HStack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiMenu, FiMoon, FiSun, FiUser, FiHeart, FiClock } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const searchBg = useColorModeValue('white', 'gray.700');
  const searchBorder = useColorModeValue('gray.200', 'gray.600');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error logging out',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="sticky"
      bg={bgColor}
      boxShadow="sm"
      borderBottom="1px"
      borderColor={borderColor}
    >
      <Flex
        maxW="1400px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={3}
        align="center"
        justify="space-between"
      >
        {/* Logo */}
        <Flex align="center">
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            icon={isOpen ? <FiX /> : <FiMenu />}
            onClick={isOpen ? onClose : onOpen}
            variant="ghost"
            aria-label="Toggle Navigation"
            mr={2}
          />
          <Box
            as={RouterLink}
            to="/"
            fontWeight="bold"
            fontSize="xl"
            color="primary.500"
            _hover={{ textDecoration: 'none' }}
          >
            PriceCompare
          </Box>
        </Flex>

        {/* Search Bar */}
        <Box flex="1" maxW="600px" mx={{ base: 0, md: 6 }}>
          <form onSubmit={handleSearch}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                ref={searchInputRef}
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                bg={searchBg}
                borderColor={searchBorder}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                }}
              />
              {searchQuery && (
                <InputRightElement>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<FiX />}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  />
                </InputRightElement>
              )}
            </InputGroup>
          </form>
        </Box>

        {/* Navigation */}
        <Flex align="center">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
            mr={2}
          />
          
          {user ? (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                px={2}
                rounded="full"
                _hover={{ bg: hoverBg }}
                _active={{ bg: hoverBg }}
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={user.displayName || user.email} src={user.photoURL} />
                  <Text display={{ base: 'none', md: 'block' }} fontSize="sm">
                    {user.displayName || 'My Account'}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList zIndex="dropdown" minW="200px">
                <MenuItem icon={<FiUser />} as={RouterLink} to="/account">
                  My Account
                </MenuItem>
                <MenuItem icon={<FiHeart />} as={RouterLink} to="/saved">
                  Saved Items
                </MenuItem>
                <MenuItem icon={<FiClock />} as={RouterLink} to="/recent">
                  Recent Searches
                </MenuItem>
                <MenuItem onClick={handleLogout} color="red.500">
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <>
              <Button
                as={RouterLink}
                to="/login"
                variant="ghost"
                display={{ base: 'none', md: 'flex' }}
                mr={2}
              >
                Sign In
              </Button>
              <Button
                as={RouterLink}
                to="/register"
                colorScheme="primary"
                display={{ base: 'none', md: 'flex' }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
