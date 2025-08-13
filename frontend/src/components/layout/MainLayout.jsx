import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Flex direction="column" minH="100vh">
      {/* Header */}
      <Header />

      <Flex flex="1" bg={bgColor}>
        {/* Sidebar - Only show on larger screens */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w={{ base: '0', md: '280px' }}
          borderRight="1px"
          borderColor={borderColor}
          bg={bgColor}
          position="fixed"
          h="calc(100vh - 64px)" // Full height minus header
          overflowY="auto"
          pt={4}
        >
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          ml={{ base: 0, md: '280px' }} // Account for sidebar width
          p={{ base: 4, md: 6 }}
          pt={{ base: 20, md: 6 }} // Extra padding on mobile for fixed header
        >
          <Box maxW="1400px" mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Flex>

      {/* Footer */}
      <Footer />
    </Flex>
  );
};

export default MainLayout;
