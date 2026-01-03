import copy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Return a TestClient instance for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Backup and restore the in-memory activities before/after each test."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)
