import { Box, Container, Flex, Text, Link, Stack, Divider, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaGithub, FaTwitter, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverColor = useColorModeValue('primary.600', 'primary.400');

  const currentYear = new Date().getFullYear();

  const FooterLink = ({ to, children }) => (
    <Link
      as={RouterLink}
      to={to}
      fontSize="sm"
      color={textColor}
      _hover={{ color: hoverColor, textDecoration: 'none' }}
    >
      {children}
    </Link>
  );

  const SocialLink = ({ href, icon: Icon, label }) => (
    <Link
      href={href}
      isExternal
      p={2}
      rounded="full"
      color={textColor}
      _hover={{ color: hoverColor, bg: useColorModeValue('gray.100', 'gray.700') }}
      aria-label={label}
    >
      <Icon size="18px" />
    </Link>
  );

  return (
    <Box as="footer" bg={bgColor} borderTop="1px" borderColor={borderColor} mt="auto">
      <Container maxW="1400px" py={8}>
        <Stack spacing={8}>
          {/* Main Footer Content */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
          >
            {/* Brand */}
            <Box mb={{ base: 6, md: 0 }}>
              <Text
                as={RouterLink}
                to="/"
                fontSize="xl"
                fontWeight="bold"
                color="primary.500"
                _hover={{ textDecoration: 'none' }}
              >
                PriceCompare
              </Text>
              <Text mt={2} fontSize="sm" color={textColor} maxW="300px">
                Find the best deals and compare prices across multiple retailers to save money on your purchases.
              </Text>
            </Box>

            {/* Quick Links */}
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 4, sm: 8 }}>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Company
                </Text>
                <Stack spacing={2}>
                  <FooterLink to="/about">About Us</FooterLink>
                  <FooterLink to="/blog">Blog</FooterLink>
                  <FooterLink to="/careers">Careers</FooterLink>
                  <FooterLink to="/contact">Contact</FooterLink>
                </Stack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={3}>
                  Support
                </Text>
                <Stack spacing={2}>
                  <FooterLink to="/help">Help Center</FooterLink>
                  <FooterLink to="/privacy">Privacy Policy</FooterLink>
                  <FooterLink to="/terms">Terms of Service</FooterLink>
                  <FooterLink to="/faq">FAQs</FooterLink>
                </Stack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={3}>
                  Resources
                </Text>
                <Stack spacing={2}>
                  <FooterLink to="/developers">API</FooterLink>
                  <FooterLink to="/extension">Browser Extension</FooterLink>
                  <FooterLink to="/partners">Partners</FooterLink>
                  <FooterLink to="/sitemap">Sitemap</FooterLink>
                </Stack>
              </Box>
            </Stack>
          </Flex>

          <Divider borderColor={borderColor} />

          {/* Bottom Bar */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            pt={4}
          >
            <Text fontSize="sm" color={textColor} mb={{ base: 4, md: 0 }}>
              © {currentYear} PriceCompare. All rights reserved.
            </Text>

            <Stack direction="row" spacing={4}>
              <SocialLink
                href="https://github.com/yourusername/price-compare"
                icon={FaGithub}
                label="GitHub"
              />
              <SocialLink
                href="https://twitter.com/yourusername"
                icon={FaTwitter}
                label="Twitter"
              />
              <SocialLink
                href="https://discord.gg/yourinvite"
                icon={FaDiscord}
                label="Discord"
              />
            </Stack>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
