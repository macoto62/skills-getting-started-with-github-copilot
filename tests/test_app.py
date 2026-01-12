import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_data():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original))


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_adds_participant_and_shows_in_list():
    email = "newstudent@mergington.edu"
    activity = "Chess Club"

    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response.status_code == 200

    list_response = client.get("/activities")
    assert email in list_response.json()[activity]["participants"]


def test_duplicate_signup_rejected():
    activity = "Chess Club"
    email = "michael@mergington.edu"

    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response.status_code == 400


def test_signup_nonexistent_activity_returns_404():
    response = client.post("/activities/Nonexistent/signup", params={"email": "student@mergington.edu"})
    assert response.status_code == 404


def test_delete_participant_removes_and_returns_success():
    activity = "Chess Club"
    email = "michael@mergington.edu"

    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 200

    data = client.get("/activities").json()
    assert email not in data[activity]["participants"]


def test_delete_missing_participant_returns_404():
    activity = "Chess Club"
    email = "notinlist@mergington.edu"

    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 404
