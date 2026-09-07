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


class WorkoutTvLayout0946Test(unittest.TestCase):
    def setUp(self):
        self.app = FakeFlaskApp()
        root = types.ModuleType("app")
        root.VERSION = "0.9.45"
        root.jsonify = lambda **values: values
        base = types.ModuleType("workout_tv_0945")
        base.app = self.app
        self.previous_modules = {name: sys.modules.get(name) for name in ("app", "workout_tv_0945")}
        sys.modules.update({"app": root, "workout_tv_0945": base})

        project = Path(__file__).parents[1]
        module_path = project / "informa" / "workout_tv_layout_0946.py"
        spec = importlib.util.spec_from_file_location("workout_tv_layout_0946_under_test", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.root = root
        self.javascript = (project / "informa" / "web" / "workout_tv_layout_0946.js").read_text()

    def tearDown(self):
        for name, previous in self.previous_modules.items():
            if previous is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = previous

    def test_backend_exposes_compact_layout_contract(self):
        response = self.app.routes["/api/workout-tv-layout-0946-info"]()
        self.assertEqual("0.9.46", self.root.VERSION)
        self.assertTrue(response["full_width"])
        self.assertTrue(response["compact_stage"])
        self.assertTrue(response["compact_sets"])
        self.assertTrue(response["duplicate_title_hidden"])

    def test_frontend_uses_full_width_and_compact_boxes(self):
        required = (
            "width:100vw!important",
            "margin:0!important",
            "minmax(220px,27%)",
            ".if945-tv-stage>h1{display:none!important}",
            ".if945-current .if67-index{display:none!important}",
            "min-height:42px",
            "duplicate_title_hidden=1",
        )
        for marker in required:
            self.assertIn(marker, self.javascript)


if __name__ == "__main__":
    unittest.main()
