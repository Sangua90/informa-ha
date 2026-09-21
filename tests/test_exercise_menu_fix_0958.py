from container_contract import assert_container
import importlib.util
import sys
import types
import unittest
from pathlib import Path


class ExerciseMenuFix0958Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_menu_uses_real_server_link_instead_of_javascript(self):
        source = (self.project / "informa" / "coach_library_096.py").read_text()
        self.assertIn('<a id="exercisesStaticButton"', source)
        self.assertIn('href="exercise-library-0958?v=0958"', source)
        self.assertNotIn(
            'id="exercisesStaticButton" class="btn secondary" \'onclick=', source
        )

    def test_standalone_page_contains_filtered_catalog(self):
        class DummyApp:
            def get(self, _path):
                return lambda function: function

        class DummyResponse:
            def __init__(self, body, **kwargs):
                self.body = body
                self.kwargs = kwargs

        root = types.SimpleNamespace(
            VERSION="0.9.57",
            Response=DummyResponse,
            jsonify=lambda **data: data,
        )
        groups = [
            ("Petto", [("Chest press alla macchina", "3 × 10")]),
            (
                "Bicipiti e avambracci",
                [("Curl bicipiti al cavo basso con appoggio inclinato", "3 × 12")],
            ),
        ]
        modules = {
            "flask": types.SimpleNamespace(Response=DummyResponse),
            "app": root,
            "coach_library_096": types.SimpleNamespace(GROUPS=groups),
            "exercise_menu_fix_0957": types.SimpleNamespace(app=DummyApp()),
        }
        previous = {name: sys.modules.get(name) for name in modules}
        sys.modules.update(modules)
        try:
            path = self.project / "informa" / "exercise_menu_fix_0958.py"
            spec = importlib.util.spec_from_file_location("exercise_menu_fix_0958_test", path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            page = module._standalone_library()
            self.assertIn('data-page="exercises-server"', page)
            self.assertEqual(2, page.count('<div class="measure">'))
            self.assertIn("Curl bicipiti al cavo basso con appoggio inclinato", page)
            self.assertIn('href="./?v=0958"', page)
            response = module.exercise_library_0958()
            self.assertIsInstance(response, DummyResponse)
            self.assertIn('data-page="exercises-server"', response.body)
            self.assertEqual("0.9.58", root.VERSION)
        finally:
            for name, old in previous.items():
                if old is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = old

    def test_assets_and_container_are_versioned(self):
        index = (self.project / "informa" / "web" / "index.html").read_text()
        self.assertRegex(index, r'style\.css\?v=\d+')
        self.assertRegex(index, r'app\.js\?v=\d+')
        assert_container(self, "exercise_menu_fix_0958", "0.9.58")


if __name__ == "__main__":
    unittest.main()
