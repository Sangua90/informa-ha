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

    def test_height_measurement_updates_profile_and_keeps_dated_history(self):
        import importlib.util
        from unittest.mock import patch
        path = Path(__file__).parents[1] / 'informa/measurements_0978.py'
        spec = importlib.util.spec_from_file_location('measurement_height_test', path)
        module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'app': self.module, 'treadmill_progression_0970': types.SimpleNamespace(app=self.module.app)}):
            spec.loader.exec_module(module)
            response = self.client.post('/api/measurements-0978', json={'height_cm': 190})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()['items'][0]['height_cm'], 190)
            self.client.post('/api/measurements-0978', json={'weight_kg': 80})
            data = self.client.get('/api/measurements-0978').get_json()
            self.assertEqual(data['height_cm'], 190)
            self.assertEqual(data['items'][1]['height_cm'], 190)
            self.assertIsNone(data['items'][0]['height_cm'])

    def test_canonical_guide_alias_preserves_custom_images(self):
        import ast
        source = (Path(__file__).parents[1] / 'informa/guide_patch.py').read_text(encoding='utf-8')
        node = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == '_user_guide_path')
        folder = Path(self.temp.name)
        namespace = {'USER_GUIDE_DIR': folder}
        exec(compile(ast.Module(body=[node], type_ignores=[]), 'guide_patch.py', 'exec'), namespace)
        old = folder / 'shoulder_press.webp'
        old.write_bytes(b'approved legacy image')
        self.assertEqual(namespace['_user_guide_path']('dumbbell_shoulder_press'), old)
        custom = folder / 'dumbbell_shoulder_press.png'
        custom.write_bytes(b'custom image')
        self.assertEqual(namespace['_user_guide_path']('dumbbell_shoulder_press'), custom)
