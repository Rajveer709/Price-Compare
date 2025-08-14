import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import SearchResults from '../pages/SearchResults';

// Mock the API module
jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock search results data
const mockSearchResults = {
  products: [
    {
      id: '1',
      title: 'Test Laptop',
      price: 999.99,
      image: 'https://example.com/laptop.jpg',
      condition: 'NEW',
      shipping: { free_shipping: true },
      seller: { username: 'test-seller', feedback_score: 1000 },
      buy_now: true,
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    pages: 1,
  },
};

// Create a test render function
const renderWithProviders = (ui, { route = '/search?q=laptop' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/search" element={ui} />
            </Routes>
          </MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    ),
  };
};

describe('SearchResults Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the API response
    require('../services/api').api.get.mockResolvedValue({
      data: mockSearchResults,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
  });

  it('should display search results when the page loads', async () => {
    renderWithProviders(<SearchResults />);

    // Check if the loading state is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the results to be loaded
    await waitFor(() => {
      // Check if the search results are displayed
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
      expect(screen.getByText(/999.99/)).toBeInTheDocument();
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });
  });

  it('should navigate to product details when a product is clicked', async () => {
    renderWithProviders(<SearchResults />);

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });

    // Find and click on the product
    const productCard = screen.getByText('Test Laptop').closest('a');
    fireEvent.click(productCard);

    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/product/1');
  });

  it('should handle API errors gracefully', async () => {
    // Mock an error response
    require('../services/api').api.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<SearchResults />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
