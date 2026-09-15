import importlib.util
import sys
import types
import unittest
from pathlib import Path


class ExerciseMenuFix0957Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_server_injects_canonical_button_and_filtered_page(self):
        source = (self.project / "informa" / "coach_library_096.py").read_text()
        self.assertIn('id="exercisesStaticButton"', source)
        self.assertIn('href="exercise-library-0958?v=0958"', source)
        self.assertIn("Curl bicipiti al cavo basso con appoggio inclinato", source)
        for removed in (
            "Rematore al cavo basso",
            "Hammer curl con corda",
            "Squat al cavo basso",
            "Glute kickback al cavo basso",
            "Calf raise al cavo basso",
        ):
            self.assertNotIn(f'(\"{removed}\",', source)

    def test_backend_response_contains_one_working_menu_and_24_exercises(self):
        class DummyApp:
            def __init__(self):
                self.after_request_funcs = {None: []}

            def after_request(self, function):
                self.after_request_funcs[None].append(function)
                return function

        class DummyResponse:
            def __init__(self, html):
                self.html = html
                self.headers = {"Content-Type": "text/html"}

            def get_data(self, as_text=False):
                return self.html

            def set_data(self, html):
                self.html = html

        app = DummyApp()
        root = types.SimpleNamespace(VERSION="0.9.56", request=types.SimpleNamespace(path="/"))
        modules = {
            "app": root,
            "coach_library_094": types.SimpleNamespace(app=app),
        }
        previous = {name: sys.modules.get(name) for name in modules}
        sys.modules.update(modules)
        try:
            path = self.project / "informa" / "coach_library_096.py"
            spec = importlib.util.spec_from_file_location("coach_library_096_test", path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            response = DummyResponse(
                '<section class="page" data-page="profile">'
                '<button class="btn secondary" onclick="go(\'coach\')">Settimana e Coach</button>'
                '</section><section class="page" data-page="profiledata"></section>'
            )
            module.exercises_backend_096(response)
            self.assertEqual(1, response.html.count('id="exercisesStaticButton"'))
            self.assertEqual(1, response.html.count('data-page="exercises-static"'))
            self.assertEqual(24, response.html.count('<div class="measure">'))
            self.assertIn('href="exercise-library-0958?v=0958"', response.html)
        finally:
            for name, old in previous.items():
                if old is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = old

    def test_frontend_prefers_and_does_not_intercept_canonical_button(self):
        profile = (self.project / "informa" / "web" / "profile_sections_0912.js").read_text()
        catalog = (self.project / "informa" / "web" / "exercise_catalog_0954.js").read_text()
        modern = (self.project / "informa" / "web" / "interface_061.js").read_text()
        legacy = (self.project / "informa" / "web" / "interface_063.js").read_text()
        self.assertIn("b.id==='exercisesStaticButton'", profile)
        self.assertIn("button?.id==='exercisesStaticButton'", catalog)
        self.assertIn("!document.getElementById('exercisesStaticButton')", modern)
        self.assertIn("if(document.getElementById('exercisesStaticButton'))return", legacy)

    def test_version_and_container_entrypoint(self):
        config = (self.project / "informa" / "config.yaml").read_text()
        docker = (self.project / "informa" / "Dockerfile").read_text()
        self.assertRegex(config, r'version: "0\.9\.(?:5[7-9]|[6-9][0-9])"')
        self.assertIn("COPY exercise_menu_fix_0957.py /app/exercise_menu_fix_0957.py", docker)
        self.assertRegex(docker, r'exercise_menu_fix_095[789]:app')


if __name__ == "__main__":
    unittest.main()
