import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from starter.app import app

def test_homepage_loads():
    tester = app.test_client()
    response = tester.get('/')
    assert response.status_code == 200
