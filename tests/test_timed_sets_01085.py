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

    def test_exclusions_persist_across_initialization_and_preserve_history(self):
        import importlib.util
        from unittest.mock import patch
        path = Path(__file__).parents[1] / 'informa/coach_library_0962.py'
        spec = importlib.util.spec_from_file_location('availability_catalog_test', path)
        catalog = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(catalog)
        with patch.dict(sys.modules, {'coach_library_0962': catalog}):
            for _ in range(2):
                self.assertEqual(self.client.put('/api/exercise-availability-01087/chest', json={'enabled': False}).status_code, 200)
            self.module.init_db()
            data = self.client.get('/api/exercise-availability-01087').get_json()
            self.assertEqual(data['disabled'], ['chest'])
            self.assertTrue(any(e['id'] == 'chest' for e in data['items']))
            with closing(sqlite3.connect(self.database)) as con:
                self.assertEqual(con.execute('SELECT weight,reps FROM sets').fetchone(), (5, 10))
            self.client.put('/api/exercise-availability-01087/chest', json={'enabled': True})
            self.assertEqual(self.client.get('/api/exercise-availability-01087').get_json()['disabled'], [])

    def test_exclusion_payload_requires_boolean(self):
        for payload in [{}, {'enabled': 'false'}, {'enabled': 0}]:
            self.assertEqual(self.client.put('/api/exercise-availability-01087/chest', json=payload).status_code, 400)
