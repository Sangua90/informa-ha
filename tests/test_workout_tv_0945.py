import importlib.util
import sys
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


class WorkoutTv0945Test(unittest.TestCase):
    def setUp(self):
        self.app = FakeFlaskApp()
        root = types.ModuleType("app")
        root.VERSION = "0.9.44"
        root.jsonify = lambda **values: values
        base = types.ModuleType("health_rest_dashboard_0944")
        base.app = self.app
        self.previous_modules = {name: sys.modules.get(name) for name in ("app", "health_rest_dashboard_0944")}
        sys.modules.update({"app": root, "health_rest_dashboard_0944": base})

        project = Path(__file__).parents[1]
        module_path = project / "informa" / "workout_tv_0945.py"
        spec = importlib.util.spec_from_file_location("workout_tv_0945_under_test", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.root = root
        self.javascript = (project / "informa" / "web" / "workout_tv_0945.js").read_text()

    def tearDown(self):
        for name, previous in self.previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous

    def test_backend_exposes_feature_contract_and_version(self):
        response = self.app.routes["/api/workout-tv-0945-info"]()

        self.assertEqual("0.9.45", self.root.VERSION)
        self.assertTrue(response["landscape_auto"])
        self.assertTrue(response["airplay_mirroring"])
        self.assertTrue(response["phone_remote"])
        self.assertTrue(response["workout_focus"])
        self.assertTrue(response["recovery_timer"])

    def test_frontend_contract_covers_landscape_workout_and_recovery(self):
        required = (
            "(orientation: landscape)",
            "if945-tv-mode",
            "firstPendingIndex",
            "IF50.started",
            "if945TvMove",
            "if945TvPending",
            "Fine allenamento",
            "iPhone telecomando",
            "[data-page=\"recovery\"] .timer",
            "landscape_auto=1",
            "recovery_timer=1",
        )
        for marker in required:
            self.assertIn(marker, self.javascript)
        self.assertNotIn("if928WorkoutPrepared", self.javascript)
        self.assertNotIn("MutationObserver", self.javascript)


if __name__ == "__main__":
    unittest.main()
