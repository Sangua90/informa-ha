import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path


GUIDE_IDS = (
    "plank",
    "glute_bridge",
    "calf_raise",
    "shoulder_press",
    "lateral_raise",
    "romanian_deadlift",
)


class ExerciseGuides0953Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_all_approved_images_are_valid_webp(self):
        directory = self.project / "informa" / "web" / "guides_default"
        for guide_id in GUIDE_IDS:
            with self.subTest(guide=guide_id):
                data = (directory / f"{guide_id}.webp").read_bytes()
                self.assertGreater(len(data), 50_000)
                self.assertEqual(data[:4], b"RIFF")
                self.assertEqual(data[8:12], b"WEBP")

    def test_installer_copies_pack_and_preserves_custom_image(self):
        class DummyApp:
            def get(self, _path):
                return lambda function: function

        with tempfile.TemporaryDirectory() as tmp:
            guide_dir = Path(tmp)
            custom = guide_dir / "plank.png"
            custom.write_bytes(b"custom-plank")

            def user_guide_path(name):
                return next((p for p in guide_dir.glob(f"{name}.*") if p.is_file()), None)

            modules = {
                "app": types.SimpleNamespace(jsonify=lambda **data: data),
                "exercise_guide_0952": types.SimpleNamespace(app=DummyApp()),
                "guide_patch": types.SimpleNamespace(
                    USER_GUIDE_DIR=guide_dir,
                    _user_guide_path=user_guide_path,
                ),
            }
            previous = {name: sys.modules.get(name) for name in modules}
            sys.modules.update(modules)
            try:
                path = self.project / "informa" / "exercise_guides_0953.py"
                spec = importlib.util.spec_from_file_location("exercise_guides_0953_test", path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                self.assertEqual(custom.read_bytes(), b"custom-plank")
                self.assertTrue(all((guide_dir / f"{guide_id}.webp").exists() for guide_id in GUIDE_IDS[1:]))
                self.assertFalse(module._guide_status["plank"]["created"])
                self.assertTrue(module._guide_status["glute_bridge"]["created"])
            finally:
                for name, old in previous.items():
                    if old is None:
                        sys.modules.pop(name, None)
                    else:
                        sys.modules[name] = old

    def test_workout_buttons_open_all_pack_photos(self):
        source = (self.project / "informa" / "web" / "exercise_guides_0953.js").read_text()
        for guide_id in GUIDE_IDS:
            self.assertIn(f"'{guide_id}'", source)
        self.assertIn("GUIDE_IDS.has(id)", source)
        self.assertIn("window.if74OpenImage(id)", source)
        self.assertIn("workout_buttons=1", source)

    def test_version_and_container_chain(self):
        config = (self.project / "informa" / "config.yaml").read_text()
        docker = (self.project / "informa" / "Dockerfile").read_text()
        self.assertRegex(config, r'version: "0\.9\.(?:5[3-9]|[6-9][0-9])"')
        self.assertIn("COPY exercise_guides_0953.py /app/exercise_guides_0953.py", docker)
        self.assertRegex(docker, r'exercise_(?:guides_0953|catalog_0954|library_fix_0955|navigation_fix_0956|menu_fix_0957|menu_fix_0958):app')
        self.assertIn("exercise_guides_0953.js >> /app/web/app.js", docker)


if __name__ == "__main__":
    unittest.main()
