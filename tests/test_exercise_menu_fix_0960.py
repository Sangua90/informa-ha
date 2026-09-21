from container_contract import assert_container
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
        assert_container(self, "exercise_menu_fix_0960", "0.9.60")


if __name__ == "__main__":
    unittest.main()
