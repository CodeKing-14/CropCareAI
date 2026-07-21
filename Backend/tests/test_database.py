from database import _ensure_database_exists


class DummyCursor:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query, params=None):
        self.query = query
        self.params = params

    def fetchone(self):
        return None


class DummyConnection:
    def __init__(self):
        self.autocommit = False
        self.cursor_obj = DummyCursor()

    def cursor(self):
        return self.cursor_obj

    def close(self):
        return None


def test_ensure_database_exists_creates_missing_database(monkeypatch):
    captured = {}

    def fake_connect(**kwargs):
        captured.update(kwargs)
        return DummyConnection()

    monkeypatch.setattr("database.psycopg2.connect", fake_connect)

    _ensure_database_exists("postgresql://postgres:secret@localhost:5432/cropcare")

    assert captured["dbname"] == "postgres"
    assert captured["host"] == "localhost"
    assert captured["port"] == 5432
