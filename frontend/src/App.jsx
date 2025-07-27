import React, { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import { FaSearch, FaSpinner, FaExclamationCircle, FaShoppingBag } from 'react-icons/fa';

// Text-based logo component
const Logo = () => (
  <div className="flex items-center">
    <FaShoppingBag className="text-indigo-600 text-2xl mr-2" />
    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
      PriceCompare
    </span>
  </div>
);

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Find the best deal (lowest price) from the results
  const findBestDeal = (products) => {
    if (!products.length) return null;
    return products.reduce((best, current) => 
      (current.price < best.price) ? current : best, products[0]
    );
  };

  // Handle scroll for header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(true);
    
    try {
      // Scroll to results after a short delay to allow UI to update
      setTimeout(() => {
        const resultsSection = document.getElementById('search-results');
        if (resultsSection) {
          window.scrollTo({
            top: resultsSection.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }, 100);
      
      console.log('Sending search request for:', query);
      const response = await fetch(
        `/api/v1/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to fetch products. Please try again.");
      }
      
      // Process and validate the results
      let formattedResults = [];
      
      if (Array.isArray(data)) {
        formattedResults = data
          .filter(item => item && item.title && item.price) // Filter out invalid items
          .map((item, index) => ({
            ...item,
            id: item.id || `item-${index}-${Date.now()}`,
            title: item.title || 'Untitled Product',
            price: parseFloat(item.price) || 0,
            rating: parseFloat(item.rating) || 0,
            discount: parseFloat(item.discount) || 0,
            original_price: parseFloat(item.original_price) || parseFloat(item.price) * 1.2 || 0,
            image: item.image || 'https://via.placeholder.com/200x200?text=No+Image',
            url: item.url || '#',
            source: item.source || 'Unknown',
            timestamp: new Date().toISOString()
          }));
          
        // Sort by price (lowest first)
        formattedResults.sort((a, b) => a.price - b.price);
        
        console.log('Processed results:', formattedResults);
      }
      
      // Find the best deal
      const bestDeal = findBestDeal(formattedResults);
      
      console.log('Best deal:', bestDeal);
      
      setResults(formattedResults);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-gray-200"></div>
          <div className="p-5">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Home</a>
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">About</a>
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">How It Works</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find the <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Best Deals</span> Across Top Stores
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Compare prices from Amazon, Flipkart, and more to ensure you always get the best price on your favorite products.
          </p>
          
          {/* Search Form */}
          <form 
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-1.5 flex items-center"
          >
            <div className="flex-1 flex items-center px-4">
              <FiSearch className="text-gray-400 mr-3" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products (e.g., iPhone 15, AirPods Pro)"
                className="w-full py-4 px-1 outline-none text-gray-700 placeholder-gray-400"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-all ${loading || !query.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  Search
                </>
              )}
            </button>
          </form>
          
          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="text-gray-500 text-sm">Trending:</span>
            {['iPhone 15', 'MacBook Air', 'AirPods', 'PlayStation 5'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  // Small delay to ensure state updates before search
                  setTimeout(() => document.querySelector('form').requestSubmit(), 10);
                }}
                className="text-sm bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="search-results" className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            renderSkeleton()
          ) : searched && results.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-4">
                <FiSearch className="text-indigo-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any products matching "{query}". Try different keywords or check the spelling.
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Best Deal Banner */}
              {findBestDeal(results) && (
                <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <span className="font-semibold">Best Deal Found:</span> {findBestDeal(results).title} for {new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(findBestDeal(results).price)} on {findBestDeal(results).source || 'the store'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Results for "{query}" <span className="text-gray-500 text-lg">({results.length} products)</span>
                </h2>
                <div className="text-sm text-gray-500">
                  Sorted by: <span className="font-medium text-indigo-600">Price (Low to High)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((product, idx) => {
                  const isBestDeal = findBestDeal(results)?.id === product.id;
                  return (
                    <div 
                      key={`${product.website}-${product.id || idx}`}
                      className={`relative ${isBestDeal ? 'ring-2 ring-green-500 ring-offset-2 rounded-xl' : ''}`}
                    >
                      {isBestDeal && (
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Best Deal
                        </div>
                      )}
                      <ProductCard 
                        product={product} 
                        index={idx % 10} // For staggered animations
                        isBestDeal={isBestDeal}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-4">
                <FiShoppingBag className="text-indigo-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Comparing Prices</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Search for a product to compare prices across different online stores and find the best deal.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
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
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
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
