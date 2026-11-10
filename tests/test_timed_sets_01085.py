"""Exercise the real Flask set endpoint and an existing database migration."""
from contextlib import closing
import sqlite3
import sys
import tempfile
import types
import unittest
from pathlib import Path


class TimedSetsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        folder = Path(self.temp.name)
        self.database = folder / 'old.db'
        with closing(sqlite3.connect(self.database)) as con:
            con.execute('CREATE TABLE sets(id INTEGER PRIMARY KEY,workout_id INTEGER,exercise TEXT,set_no INTEGER,weight REAL,reps INTEGER,fatigue TEXT,rest_sec INTEGER)')
            con.execute("INSERT INTO sets VALUES(1,1,'Chest',1,5,10,'Giusta',90)")
            con.commit()
        source = (Path(__file__).parents[1] / 'informa/app.py').read_text(encoding='utf-8')
        source = source.replace('DB = Path("/data/informa.db")', f'DB = Path({str(self.database)!r})')
        source = source.replace('PHOTO_DIR = Path("/data/meal_photos")', f'PHOTO_DIR = Path({str(folder / "photos")!r})')
        self.module = types.ModuleType('timed_sets_test_app')
        self.module.__file__ = str(Path(__file__).resolve())
        sys.modules[self.module.__name__] = self.module
        exec(compile(source, 'app.py', 'exec'), self.module.__dict__)
        self.client = self.module.app.test_client()

    def tearDown(self):
        sys.modules.pop(self.module.__name__, None)
        self.temp.cleanup()

    def test_migration_preserves_existing_sets_and_is_repeatable(self):
        self.module.init_db()
        with closing(sqlite3.connect(self.database)) as con:
            self.assertEqual(con.execute('SELECT exercise,reps,rep_type FROM sets').fetchone(), ('Chest', 10, 'reps'))

    def test_seconds_and_repetitions_are_saved_with_their_unit(self):
        for name, value, unit in [('Plank', 30, 'seconds'), ('Curl', 10, 'reps')]:
            response = self.client.post('/api/set', json={'exercise': name, 'set_no': 1, 'reps': value, 'rep_type': unit})
            self.assertEqual(response.status_code, 200)
            with closing(sqlite3.connect(self.database)) as con:
                self.assertEqual(con.execute('SELECT reps,rep_type FROM sets WHERE exercise=?', (name,)).fetchone(), (value, unit))
