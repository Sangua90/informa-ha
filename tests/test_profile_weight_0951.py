import importlib.util
import sqlite3
import sys
import tempfile
import types
import unittest
from pathlib import Path


class FakeApp:
    def __init__(self):
        self.routes = {}
        self.view_functions = {"state": lambda: {"ok": True}}

    def get(self, route):
        def decorator(function):
            self.routes[route] = function
            return function
        return decorator


class ProfileWeight0951Test(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "informa.db"
        con = sqlite3.connect(self.db_path)
        con.executescript("""
          CREATE TABLE profile(id INTEGER PRIMARY KEY,weight_kg REAL);
          INSERT INTO profile(id,weight_kg) VALUES(1,120);
          CREATE TABLE body_measurements(
            id INTEGER PRIMARY KEY AUTOINCREMENT,ts TEXT NOT NULL,weight_kg REAL,
            waist_cm REAL,chest_cm REAL,arm_r_cm REAL,arm_l_cm REAL,thigh_r_cm REAL,thigh_l_cm REAL
          );
          INSERT INTO body_measurements(ts,weight_kg,waist_cm,chest_cm) VALUES('2026-09-01',120,110,125);
        """)
        con.commit();con.close()

        root = types.ModuleType("app")
        root.VERSION = "0.9.50"

        def db():
            connection = sqlite3.connect(self.db_path)
            connection.row_factory = sqlite3.Row
            return connection

        root.db = db
        root.jsonify = lambda **values: values
        root.healthsync_snapshot = lambda: {
            "data": {"weight": {"value": 118.4, "unit": "kg", "last_updated": "2026-09-14T08:00:00+02:00"}}
        }
        base = types.ModuleType("workout_focus_0950")
        base.app = FakeApp()

        self.previous = {name: sys.modules.get(name) for name in ("app", "workout_focus_0950")}
        sys.modules["app"] = root
        sys.modules["workout_focus_0950"] = base
        path = Path(__file__).parents[1] / "informa" / "profile_weight_0951.py"
        spec = importlib.util.spec_from_file_location("profile_weight_0951_under_test", path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.root = root
        self.app = base.app

    def tearDown(self):
        for name, previous in self.previous.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous
        self.tempdir.cleanup()

    def test_weight_sync_updates_profile_history_and_preserves_measurements(self):
        result = self.module._sync_apple_weight()
        self.assertTrue(result["available"])
        self.assertTrue(result["synced"])

        con = self.root.db()
        profile = con.execute("SELECT weight_kg FROM profile WHERE id=1").fetchone()
        latest = con.execute("SELECT * FROM body_measurements ORDER BY id DESC LIMIT 1").fetchone()
        self.assertEqual(118.4, profile["weight_kg"])
        self.assertEqual(118.4, latest["weight_kg"])
        self.assertEqual(110, latest["waist_cm"])
        self.assertEqual(125, latest["chest_cm"])
        con.close()

        self.module._sync_apple_weight()
        con = self.root.db()
        count = con.execute("SELECT COUNT(*) c FROM body_measurements").fetchone()["c"]
        con.close()
        self.assertEqual(2, count)

    def test_state_endpoint_runs_sync(self):
        response = self.app.view_functions["state"]()
        self.assertTrue(response["ok"])
        con = self.root.db()
        value = con.execute("SELECT weight_kg FROM profile WHERE id=1").fetchone()["weight_kg"]
        con.close()
        self.assertEqual(118.4, value)

    def test_pounds_are_converted_and_implausible_values_rejected(self):
        self.assertEqual(99.79, self.module._weight_kg(220, "lb"))
        self.assertIsNone(self.module._weight_kg(10, "kg"))
        self.assertIsNone(self.module._weight_kg(80, "stone"))

    def test_frontend_shows_source_and_timestamp(self):
        source = (Path(__file__).parents[1] / "informa" / "web" / "profile_weight_0951.js").read_text()
        for marker in ("Origine peso", "Ultima pesata", "Apple Salute · Health Auto Export", "weight_source_ui=1"):
            self.assertIn(marker, source)


if __name__ == "__main__":
    unittest.main()
