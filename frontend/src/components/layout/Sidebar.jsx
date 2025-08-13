import { Box, VStack, Text, Divider, useColorModeValue, Icon } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiStar, FiClock, FiHeart, FiSettings } from 'react-icons/fi';

const SidebarItem = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeBg = useColorModeValue('primary.50', 'primary.900');
  const activeColor = useColorModeValue('primary.700', 'primary.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box
      as={RouterLink}
      to={to}
      display="flex"
      alignItems="center"
      px={4}
      py={3}
      mx={2}
      borderRadius="lg"
      color={isActive ? activeColor : color}
      bg={isActive ? activeBg : 'transparent'}
      _hover={{
        textDecoration: 'none',
        bg: isActive ? activeBg : hoverBg,
      }}
      transition="all 0.2s"
      fontWeight={isActive ? '600' : '500'}
    >
      <Icon as={icon} mr={3} boxSize={5} />
      <Text fontSize="sm">{children}</Text>
    </Box>
  );
};

const Sidebar = () => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <VStack spacing={1} align="stretch" py={4}>
      <Box px={4} mb={2}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
          Main
        </Text>
        <VStack spacing={1} align="stretch">
          <SidebarItem to="/" icon={FiHome}>
            Home
          </SidebarItem>
          <SidebarItem to="/deals" icon={FiTrendingUp}>
            Hot Deals
          </SidebarItem>
        </VStack>
      </Box>

      <Divider borderColor={borderColor} my={2} />

      <Box px={4} mb={2}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
          Your Activity
        </Text>
        <VStack spacing={1} align="stretch">
          <SidebarItem to="/recent" icon={FiClock}>
            Recent Searches
          </SidebarItem>
          <SidebarItem to="/saved" icon={FiHeart}>
            Saved Items
          </SidebarItem>
          <SidebarItem to="/favorites" icon={FiStar}>
            Favorites
          </SidebarItem>
        </VStack>
      </Box>

      <Divider borderColor={borderColor} my={2} />

      <Box px={4} mb={2}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
          Settings
        </Text>
        <VStack spacing={1} align="stretch">
          <SidebarItem to="/settings" icon={FiSettings}>
            Account Settings
          </SidebarItem>
        </VStack>
      </Box>
    </VStack>
  );
};

export default Sidebar;
