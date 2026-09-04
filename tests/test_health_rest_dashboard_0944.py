import importlib.util
import json
import sqlite3
import sys
import tempfile
import types
import unittest
from pathlib import Path


class FakeFlaskApp:
    def get(self, _route):
        return lambda function: function


class HealthRestDashboard0944Test(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "informa.db"
        con = sqlite3.connect(self.db_path)
        con.executescript("""
        CREATE TABLE health_rest_imports(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          received_at TEXT NOT NULL,
          payload_hash TEXT NOT NULL UNIQUE,
          kind TEXT,
          metric_count INTEGER NOT NULL DEFAULT 0,
          workout_count INTEGER NOT NULL DEFAULT 0,
          payload_json TEXT NOT NULL
        );
        CREATE TABLE health_rest_metrics(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          units TEXT,
          sample_ts TEXT,
          sample_hash TEXT NOT NULL UNIQUE,
          sample_json TEXT NOT NULL,
          received_at TEXT NOT NULL
        );
        CREATE TABLE health_rest_workouts(
          ext_id TEXT PRIMARY KEY,
          name TEXT,
          start_ts TEXT,
          end_ts TEXT,
          duration_sec REAL,
          payload_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """)
        con.commit()
        con.close()

        root = types.ModuleType("app")
        root.VERSION = "0.9.43"
        root.healthsync_snapshot = lambda: {
            "connected": True,
            "found": 1,
            "data": {"steps": {"value": 99}},
            "metrics": {"step_count": {"value": 99}},
        }

        def db():
            connection = sqlite3.connect(self.db_path)
            connection.row_factory = sqlite3.Row
            return connection

        root.db = db
        root.jsonify = lambda **values: values

        branding = types.ModuleType("health_branding_0943")
        branding.app = FakeFlaskApp()
        context = types.ModuleType("health_context_0939")
        context._health_auto_export_snapshot_0939 = root.healthsync_snapshot
        rest = types.ModuleType("health_rest_0942")

        def rest_status():
            connection = db()
            imports = connection.execute("SELECT COUNT(*) FROM health_rest_imports").fetchone()[0]
            samples = connection.execute("SELECT COUNT(*) FROM health_rest_metrics").fetchone()[0]
            workouts = connection.execute("SELECT COUNT(*) FROM health_rest_workouts").fetchone()[0]
            last = connection.execute("SELECT received_at,kind,metric_count,workout_count FROM health_rest_imports ORDER BY id DESC LIMIT 1").fetchone()
            connection.close()
            return {
                "imports": imports,
                "metric_samples": samples,
                "workouts": workouts,
                "last_import": dict(last) if last else None,
            }

        rest._rest_status = rest_status
        self.root = root
        self.context = context
        self.previous_modules = {name: sys.modules.get(name) for name in ("app", "health_branding_0943", "health_context_0939", "health_rest_0942")}
        sys.modules.update({
            "app": root,
            "health_branding_0943": branding,
            "health_context_0939": context,
            "health_rest_0942": rest,
        })

        module_path = Path(__file__).parents[1] / "informa" / "health_rest_dashboard_0944.py"
        spec = importlib.util.spec_from_file_location("health_rest_dashboard_0944_under_test", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)

    def tearDown(self):
        for name, previous in self.previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous
        self.tempdir.cleanup()

    def test_rest_metrics_and_workout_feed_existing_dashboard_shape(self):
        con = self.root.db()
        con.execute(
            "INSERT INTO health_rest_imports(received_at,payload_hash,kind,metric_count,workout_count,payload_json) VALUES(?,?,?,?,?,?)",
            ("2026-09-04T12:00:00", "import-1", "metrics+workouts", 2, 1, "{}"),
        )
        con.execute(
            "INSERT INTO health_rest_metrics(metric_name,units,sample_ts,sample_hash,sample_json,received_at) VALUES(?,?,?,?,?,?)",
            ("step_count", "count", "2026-09-04 11:00:00 +0000", "sample-1", json.dumps({"date": "2026-09-04 11:00:00 +0000", "qty": 1234}), "2026-09-04T12:00:00"),
        )
        con.execute(
            "INSERT INTO health_rest_metrics(metric_name,units,sample_ts,sample_hash,sample_json,received_at) VALUES(?,?,?,?,?,?)",
            ("heart_rate_average", "bpm", "2026-09-04 11:00:00 +0000", "sample-2", json.dumps({"date": "2026-09-04 11:00:00 +0000", "Avg": 68}), "2026-09-04T12:00:00"),
        )
        con.execute(
            "INSERT INTO health_rest_workouts(ext_id,name,start_ts,end_ts,duration_sec,payload_json,updated_at) VALUES(?,?,?,?,?,?,?)",
            ("workout-1", "Functional Strength Training", "2026-09-04T10:00:00", "2026-09-04T10:45:00", 2700, "{}", "2026-09-04T12:00:00"),
        )
        con.commit()
        con.close()

        snapshot = self.module._health_rest_snapshot_0944()

        self.assertEqual("rest", snapshot["transport"])
        self.assertEqual(2, snapshot["found"])
        self.assertEqual(1234, snapshot["data"]["steps"]["value"])
        self.assertEqual(68, snapshot["data"]["heart_rate"]["value"])
        self.assertEqual("Functional Strength Training", snapshot["data"]["last_workout_type"]["value"])
        self.assertEqual(1, snapshot["rest"]["workouts"])
        self.assertIs(self.root.healthsync_snapshot, self.module._health_rest_snapshot_0944)
        self.assertIs(self.context._health_auto_export_snapshot_0939, self.module._health_rest_snapshot_0944)

    def test_legacy_entities_remain_the_fallback_without_rest_metrics(self):
        snapshot = self.module._health_rest_snapshot_0944()

        self.assertEqual("home_assistant", snapshot["transport"])
        self.assertEqual(99, snapshot["data"]["steps"]["value"])


if __name__ == "__main__":
    unittest.main()
