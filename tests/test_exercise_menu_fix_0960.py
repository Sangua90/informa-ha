import unittest
from pathlib import Path


class ExerciseMenuFix0960Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_response_is_imported_from_flask(self):
        source = (self.project / "informa" / "exercise_menu_fix_0958.py").read_text()
        self.assertIn("from flask import Response", source)
        self.assertIn("return Response(", source)
        self.assertNotIn("return root.Response(", source)

    def test_version_and_container_entrypoint(self):
        config = (self.project / "informa" / "config.yaml").read_text()
        docker = (self.project / "informa" / "Dockerfile").read_text()
        self.assertIn('version: "0.9.60"', config)
        self.assertIn("COPY exercise_menu_fix_0960.py /app/exercise_menu_fix_0960.py", docker)
        self.assertIn("exercise_menu_fix_0960:app", docker)


if __name__ == "__main__":
    unittest.main()
