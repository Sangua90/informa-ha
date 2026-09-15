import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path


class ExerciseGuide0952Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_bundled_goblet_image_is_valid_webp(self):
        image = self.project / "informa" / "web" / "guides_default" / "goblet_squat.webp"
        data = image.read_bytes()
        self.assertGreater(len(data), 50_000)
        self.assertEqual(data[:4], b"RIFF")
        self.assertEqual(data[8:12], b"WEBP")

    def test_installer_copies_default_and_preserves_custom_image(self):
        class DummyApp:
            def get(self, _path):
                return lambda function: function

        with tempfile.TemporaryDirectory() as tmp:
            guide_dir = Path(tmp)

            def user_guide_path(name):
                return next((p for p in guide_dir.glob(f"{name}.*") if p.is_file()), None)

            modules = {
                "app": types.SimpleNamespace(jsonify=lambda **data: data),
                "profile_weight_0951": types.SimpleNamespace(app=DummyApp()),
                "guide_patch": types.SimpleNamespace(
                    USER_GUIDE_DIR=guide_dir,
                    _user_guide_path=user_guide_path,
                ),
            }
            previous = {name: sys.modules.get(name) for name in modules}
            sys.modules.update(modules)
            try:
                path = self.project / "informa" / "exercise_guide_0952.py"
                spec = importlib.util.spec_from_file_location("exercise_guide_0952_test", path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                installed = guide_dir / "goblet_squat.webp"
                self.assertTrue(installed.exists())
                self.assertEqual(installed.read_bytes()[:4], b"RIFF")

                installed.write_bytes(b"custom-guide")
                result = module.install_goblet_guide()
                self.assertFalse(result["created"])
                self.assertEqual(installed.read_bytes(), b"custom-guide")
            finally:
                for name, old in previous.items():
                    if old is None:
                        sys.modules.pop(name, None)
                    else:
                        sys.modules[name] = old

    def test_workout_guide_button_opens_photo(self):
        source = (self.project / "informa" / "web" / "exercise_guide_0952.js").read_text()
        self.assertIn("id===GUIDE_ID", source)
        self.assertIn("window.if74OpenImage(id)", source)
        self.assertIn("workout_button=1", source)

    def test_goblet_guide_remains_in_container_chain(self):
        docker = (self.project / "informa" / "Dockerfile").read_text()
        self.assertIn("COPY exercise_guide_0952.py /app/exercise_guide_0952.py", docker)
        self.assertIn("exercise_guide_0952.js >> /app/web/app.js", docker)


if __name__ == "__main__":
    unittest.main()
