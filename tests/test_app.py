from fastapi.testclient import TestClient
from copy import deepcopy

import pytest

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Make a deep copy of the in-memory activities and restore after each test
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    new_email = "test.student1@mergington.edu"

    # make sure not already registered
    assert new_email not in activities[activity]["participants"]

    # signup
    r = client.post(f"/activities/{activity}/signup?email={new_email}")
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # now participant should be present
    r = client.get("/activities")
    assert r.status_code == 200
    assert new_email in r.json()[activity]["participants"]

    # registering again should fail
    r = client.post(f"/activities/{activity}/signup?email={new_email}")
    assert r.status_code == 400

    # unregister
    r = client.post(f"/activities/{activity}/unregister?email={new_email}")
    assert r.status_code == 200
    assert "Unregistered" in r.json().get("message", "")

    # make sure participant removed
    r = client.get("/activities")
    assert r.status_code == 200
    assert new_email not in r.json()[activity]["participants"]


def test_signup_invalid_activity():
    r = client.post("/activities/NoSuchClub/signup?email=someone@x.com")
    assert r.status_code == 404


def test_unregister_not_registered():
    r = client.post("/activities/Chess Club/unregister?email=not@here.com")
    assert r.status_code == 400
