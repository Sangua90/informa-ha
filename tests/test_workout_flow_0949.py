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

    def post(self, route):
        return self._route("POST", route)

    def get(self, route):
        return self._route("GET", route)

    def _route(self, method, route):
        def decorator(function):
            self.routes[(method, route)] = function
            return function
        return decorator


class WorkoutFlow0949Test(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "informa.db"
        con = sqlite3.connect(self.db_path)
        con.execute("CREATE TABLE workouts(id INTEGER PRIMARY KEY AUTOINCREMENT,ts TEXT NOT NULL,title TEXT NOT NULL,duration_min INTEGER,notes TEXT)")
        con.commit()
        con.close()

        root = types.ModuleType("app")
        root.VERSION = "0.9.48"

        def db():
            connection = sqlite3.connect(self.db_path)
            connection.row_factory = sqlite3.Row
            return connection

        root.db = db
        root.jsonify = lambda **values: values
        base = types.ModuleType("health_metrics_0947")
        base.app = FakeApp()

        self.previous = {name: sys.modules.get(name) for name in ("app", "health_metrics_0947")}
        sys.modules["app"] = root
        sys.modules["health_metrics_0947"] = base

        module_path = Path(__file__).parents[1] / "informa" / "workout_flow_0949.py"
        spec = importlib.util.spec_from_file_location("workout_flow_0949_under_test", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.root = root

    def tearDown(self):
        for name, previous in self.previous.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous
        self.tempdir.cleanup()

    def request(self, payload):
        self.module.request = types.SimpleNamespace(get_json=lambda force=True: payload)
        return self.module.workout_flow_archive_0949()

    def test_archive_creates_workout_and_updates_same_exercise(self):
        first = self.request({"exercise": "Lat machine al petto", "status": "Completato", "priority": "Essenziale"})
        self.assertTrue(first["ok"])
        workout_id = first["workout_id"]

        second = self.request({"workout_id": workout_id, "exercise": "Lat machine al petto", "status": "Parziale", "notes": "2 serie"})
        self.assertEqual("updated", second["mode"])

        con = self.root.db()
        rows = con.execute("SELECT workout_id,exercise,status,notes FROM exercise_status").fetchall()
        workouts = con.execute("SELECT id FROM workouts").fetchall()
        con.close()
        self.assertEqual(1, len(workouts))
        self.assertEqual(1, len(rows))
        self.assertEqual(workout_id, rows[0]["workout_id"])
        self.assertEqual("Parziale", rows[0]["status"])
        self.assertEqual("2 serie", rows[0]["notes"])

    def test_invalid_status_is_rejected(self):
        response, code = self.request({"exercise": "Lat machine", "status": "Cancellato"})
        self.assertEqual(400, code)
        self.assertFalse(response["ok"])

    def test_frontend_keeps_state_and_does_not_enable_timer_change(self):
        source = (Path(__file__).parents[1] / "informa" / "web" / "workout_flow_0949.js").read_text()
        for marker in ("exercise_state_persistent=1", "await archive(oldId,'Parziale'", "if949Start", "Mancano delle serie"):
            self.assertIn(marker, source)
        self.assertNotIn("startTimer(", source)


if __name__ == "__main__":
    unittest.main()
