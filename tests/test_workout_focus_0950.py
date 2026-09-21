import unittest
from pathlib import Path


class WorkoutFocus0950Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_only_current_exercise_is_visible(self):
        source = (self.project / "informa" / "web" / "workout_focus_0950.js").read_text()
        for marker in (
            "shared_active=1",
            "if950-hidden",
            "if950-current",
            "setSharedActive(id)",
        ):
            self.assertIn(marker, source)

    def test_timer_returns_to_next_set_automatically(self):
        source = (self.project / "informa" / "web" / "workout_focus_0950.js").read_text()
        for marker in (
            "recovery_last5_audio=1",
            "window.startTimer=beginTimer",
            "setTimeout(returnToExercise,450)",
            "Serie successiva pronta",
            "if950SkipRecovery",
            "if950PauseRecovery",
            "if950AddRecovery",
        ):
            self.assertIn(marker, source)

    def test_landscape_tv_uses_focused_exercise(self):
        source = (self.project / "informa" / "web" / "workout_tv_0945.js").read_text()
        self.assertIn("dataset.if950ExerciseIndex", source)
        self.assertIn("if949-archived", source)

    def test_backend_reports_combined_scope(self):
        source = (self.project / "informa" / "workout_focus_0950.py").read_text()
        self.assertIn("single_exercise=True", source)
        self.assertIn("timer_auto_advance=True", source)
        self.assertIn("archive_flow_preserved=True", source)


if __name__ == "__main__":
    unittest.main()
