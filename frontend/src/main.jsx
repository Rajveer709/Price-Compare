import { StrictMode, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { FaShoppingBag, FaArrowUp, FaSearch, FaTimes, FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import ProductCard from './components/ProductCard';
import { productApi } from './services/api';
import './index.css';

// Mock data for fallback
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 13 Pro',
    price: 999,
    originalPrice: 1099,
    currency: '$',
    source: 'Amazon',
    image: 'https://m.media-amazon.com/images/I/61jLiCovx4L._AC_SL1500_.jpg',
    rating: 4.7,
    ratingCount: 5243,
    url: 'https://www.amazon.com/iPhone-13-Pro-128GB-Sierra/dp/B0BGYCH1WK/'
  },
  {
    id: '2',
    name: 'iPhone 13 Pro Max',
    price: 1099,
    originalPrice: 1199,
    currency: '$',
    source: 'Best Buy',
    image: 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6450/6450245_sd.jpg',
    rating: 4.8,
    ratingCount: 4219,
    url: 'https://www.bestbuy.com/site/apple-iphone-13-pro-max-5g-128gb-sierra-blue-verizon/6450245.p'
  },
  {
    id: '3',
    name: 'Samsung Galaxy S22 Ultra',
    price: 1199,
    originalPrice: 1299,
    currency: '$',
    source: 'Samsung',
    image: 'https://images.samsung.com/us/smartphones/galaxy-s22-ultra/buy/05312022/galaxy-s22-ultra_highlights_kv_img.jpg',
    rating: 4.8,
    ratingCount: 5123,
    url: 'https://www.samsung.com/us/smartphones/galaxy-s22-ultra/'
  }
];

// Text-based logo component
const Logo = () => (
  <div className="flex items-center">
    <FaShoppingBag className="text-indigo-600 text-2xl mr-2" />
    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
      PriceCompare
    </span>
  </div>
);

function App() {
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const searchInputRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, you would call your API here
      // const data = await productApi.searchProducts(searchQuery);
      // setProducts(data);
      // setFilteredProducts(data);
      
      // For now, using mock data with a delay to simulate API call
      setTimeout(() => {
        setProducts(MOCK_PRODUCTS);
        setFilteredProducts(MOCK_PRODUCTS);
        setIsLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search functionality
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchQuery(searchTerm);
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.source && product.source.toLowerCase().includes(searchTerm))
    );
    
    setFilteredProducts(filtered);
  };

  // Handle Enter key press in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toggle save item
  const toggleSaveItem = useCallback((productId) => {
    setSavedItems(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredProducts(products);
    searchInputRef.current?.focus();
  }, [products]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Navigate to section
  const navigateTo = useCallback((section) => {
    if (section === 'home') {
      scrollToTop();
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [scrollToTop]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-white shadow-sm sticky top-0 z-10 transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-4'
      }`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Logo />
            <nav className="hidden md:flex space-x-6">
              <button 
                type="button"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                onClick={() => navigateTo('home')}
              >
                Home
              </button>
              <button 
                type="button"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                onClick={() => navigateTo('products')}
              >
                Products
              </button>
            </nav>
          </div>
          
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              type="button"
              className="p-2 text-gray-600 hover:text-indigo-600 transition-colors relative"
              aria-label="Saved items"
            >
              <FaHeart className="h-5 w-5" />
              {savedItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {savedItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Latest Products</h1>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  onSaveToggle={toggleSaveItem}
                  isSaved={savedItems.includes(product.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search to find what you're looking for.</p>
          </div>
        )}
      </main>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          aria-label="Scroll to top"
        >
          <FaArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo />
            <p className="mt-4 md:mt-0 text-sm text-gray-500">
              &copy; {new Date().getFullYear()} PriceCompare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add prop type validation
ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    currency: PropTypes.string,
    source: PropTypes.string,
    image: PropTypes.string,
    rating: PropTypes.number,
    ratingCount: PropTypes.number,
    url: PropTypes.string
  }).isRequired,
  onSaveToggle: PropTypes.func.isRequired,
  isSaved: PropTypes.bool.isRequired
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
