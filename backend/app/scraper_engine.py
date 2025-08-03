"""
Async scraping engine for e-commerce/product pages using Playwright.

- Uses Playwright for browser automation, supports residential proxies
- Randomizes headers, simulates human behavior (pauses, scrolling, mouse)
- Handles dynamic JS, waits for network idle
- Detects and solves CAPTCHAs via anti_captcha_api
- Loads/persists session cookies
- Extracts and normalizes data using selectors from SiteConfig
- Throws custom exceptions for selector/data issues
- Logs key events (timestamps, proxy, captcha)

Dependencies: playwright, python-dotenv, anti_captcha_api

Example usage:
    import asyncio
    from your_config_module import SiteConfig
    from scraper_engine import scrape_page

    async def main():
        site_config = SiteConfig(...)  # fill with your config
        result = await scrape_page(site_config)
        print(result)
    
    if __name__ == "__main__":
        asyncio.run(main())
"""

import asyncio
import random
import time
import logging
from datetime import datetime
from typing import Dict, Any
from pathlib import Path
from collections import defaultdict

from playwright.async_api import async_playwright, Page, BrowserContext, TimeoutError as PlaywrightTimeoutError
from playwright_stealth import stealth_async
from pydantic import BaseModel
from anti_captcha_api import solve as solve_captcha
from .proxy_manager import proxy_manager

# Assume SiteConfig is imported from elsewhere
# from .schemas import SiteConfig

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]
VIEWPORTS = [
    {"width": 1280, "height": 800},
    {"width": 1440, "height": 900},
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1536, "height": 864},
]
LANGUAGES = [
    ("en-US,en;q=0.9", ["en-US", "en"]),
    ("fr-FR,fr;q=0.9", ["fr-FR", "fr"]),
    ("de-DE,de;q=0.9", ["de-DE", "de"]),
]
VENDORS = ["Google Inc.", "Apple Computer, Inc.", "Mozilla Foundation"]
PLATFORMS = ["Win32", "MacIntel", "Linux x86_64"]
DEVICE_SCALE_FACTORS = [1, 1.25, 1.5, 2]

class ScraperEngineException(Exception):
    pass
class SelectorChangedException(ScraperEngineException):
    pass
class DataMissingException(ScraperEngineException):
    pass

# In-memory sticky session: {site_url: proxy_url}
_sticky_sessions = defaultdict(lambda: None)

async def _random_pause(min_s=0.5, max_s=2.0):
    await asyncio.sleep(random.uniform(min_s, max_s))

async def _simulate_human(page: Page):
    await _random_pause(1, 2)
    await page.mouse.move(random.randint(100, 500), random.randint(100, 500))
    if random.random() < 0.3:
        await page.mouse.click(random.randint(100, 500), random.randint(100, 500))
    await page.mouse.wheel(0, random.randint(100, 1000))
    await _random_pause(0.5, 1.5)
    for _ in range(random.randint(1, 3)):
        await page.keyboard.press("ArrowDown")
        await _random_pause(0.2, 0.5)

async def _load_cookies(context: BrowserContext, cookies_path: Path):
    if cookies_path.exists():
        cookies = cookies_path.read_text(encoding="utf-8")
        try:
            await context.add_cookies(eval(cookies))
        except Exception:
            pass

async def _save_cookies(context: BrowserContext, cookies_path: Path):
    cookies = await context.cookies()
    cookies_path.write_text(str(cookies), encoding="utf-8")

async def _detect_captcha(page: Page) -> bool:
    content = await page.content()
    if "captcha" in content.lower():
        return True
    challenge_selectors = ["iframe[src*='captcha']", "#captcha", ".g-recaptcha"]
    for sel in challenge_selectors:
        if await page.query_selector(sel):
            return True
    return False

async def _handle_captcha(page: Page, logger):
    logger.info("CAPTCHA detected, attempting to solve...")
    await solve_captcha(page)
    await _random_pause(2, 4)

async def _extract_data(page: Page, selectors: dict) -> dict:
    try:
        price_raw = await page.locator(selectors["price"]).inner_text()
        title = await page.locator(selectors["title"]).inner_text()
        image_url = await page.locator(selectors["image"]).get_attribute("src")
    except Exception as e:
        raise SelectorChangedException(f"Selector error: {e}")
    try:
        price = float(''.join(c for c in price_raw if c.isdigit() or c == '.' or c == ',' ).replace(',', '.'))
    except Exception:
        raise DataMissingException(f"Could not normalize price: {price_raw}")
    # Honeypot/hidden field filtering
    # Check if title or image is hidden or offscreen
    for sel in [selectors["title"], selectors["image"]]:
        el = await page.query_selector(sel)
        if el:
            visible = await el.is_visible()
            box = await el.bounding_box()
            if not visible or (box and (box["width"] == 0 or box["height"] == 0)):
                raise DataMissingException(f"Element {sel} is hidden or offscreen (honeypot?)")
    return {
        "price": price,
        "title": title.strip(),
        "image_url": image_url,
    }

