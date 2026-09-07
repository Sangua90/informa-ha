import importlib.util
import json
import sqlite3
import sys
import tempfile
import types
import unittest
from pathlib import Path


class FakeFlaskApp:
    def __init__(self):
        self.routes = {}

    def get(self, route):
        def decorator(function):
            self.routes[route] = function
            return function
        return decorator


class HealthMetrics0947Test(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "informa.db"
        con = sqlite3.connect(self.db_path)
        con.execute("""CREATE TABLE health_rest_metrics(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          units TEXT,
          sample_ts TEXT,
          sample_hash TEXT NOT NULL UNIQUE,
          sample_json TEXT NOT NULL,
          received_at TEXT NOT NULL
        )""")
        con.commit()
        con.close()

        root = types.ModuleType("app")
        root.VERSION = "0.9.46"

        def db():
            connection = sqlite3.connect(self.db_path)
            connection.row_factory = sqlite3.Row
            return connection

        root.db = db
        root.jsonify = lambda **values: values

        self.app = FakeFlaskApp()
        base = types.ModuleType("workout_tv_layout_0946")
        base.app = self.app
        context = types.ModuleType("health_context_0939")
        rest = types.ModuleType("health_rest_0942")
        rest._rest_status = lambda: {
            "imports": 74,
            "metric_samples": 750,
            "workouts": 112,
            "last_import": {"received_at": "2026-09-07T21:00:00"},
        }
        health_base = types.ModuleType("health_rest_dashboard_0944")
        health_base._health_rest_snapshot_0944 = lambda: {"transport": "home_assistant"}

        def canonical(metrics, status):
            data = {}
            aliases = {
                "steps": ("step_count",),
                "heart_rate": ("heart_rate_average",),
                "resting_heart_rate": ("resting_heart_rate",),
                "hrv": ("heart_rate_variability",),
                "blood_oxygen": ("blood_oxygen_saturation",),
            }
            for output, candidates in aliases.items():
                for candidate in candidates:
                    if candidate in metrics:
                        data[output] = metrics[candidate]
                        break
            data["last_sync"] = {"value": status["last_import"]["received_at"]}
            return data

        health_base._canonical_data = canonical
        names = (
            "app",
            "workout_tv_layout_0946",
            "health_context_0939",
            "health_rest_0942",
            "health_rest_dashboard_0944",
        )
        self.previous_modules = {name: sys.modules.get(name) for name in names}
        sys.modules.update({
            "app": root,
            "workout_tv_layout_0946": base,
            "health_context_0939": context,
            "health_rest_0942": rest,
            "health_rest_dashboard_0944": health_base,
        })

        module_path = Path(__file__).parents[1] / "informa" / "health_metrics_0947.py"
        spec = importlib.util.spec_from_file_location("health_metrics_0947_under_test", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.root = root
        self.context = context

    def tearDown(self):
        for name, previous in self.previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous
        self.tempdir.cleanup()

    def add(self, name, timestamp, sample, unit="count", received_at=None):
        received_at = received_at or "2026-09-07T21:00:00"
        con = self.root.db()
        con.execute(
            "INSERT INTO health_rest_metrics(metric_name,units,sample_ts,sample_hash,sample_json,received_at) VALUES(?,?,?,?,?,?)",
            (name, unit, timestamp, f"{name}-{timestamp}-{json.dumps(sample, sort_keys=True)}", json.dumps(sample), received_at),
        )
        con.commit()
        con.close()

    def test_daily_aggregation_heart_expansion_units_and_rounding(self):
        self.add("step_count", "2026-09-05 20:00:00 +0200", {"qty": 9000}, received_at="2026-09-05T20:05:00")
        self.add("step_count", "2026-09-06 08:00:00 +0200", {"qty": 1000}, received_at="2026-09-06T08:05:00")
        self.add("step_count", "2026-09-06 08:00:00 +0200", {"qty": 1200}, received_at="2026-09-06T08:10:00")
        self.add("step_count", "2026-09-06 09:00:00 +0200", {"qty": 1450})
        self.add("step_count", "2026-09-06 10:00:00 +0200", {"qty": 1600})
        self.add("step_count", "2026-09-06 11:00:00 +0200", {"qty": 1427})
        self.add("heart_rate", "2026-09-06 08:00:00 +0200", {"Min": 70, "Avg": 80, "Max": 100}, "count/min")
        self.add("heart_rate", "2026-09-06 09:00:00 +0200", {"Min": 65, "Avg": 90, "Max": 136}, "count/min")
        self.add("active_energy", "2026-09-06 00:00:00 +0200", {"qty": 1480.470744}, "kJ")
        self.add("walking_running_distance", "2026-09-06 08:00:00 +0200", {"qty": 0.5}, "km")
        self.add("walking_running_distance", "2026-09-06 09:00:00 +0200", {"qty": 1.25}, "km")
        self.add("walking_double_support_percentage", "2026-09-06 00:00:00 +0200", {"qty": 31.900000000000002}, "%")

        snapshot = self.module._health_metrics_snapshot_0947()
        metrics = snapshot["metrics"]

        self.assertEqual(5677, metrics["step_count"]["value"])
        self.assertEqual("daily_sum", metrics["step_count"]["aggregation"])
        self.assertEqual(1.75, metrics["walking_running_distance"]["value"])
        self.assertEqual(353.8, metrics["active_energy"]["value"])
        self.assertEqual("kcal", metrics["active_energy"]["unit"])
        self.assertEqual(31.9, metrics["walking_double_support_percentage"]["value"])
        self.assertEqual(65, metrics["heart_rate_min"]["value"])
        self.assertEqual(85, metrics["heart_rate_average"]["value"])
        self.assertEqual(136, metrics["heart_rate_max"]["value"])
        self.assertEqual("bpm", metrics["heart_rate_average"]["unit"])
        self.assertNotIn("heart_rate", metrics)
        self.assertEqual(5677, snapshot["data"]["steps"]["value"])
        self.assertEqual(85, snapshot["data"]["heart_rate"]["value"])
        self.assertIs(self.root.healthsync_snapshot, self.module._health_metrics_snapshot_0947)
        self.assertIs(self.context._health_auto_export_snapshot_0939, self.module._health_metrics_snapshot_0947)

    def test_all_21_real_export_metric_types_are_retained(self):
        names = (
            "step_count", "walking_running_distance", "active_energy", "basal_energy_burned",
            "environmental_audio_exposure", "resting_heart_rate", "heart_rate",
            "walking_step_length", "walking_heart_rate_average", "apple_stand_hour",
            "walking_double_support_percentage", "flights_climbed", "walking_asymmetry_percentage",
            "blood_oxygen_saturation", "physical_effort", "time_in_daylight",
            "apple_exercise_time", "apple_stand_time", "stair_speed_down", "walking_speed",
            "heart_rate_variability",
        )
        for index, name in enumerate(names):
            sample = {"Min": 71, "Avg": 95.67, "Max": 136} if name == "heart_rate" else {"qty": index + 1.25}
            unit = "count/min" if name in ("heart_rate", "resting_heart_rate", "walking_heart_rate_average") else ("%" if "percentage" in name or name == "blood_oxygen_saturation" else "count")
            self.add(name, "2026-09-06 00:00:00 +0200", sample, unit)

        snapshot = self.module._health_metrics_snapshot_0947()

        self.assertEqual(21, snapshot["raw_metric_types"])
        self.assertEqual(23, snapshot["found"])
        self.assertEqual(23, len(snapshot["metrics"]))
        self.assertIn("time_in_daylight", snapshot["metrics"])
        self.assertIn("stair_speed_down", snapshot["metrics"])

    def test_frontend_reports_types_values_and_real_last_import(self):
        project = Path(__file__).parents[1]
        javascript = (project / "informa" / "web" / "health_rest_dashboard_0944.js").read_text()
        for marker in ("Tipi ricevuti", "Valori disponibili", "rest.last_import?.received_at", "Tempo alla luce del giorno", "Velocità discesa scale"):
            self.assertIn(marker, javascript)


if __name__ == "__main__":
    unittest.main()
