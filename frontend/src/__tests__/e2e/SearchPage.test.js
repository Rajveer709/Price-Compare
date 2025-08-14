import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import SearchResults from '../../pages/SearchResults';

// Mock the API module
jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the API responses
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
    {
      id: '2',
      title: 'Used Laptop',
      price: 499.99,
      image: 'https://example.com/used-laptop.jpg',
      condition: 'USED',
      shipping: { free_shipping: false },
      seller: { username: 'used-seller', feedback_score: 500 },
      buy_now: true,
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    pages: 1,
  },
};

// Mock the API response
const mockApiResponse = {
  data: mockSearchResults,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
};

// Set up the mock API response
beforeEach(() => {
  require('../../services/api').api.get.mockResolvedValue(mockApiResponse);
});

// Create a test-utils file to render with all providers
const renderWithProviders = (ui, { route = '/search?q=laptop' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable retries for testing
        retryOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
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

describe('Search Page', () => {
  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display search results when the page loads with a search query', async () => {
    // Render the component with the search query in the URL
    renderWithProviders(<SearchResults />, { route: '/search?q=laptop' });

    // Check if the loading state is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the results to be loaded
    await waitFor(() => {
      // Check if the search results are displayed
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
      expect(screen.getByText('Used Laptop')).toBeInTheDocument();
      
      // Check if prices are displayed (formatting might be different)
      expect(screen.getByText(/999.99/)).toBeInTheDocument();
      expect(screen.getByText(/499.99/)).toBeInTheDocument();
      
      // Check for condition badges
      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByText('USED')).toBeInTheDocument();
    });
  });

  it('should allow filtering search results', async () => {
    // Mock the API response for filtered results
    require('../../services/api').api.get.mockResolvedValueOnce({
      ...mockApiResponse,
      data: {
        ...mockSearchResults,
        products: [mockSearchResults.products[0]], // Only return the more expensive laptop
        pagination: { total: 1, page: 1, pages: 1 },
      },
    });

    renderWithProviders(<SearchResults />, { route: '/search?q=laptop' });

    // Wait for initial results to load
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });

    // Find and click the filter button
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);

    // Find and update the min price filter
    const minPriceInput = screen.getByLabelText('Min Price');
    fireEvent.change(minPriceInput, { target: { value: '500' } });

    // Submit the filter form
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    // Check if the API was called with the filter
    await waitFor(() => {
      expect(require('../../services/api').api.get).toHaveBeenCalledWith(
        expect.stringContaining('min_price=500')
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock an error response
    const error = new Error('API Error');
    require('../../services/api').api.get.mockRejectedValueOnce(error);

    renderWithProviders(<SearchResults />, { route: '/search?q=laptop' });

    // Check if error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/error/i)
      ).toBeInTheDocument();
    });
  });

  it('should allow changing the sort order', async () => {
    renderWithProviders(<SearchResults />, { route: '/search?q=laptop' });

    // Wait for initial results to load
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });

    // Find and change the sort select
    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

    // Check if the API was called with the sort parameter
    await waitFor(() => {
      expect(require('../../services/api').api.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=price_asc')
      );
    });
  });

  it('should navigate to product details when a product is clicked', async () => {
    renderWithProviders(<SearchResults />, { route: '/search?q=laptop' });

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });

    // Find and click on the first product
    const productCard = screen.getByText('Test Laptop').closest('a');
    fireEvent.click(productCard);

    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/product/1');
    });
  });
});
