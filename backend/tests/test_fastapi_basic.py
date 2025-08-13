"""
Basic FastAPI test file to verify the test environment is working with FastAPI.
"""
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

# Create a simple FastAPI app for testing
app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

# Create a test client
client = TestClient(app)

def test_read_root():
    """Test the root endpoint of our test FastAPI app."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

# Test with the actual app
from app.main import app as real_app
real_client = TestClient(real_app)

def test_real_app_root():
    """Test the root endpoint of the real FastAPI app."""
    response = real_client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