def _randomize_context_options(site_config):
    user_agent = random.choice(USER_AGENTS)
    viewport = random.choice(VIEWPORTS)
    device_scale = random.choice(DEVICE_SCALE_FACTORS)
    lang_header, lang_list = random.choice(LANGUAGES)
    vendor = random.choice(VENDORS)
    platform = random.choice(PLATFORMS)
    headers = {
        "User-Agent": user_agent,
        "Accept-Language": lang_header,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": site_config.target_url,
    }
    return {
        "user_agent": user_agent,
        "viewport": viewport,
        "device_scale_factor": device_scale,
        "lang_header": lang_header,
        "lang_list": lang_list,
        "vendor": vendor,
        "platform": platform,
        "headers": headers,
    }

async def _get_sticky_proxy(site_url):
    if _sticky_sessions[site_url]:
        return _sticky_sessions[site_url]
    proxy = await proxy_manager.get_proxy()
    if proxy:
        _sticky_sessions[site_url] = proxy["http"]
        return proxy["http"]
    return None

async def scrape_page(site_config, max_retries=3) -> dict:
    """
    Scrape a product page using Playwright and site_config.
    Returns dict with normalized fields and raw HTML.
    Throws custom exceptions on failure.
    """
    logger = logging.getLogger("scraper_engine")
    site_url = site_config.target_url
    attempt = 0
    last_exc = None
    proxy_url = None
    while attempt < max_retries:
        context_opts = _randomize_context_options(site_config)
        proxy_url = await _get_sticky_proxy(site_url)
        logger.info(f"Scrape attempt {attempt+1}/{max_retries} for {site_url} | Proxy: {proxy_url}")
        start_time = time.time()
        cookies_path = Path(f"cookies_{site_url.replace('://', '_').replace('/', '_')}.txt")
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, proxy={"server": proxy_url} if proxy_url else None)
                context = await browser.new_context(
                    user_agent=context_opts["user_agent"],
                    extra_http_headers=context_opts["headers"],
                    viewport=context_opts["viewport"],
                    device_scale_factor=context_opts["device_scale_factor"],
                    locale=context_opts["lang_list"][0],
                    java_script_enabled=True,
                )
                # Set navigator.vendor and platform via evaluateOnNewDocument
                await context.add_init_script(f"Object.defineProperty(navigator, 'vendor', {{get: () => '{context_opts['vendor']}'}});")
                await context.add_init_script(f"Object.defineProperty(navigator, 'platform', {{get: () => '{context_opts['platform']}'}});")
                await _load_cookies(context, cookies_path)
                page = await context.new_page()
                await stealth_async(page)
                if getattr(site_config, "login_info", None):
                    pass  # Implement login if needed
                try:
                    await page.goto(site_config.target_url, wait_until="networkidle", timeout=20000)
                except PlaywrightTimeoutError as e:
                    logger.warning(f"Timeout navigating to {site_url}: {e}")
                    raise
                await _simulate_human(page)
                if await _detect_captcha(page):
                    logger.warning(f"CAPTCHA detected on {site_url} (attempt {attempt+1})")
                    await _handle_captcha(page, logger)
                    await page.reload(wait_until="networkidle")
                    await _simulate_human(page)
                data = await _extract_data(page, site_config.selectors)
                html = await page.content()
                await _save_cookies(context, cookies_path)
                await context.close()
                await browser.close()
                end_time = time.time()
                logger.info(f"Scrape finished: {datetime.utcnow().isoformat()} | Duration: {end_time - start_time:.2f}s | Proxy: {proxy_url}")
                await proxy_manager.mark_success(proxy_url, end_time - start_time)
                return {
                    **data,
                    "raw_html": html,
                    "scraped_at": datetime.utcnow().isoformat(),
                    "proxy": proxy_url,
                }
        except (SelectorChangedException, DataMissingException, PlaywrightTimeoutError, Exception) as exc:
            logger.warning(f"Scrape failed (attempt {attempt+1}) for {site_url} | Proxy: {proxy_url} | Error: {exc}")
            await proxy_manager.mark_failed(proxy_url)
            last_exc = exc
            # On proxy failure, clear sticky session for this site
            _sticky_sessions[site_url] = None
            await _random_pause(2 ** attempt, 2 ** (attempt + 1))  # Exponential backoff
            attempt += 1
    logger.error(f"All scrape attempts failed for {site_url} | Last error: {last_exc}")
    raise ScraperEngineException(f"All scrape attempts failed for {site_url}: {last_exc}")

# Example usage
if __name__ == "__main__":
    import asyncio
    # from your_config_module import SiteConfig
    # site_config = SiteConfig(...)
    async def main():
        pass  # Fill with actual SiteConfig and call scrape_page
    asyncio.run(main()) 