import { StrictMode, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';
import { FaShoppingBag, FaArrowUp, FaSearch, FaTimes, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './components/ProductCard';
import './index.css';

// Mock data for products
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
    name: 'iPhone 13',
    price: 829,
    originalPrice: 899,
    currency: '$',
    source: 'Walmart',
    image: 'https://i5.walmartimages.com/asr/6f9d0c27-0f12-4d2b-a2a2-2f8f8a2b7b5a1.8598f86b3d4e7d9e1c3b3c3b3c3b3c3b.1',
    rating: 4.6,
    ratingCount: 3215,
    url: 'https://www.walmart.com/ip/Apple-iPhone-13-128GB-Blue/309981678'
  },
  {
    id: '4',
    name: 'iPhone 13 Mini',
    price: 729,
    originalPrice: 799,
    currency: '$',
    source: 'Target',
    image: 'https://target.scene7.com/is/image/Target/GUEST_1e2b5b5e-5f5e-4b1d-9d1f-1a1b1c1d1e1f',
    rating: 4.5,
    ratingCount: 2156,
    url: 'https://www.target.com/p/apple-iphone-13-mini-5g-64gb-blue/-/A-84616123'
  },
  {
    id: '5',
    name: 'iPhone 12 Pro',
    price: 899,
    originalPrice: 999,
    currency: '$',
    source: 'Amazon',
    image: 'https://m.media-amazon.com/images/I/71FuI8YvZBL._AC_SL1500_.jpg',
    rating: 4.6,
    ratingCount: 3892,
    url: 'https://www.amazon.com/Apple-iPhone-12-Pro-128GB/dp/B08L5Q84DM/'
  },
  {
    id: '6',
    name: 'Samsung Galaxy S22 Ultra',
    price: 1199,
    originalPrice: 1299,
    currency: '$',
    source: 'Best Buy',
    image: 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6482/6482645_sd.jpg',
    rating: 4.8,
    ratingCount: 5123,
    url: 'https://www.bestbuy.com/site/samsung-galaxy-s22-ultra-5g-128gb-unlocked-phantom-black/6482645.p'
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
  // Basic state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [activeSection, setActiveSection] = useState('home');
  const searchInputRef = useRef(null);

  // Handle search submission with mock data
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const searchTerm = query.toLowerCase().trim();
        
        // Filter mock products based on search query
        const searchResults = MOCK_PRODUCTS.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.source.toLowerCase().includes(searchTerm)
        );
        
        if (searchResults.length === 0) {
          // If no results found in mock data
          setResults([{
            id: 'no-results',
            name: `No results found for "${query}"`,
            price: 0,
            currency: '$',
            source: 'No results',
            isMock: true,
          }]);
        } else {
          // Ensure we have valid product data
          const validResults = searchResults.map(product => ({
            ...product,
            image: product.image || 'https://via.placeholder.com/150',
            rating: product.rating || 0,
            ratingCount: product.ratingCount || 0,
            originalPrice: product.originalPrice || product.price
          }));
          setResults(validResults);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred during search. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Reduced delay for better UX
  };

  // Handle Enter key press in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toggle save item
  const toggleSaveItem = useCallback((productId, isSaved) => {
    setSavedItems(prev => {
      if (isSaved) {
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    searchInputRef.current?.focus();
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Navigate to section
  const navigateTo = useCallback((section) => {
    setActiveSection(section);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-sm shadow-md py-2' : 'bg-white/80 backdrop-blur-sm py-4'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <button 
            onClick={() => navigateTo('home')} 
            className="focus:outline-none"
            aria-label="Home"
          >
            <Logo />
          </button>
          <div className="flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch} className="relative">
              <label htmlFor="search-input" className="sr-only">
                Search for products
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for products..."
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-full bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
                  disabled={loading}
                  aria-busy={loading}
                  aria-describedby="search-help"
                  ref={searchInputRef}
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-16 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`absolute right-1 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    loading || !query.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                  aria-label={loading ? 'Searching...' : 'Search'}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <div id="search-help" className="sr-only">
                Press Enter to search or click the search button
              </div>
            </form>
          </div>
          <nav aria-label="Main navigation">
            <ul className="flex items-center space-x-2">
              <li>
                <button 
                  onClick={() => navigateTo('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeSection === 'home' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  }`}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('about')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeSection === 'about' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  }`}
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('contact')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeSection === 'contact' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  }`}
                >
                  Contact
                </button>
              </li>
              <li className="relative">
                <button 
                  onClick={() => navigateTo('saved')}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-indigo-600 transition-colors relative"
                  aria-label={`Saved items (${savedItems.length})`}
                >
                  {savedItems.length > 0 ? (
                    <FaHeart className="h-5 w-5 text-red-500" />
                  ) : (
                    <FaRegHeart className="h-5 w-5" />
                  )}
                  {savedItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {savedItems.length}
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-16 px-4">
        <div className="container mx-auto">
          {!searched ? (
            <div className="text-center py-12">
              <motion.h1 
                className="text-4xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Find the Best Deals
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Search for products to compare prices across multiple stores
              </motion.p>
              <motion.div 
                className="max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for products..."
                      className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-full bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-lg transition-all duration-200"
                      aria-label="Search for products"
                      ref={searchInputRef}
                    />
                    <button 
                      type="submit"
                      disabled={!query.trim()}
                      className={`absolute right-1 top-1/2 transform -translate-y-1/2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                        !query.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                    >
                      Search
                    </button>
                  </div>
                </form>
              </motion.div>
              
              {/* Popular Searches */}
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-gray-500 mb-2">Try searching for:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['iPhone 14', 'Samsung Galaxy S23', 'MacBook Pro', 'AirPods Pro', 'PlayStation 5'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        setTimeout(() => {
                          handleSearch();
                        }, 0);
                      }}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-600">Searching for the best deals...</p>
            </div>
          ) : error ? (
            <motion.div 
              className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setSearched(false)}
                      className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {results[0].isMock ? 'No results' : `Found ${results.length} ${results.length === 1 ? 'result' : 'results'}`}
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <FaTimes className="mr-1" /> Clear search
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard 
                      product={product} 
                      onSaveToggle={handleSaveToggle}
                      isSaved={savedItems.includes(product.id)}
                    />
                  </motion.div>
                ))}
              </div>
              
              {!results[0].isMock && (
                <div className="mt-10 text-center">
                  <p className="text-gray-500 mb-4">Can't find what you're looking for?</p>
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaSearch className="mr-2 -ml-1" />
                    Try a new search
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              className="text-center py-16 bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-indigo-100">
                <FaSearch className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="mt-4 text-2xl font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500">We couldn't find any products matching your search.</p>
              <div className="mt-6">
                <button
                  onClick={() => setSearched(false)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <FaArrowLeft className="mr-2 -ml-1" />
                  Back to search
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Search tips:</h4>
                <ul className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
                  <li className="flex items-start">
                    <FaCheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Check your spelling and try again</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Try more general search terms</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Browse our popular categories</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-40"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll to top"
          >
            <FaArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">PriceCompare</h3>
              <p className="text-gray-400 text-sm">
                Helping you find the best deals across top online stores.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigateTo('home')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('about')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Stores</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Amazon</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Flipkart</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">More coming soon</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} PriceCompare. All rights reserved.</p>
            <p className="mt-2">Made with <span className="text-pink-400">❤</span> by You</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


// Add prop type validation
App.propTypes = {
  // Add any props validation if needed
};

// Get the root element
const rootElement = document.getElementById('root');

// Check if the root element exists before rendering
if (rootElement) {
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
