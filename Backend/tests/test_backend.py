from io import BytesIO

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root_endpoint_returns_expected_message():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == "CropCare AI Backend Running"


def test_predict_rejects_invalid_upload():
    response = client.post(
        "/predict",
        files={"image": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()
