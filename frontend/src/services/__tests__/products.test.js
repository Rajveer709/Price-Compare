import { searchProducts, getProductDetails, getSimilarProducts, getTrendingProducts, getPriceHistory, getProductReviews } from '../products';
import { api } from '../api';

// Mock the API module
jest.mock('../api');

describe('Products Service', () => {
  const mockApi = api as jest.Mocked<typeof api>;
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should make a GET request to search products with query and filters', async () => {
      const mockResponse = {
        data: [
          { id: '1', title: 'Test Product 1', price: 99.99 },
          { id: '2', title: 'Test Product 2', price: 149.99 },
        ],
      };
      
      mockApi.get.mockResolvedValue(mockResponse);
      
      const query = 'laptop';
      const filters = {
        sort: 'price_asc',
        minPrice: '100',
        maxPrice: '1000',
        condition: ['NEW', 'USED'],
        freeShipping: true,
      };
      
      const result = await searchProducts(query, filters);
      
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/products/search?q=laptop&sort=price_asc&min_price=100&max_price=1000&condition=NEW%2CUSED&free_shipping=true'
      );
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when searching products', async () => {
      const error = new Error('Network error');
      mockApi.get.mockRejectedValue(error);
      
      await expect(searchProducts('test')).rejects.toThrow('Network error');
    });
  });

  describe('getProductDetails', () => {
    it('should fetch product details by ID', async () => {
      const mockProduct = {
        id: '123',
        title: 'Test Product',
        price: 199.99,
        description: 'Test description',
      };
      
      mockApi.get.mockResolvedValue({ data: mockProduct });
      
      const result = await getProductDetails('123');
      
      expect(mockApi.get).toHaveBeenCalledWith('/api/products/123');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getSimilarProducts', () => {
    it('should fetch similar products', async () => {
      const mockProducts = [
        { id: '1', title: 'Similar 1' },
        { id: '2', title: 'Similar 2' },
      ];
      
      mockApi.get.mockResolvedValue({ data: mockProducts });
      
      const result = await getSimilarProducts('123');
      
      expect(mockApi.get).toHaveBeenCalledWith('/api/products/123/similar');
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getTrendingProducts', () => {
    it('should fetch trending products without category', async () => {
      const mockProducts = [
        { id: '1', title: 'Trending 1' },
        { id: '2', title: 'Trending 2' },
      ];
      
      mockApi.get.mockResolvedValue({ data: mockProducts });
      
      const result = await getTrendingProducts();
      
      expect(mockApi.get).toHaveBeenCalledWith('/api/trending');
      expect(result).toEqual(mockProducts);
    });
    
    it('should fetch trending products with category', async () => {
      const mockProducts = [
        { id: '1', title: 'Electronics 1' },
        { id: '2', title: 'Electronics 2' },
      ];
      
      mockApi.get.mockResolvedValue({ data: mockProducts });
      
      const result = await getTrendingProducts('Electronics');
      
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/trending?category=Electronics'
      );
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getPriceHistory', () => {
    it('should fetch price history for a product', async () => {
      const mockHistory = [
        { date: '2023-01-01', price: 100 },
        { date: '2023-01-02', price: 95 },
      ];
      
      mockApi.get.mockResolvedValue({ data: mockHistory });
      
      const result = await getPriceHistory('123');
      
      expect(mockApi.get).toHaveBeenCalledWith('/api/products/123/price-history');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getProductReviews', () => {
    it('should fetch product reviews with default pagination', async () => {
      const mockReviews = {
        data: [
          { id: '1', rating: 5, comment: 'Great!' },
          { id: '2', rating: 4, comment: 'Good' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      
      mockApi.get.mockResolvedValue({ data: mockReviews });
      
      const result = await getProductReviews('123');
      
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/products/123/reviews?page=1&limit=10&sort=newest'
      );
      expect(result).toEqual(mockReviews);
    });
    
    it('should fetch product reviews with custom pagination and sort', async () => {
      const mockReviews = {
        data: [{ id: '1', rating: 5 }],
        total: 1,
        page: 2,
        limit: 5,
      };
      
      mockApi.get.mockResolvedValue({ data: mockReviews });
      
      const options = {
        page: 2,
        limit: 5,
        sort: 'highest_rating',
      };
      
      await getProductReviews('123', options);
      
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/products/123/reviews?page=2&limit=5&sort=highest_rating'
      );
    });
  });
});
