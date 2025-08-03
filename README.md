# Price Comparison Scraper

A scalable, containerized price comparison scraper with support for multiple e-commerce sites, proxy rotation, CAPTCHA solving, and notifications.

## Features

- 🛒 **Amazon Product Advertising API (PA-API) Integration**
  - Official API access to Amazon product data
  - Reliable and compliant product information
  - Support for product search, details, and deals
  - Built-in affiliate linking

- 🕷️ Web scraping with Playwright (headless browser)
  - Fallback for non-Amazon sites
  - JavaScript rendering support
  - Automated interactions

- 🔄 Proxy rotation with health checks
- 🛡️ CAPTCHA solving integration
- 🔐 Session management with cookie persistence
- 📊 Data extraction with CSS/XPath selectors
- 💾 Dual storage (PostgreSQL + MongoDB)
- 📧 Email and Slack notifications
- ⏰ Scheduled scraping tasks
- 🐳 Docker and Docker Compose support

## Prerequisites

- Docker and Docker Compose
- Python 3.10+ (for local development)
- Node.js (for Playwright browsers)
- [Amazon Associates Account](https://affiliate-program.amazon.com/) (for PA-API access)
- Amazon PA-API Credentials:
  - Access Key
  - Secret Key
  - Partner Tag (Associate ID)
- Anti-Captcha API key (optional, for CAPTCHA solving with scrapers)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/price-comparison-scraper.git
   cd price-comparison-scraper
   ```

2. Copy the example environment file and update with your settings:
   ```bash
   cp .env.example .env
   nano .env  # Edit the file with your configuration
   ```
   
   Configure your Amazon PA-API credentials:
   ```env
   # Amazon PA-API Credentials
   AMAZON_PAAPI_ACCESS_KEY=your-access-key
   AMAZON_PAAPI_SECRET_KEY=your-secret-key
   AMAZON_PARTNER_TAG=your-associate-tag-20
   AMAZON_PAAPI_REGION=us-east-1
   ```

3. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - PGAdmin: http://localhost:5050 (if enabled)

## Amazon PA-API Integration

This application uses Amazon's official Product Advertising API (PA-API) to fetch product data in a reliable and compliant way.

### Key Features

- **Product Search**: Search for products by keywords with filters
- **Product Details**: Get detailed product information by ASIN
- **Deals & Discounts**: Find products with special offers
- **Affiliate Linking**: Automatically includes your Amazon Associate tag in product URLs

### API Endpoints

- `GET /api/v1/amazon/search?query=...` - Search for products
- `GET /api/v1/amazon/products/{asin}` - Get product details by ASIN
- `GET /api/v1/amazon/deals` - Find deals and discounts

### Rate Limiting

The PA-API has the following rate limits:
- 1 request per second per IP address
- Maximum of 10 items per request
- 8640 requests per day (rolling 24-hour period)

The application includes built-in rate limiting to stay within these limits.

## How It Works

### Technical Architecture

1. **Scraping Engine**:
   - Uses Playwright for browser automation with headless Chrome/Firefox
   - Implements advanced anti-bot detection bypass techniques
   - Rotates user agents and browser fingerprints
   - Handles CAPTCHAs with multiple solving strategies

2. **Proxy Management**:
   - Rotates through a pool of proxies to avoid IP bans
   - Health checks to ensure only working proxies are used
   - Automatic retry with exponential backoff

3. **Data Processing**:
   - Extracts product data using CSS/XPath selectors
   - Normalizes data across different e-commerce sites
   - Stores structured data in PostgreSQL
   - Caches responses for performance

4. **Scheduling & Notifications**:
   - Runs on configurable schedules
   - Sends email/Slack notifications for price drops
   - Generates reports and analytics

## Monetization Strategy

### 1. Affiliate Marketing (Amazon Associates)
- **Integration**:
  - Seamless integration with Amazon Associates Program
  - Automatic conversion of product links to affiliate links
  - Real-time commission tracking

- **Implementation**:
  ```python
  def convert_to_affiliate_link(product_url, affiliate_tag):
      # Example: Add your Amazon Associates tag to the URL
      if 'amazon.' in product_url and 'tag=' not in product_url:
          if '?' in product_url:
              return f"{product_url}&tag={affiliate_tag}"
          return f"{product_url}?tag={affiliate_tag}"
      return product_url
  ```

### 2. Ad Revenue
- **Display Ads**:
  - Google AdSense integration
  - Responsive ad units for all screen sizes
  - Optimized ad placement for maximum CTR

- **Sponsored Placements**:
  - Featured product spots
  - Highlighted deals section
  - Native advertising integration

### Stripe Integration (For Future Use)
The application is prepared for Stripe integration. To enable:
1. Sign up at [Stripe](https://dashboard.stripe.com/register)
2. Add your API keys to `.env`:
   ```
   STRIPE_SECRET_KEY=your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
   ```
3. Uncomment the Stripe routes in the API

## Configuration

Edit the `.env` file to configure:

- Database settings (PostgreSQL/MongoDB)
- Proxy configuration
- CAPTCHA solving
- Notification settings (Email/Slack)
- Scheduler settings
- Request timeouts and retries

## Project Structure

```
price-compare/
├── backend/                 # Backend application
│   ├── app/                 # Application code
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Core functionality
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── config.py        # Configuration
│   │   └── main.py          # FastAPI application
│   ├── data/                # Data storage
│   │   ├── backups/         # JSON backups
│   │   └── sessions/        # Session data
│   ├── .env.example         # Example environment variables
│   ├── Dockerfile           # Docker configuration
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Backend documentation
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # Project documentation
```

## Adding a New Scraper

### Adding a New Retailer

#### For Amazon Products
1. Use the built-in PA-API integration by making requests to the Amazon endpoints
2. No need to implement custom scrapers for Amazon products

#### For Other Retailers
1. Create a new file in `app/scrapers/` (e.g., `walmart.py`)
2. Implement the scraper class with required methods
3. Add the scraper to the `SCRAPERS` dictionary in `app/scrapers/__init__.py`
4. Configure selectors in `app/config/scrapers.py`

Example scraper:

```python
from app.scrapers.base import BaseScraper

class AmazonScraper(BaseScraper):
    name = "amazon"
    base_url = "https://www.amazon.com"
    
    async def scrape_product(self, url: str) -> dict:
        await self.page.goto(url)
        # Extract data using selectors
        return {
            "name": await self.extract_text("#productTitle"),
            "price": await self.extract_price("#priceblock_ourprice"),
            # ... other fields
        }
```

## API Endpoints

- `GET /api/products` - List all products
- `GET /api/products/{product_id}` - Get product details
- `GET /api/products/{product_id}/history` - Get price history
- `POST /api/scrape` - Trigger manual scrape
- `GET /api/jobs` - List scheduled jobs
- `POST /api/jobs/{job_id}/run` - Run a job manually

## Development

1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r backend/requirements-dev.txt
   playwright install
   ```

3. Run the development server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

## Deployment

1. Configure production settings in `.env`
2. Build and start the stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
3. Set up a reverse proxy (Nginx/Apache) with SSL

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
