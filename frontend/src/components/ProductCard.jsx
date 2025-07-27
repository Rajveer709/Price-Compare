import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiHeart, FiShare2, FiClock } from 'react-icons/fi';
import { FaAmazon, FaGlobe, FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaRegHeart, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { BsLightningChargeFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductCard({ product, index, isBestDeal = false, isSaved = false, onSaveToggle = () => {} }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const delay = index * 50; // Reduced stagger delay for smoother animations
  
  // Extract website name from URL with proper branding
  const getWebsiteInfo = (url) => {
    if (!url) return { name: 'Unknown', color: 'bg-gray-500' };
    
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // Return website info with branding colors
      if (domain.includes('amazon')) {
        return { 
          name: 'Amazon', 
          color: 'bg-yellow-500 hover:bg-yellow-600',
          icon: <FaAmazon className="inline mr-1" />
        };
      } else if (domain.includes('flipkart')) {
        return { 
          name: 'Flipkart', 
          color: 'bg-blue-500 hover:bg-blue-600',
          icon: <FaShoppingBag className="inline mr-1" />
        };
      }
      
      return { 
        name: domain.replace('www.', '').split('.')[0], 
        color: 'bg-gray-500 hover:bg-gray-600',
        icon: <FaGlobe className="inline mr-1" />
      };
    } catch {
      return { 
        name: 'Shop', 
        color: 'bg-gray-500 hover:bg-gray-600',
        icon: <FaShoppingCart className="inline mr-1" />
      };
    }
  };
  
  const websiteInfo = getWebsiteInfo(product.url);
  
  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Calculate discount percentage and savings
  const discount = product.original_price && product.original_price > product.price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;
    
  const savings = Math.round(((product.original_price - product.price) / product.original_price) * 100) || 0;
    
  // Generate star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-yellow-400" />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  useEffect(() => {
    // Add staggered animation delay based on index
    const timer = setTimeout(() => {
      setIsHovered(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  // Handle save button click
  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newSavedState = !isSavedState;
    setIsSavedState(newSavedState);
    onSaveToggle(product.id, newSavedState);
  };

  // Handle share button click
  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareOptions(!showShareOptions);
    
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out this great deal on ${product.title} for ${formatPrice(product.price)}`,
        url: product.url,
      }).catch(console.error);
    }
  };

  // Handle price alert toggle
  const togglePriceAlert = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPriceAlert(!showPriceAlert);
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    }),
    hover: {
      y: -5,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }
  };

  return (
    <motion.div 
      className="relative bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowShareOptions(false);
      }}
    >
      {/* Product Image */}
      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 group">
        {/* Product Image */}
        <motion.div 
          className="relative h-full w-full flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <img
            src={product.image_url || '/placeholder-product.jpg'}
            alt={product.title}
            className="max-h-full max-w-full object-contain transition-all duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        </motion.div>
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {/* Save Button */}
          <button
            onClick={handleSaveClick}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
            aria-label={isSavedState ? 'Remove from saved items' : 'Save for later'}
          >
            {isSavedState ? (
              <FaHeart className="w-5 h-5 text-red-500" />
            ) : (
              <FiHeart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
            )}
          </button>
          
          {/* Share Button */}
          <div className="relative">
            <button
              onClick={handleShareClick}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
              aria-label="Share product"
            >
              <FiShare2 className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
            </button>
            
            {/* Share Options */}
            <AnimatePresence>
              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10"
                >
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                    <span className="mr-2">📱</span> Share via SMS
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                    <span className="mr-2">✉️</span> Share via Email
                  </button>
                  <button 
                    onClick={handleShareClick}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Website Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-100">
          {product.website?.toUpperCase() || 'STORE'}
        </div>
        
        {/* Discount Badge */}
        {savings > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform transition-transform group-hover:scale-110">
            <span className="flex items-center">
              <FaArrowDown className="mr-1" /> {savings}% OFF
            </span>
          </div>
        )}
        
        {/* Best Deal Badge */}
        {isBestDeal && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            <span className="flex items-center">
              <BsLightningChargeFill className="mr-1" /> Best Deal
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-5 pt-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 h-14 hover:text-indigo-600 transition-colors">
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {product.title || 'Product Title'}
          </a>
        </h3>
        
        {/* Price Section */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.original_price)}
                </span>
                <span className="ml-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save {formatPrice(product.original_price - product.price)}
                </span>
              </>
            )}
          </div>
          
          {/* Price History */}
          <div className="mt-1 text-xs text-gray-500 flex items-center">
            <FiClock className="mr-1" />
            <span>Lowest price in 30 days</span>
            <button 
              onClick={togglePriceAlert}
              className="ml-2 text-indigo-600 hover:underline text-xs"
            >
              {showPriceAlert ? 'Hide' : 'Price Alert'}
            </button>
          </div>
          
          {/* Price Alert Form */}
          {showPriceAlert && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">Get notified when price drops below:</p>
                <div className="flex">
                  <input 
                    type="number" 
                    className="flex-1 rounded-l-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter target price"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Set Alert
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Rating & Stock Status */}
        <div className="flex items-center justify-between mb-4">
          {product.rating ? (
            <div className="flex items-center">
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                <span className="text-yellow-500 font-bold mr-1">{product.rating.toFixed(1)}</span>
                <FaStar className="text-yellow-400" />
              </div>
              <span className="text-xs text-gray-500 ml-2">({product.ratingCount?.toLocaleString()} reviews)</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">No reviews yet</div>
          )}
          
          <div className="text-sm font-medium text-green-600 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            In Stock
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center"
          >
            <FiShoppingBag className="mr-2" />
            View on {product.website?.charAt(0).toUpperCase() + product.website?.slice(1) || 'Store'}
          </a>
          
          <button 
            className="w-full border border-gray-300 bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
            onClick={() => {
              // Add to cart functionality would go here
              console.log('Added to cart:', product.title);
            }}
          >
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add to Cart
          </button>
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Free Shipping</span>
              <span className="font-medium text-gray-700">Yes</span>
            </div>
            <div className="flex justify-between">
              <span>Return Policy</span>
              <span className="font-medium text-gray-700">30 Days</span>
            </div>
            <div className="flex justify-between">
              <span>Sold by</span>
              <span className="font-medium text-gray-700">{product.seller || 'Authorized Seller'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
