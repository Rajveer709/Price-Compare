"""
Test configuration and fixtures for the application.
"""
import os
import pytest
import asyncio
from typing import AsyncGenerator, Generator, Any
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.database import Base, get_db
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Set test environment variables before any imports
os.environ["TESTING"] = "true"
os.environ["REDIS_DISABLED"] = "true"  # Disable Redis for tests
os.environ["EBAY_APP_ID"] = "test_app_id"
os.environ["EBAY_CERT_ID"] = "test_cert_id"
os.environ["EBAY_DEV_ID"] = "test_dev_id"

# Use a separate test database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///./test.db"
)

# Create async engine for testing
async_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

# Create test session
TestingSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Create test database tables and drop them after tests complete."""
    # Create all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield  # Run tests
    
    # Drop all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    # Close the engine
    await async_engine.dispose()

@pytest.fixture
def override_get_db(db_session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """Override the get_db dependency for testing."""
    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        try:
            yield db_session
        finally:
            await db_session.rollback()
    return _get_db

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a new database session with a rollback at the end of the test."""
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

@pytest.fixture
async def async_client(
    db_session: AsyncSession,
    override_get_db: AsyncGenerator[AsyncSession, None]
) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client that uses the override_get_db fixture."""
    # Override the get_db dependency
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        try:
            yield client
        finally:
            # Clear overrides
            app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
async def clear_cache() -> AsyncGenerator[None, None]:
    """Clear Redis cache before and after each test."""
    from app.core.redis_client import get_redis
    redis = await get_redis()

# Add custom markers
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers",
        "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers",
        "slow: mark test as slow-running"
    )
