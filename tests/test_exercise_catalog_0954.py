from container_contract import assert_container
import importlib.util
import json
import subprocess
import sys
import types
import unittest
from pathlib import Path


REMOVED = {
    "seated_row", "row_one_arm", "upright_row", "front_raise_cable",
    "curl_hammer", "curl_one_arm", "reverse_curl", "cable_squat",
    "standing_leg_curl", "cable_rdl", "glute_kickback", "cable_calf_raise",
}


class ExerciseCatalog0954Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_backend_removes_ids_but_keeps_curl(self):
        class DummyApp:
            def __init__(self):
                self.view_functions = {"guide_library_info_0914": lambda: None}

            def get(self, _path):
                return lambda function: function

        allowed = set(REMOVED) | {"curl", "lat"}
        guide_ids = set(allowed)
        exercise_ids = set(allowed)
        modules = {
            "app": types.SimpleNamespace(VERSION="0.9.53", jsonify=lambda **data: data),
            "exercise_guides_0953": types.SimpleNamespace(app=DummyApp()),
            "guide_patch": types.SimpleNamespace(ALLOWED_GUIDES=allowed),
            "guide_manager_0914": types.SimpleNamespace(GUIDE_IDS_36=guide_ids),
            "exercise_toggle_0915": types.SimpleNamespace(EXERCISE_IDS=exercise_ids),
        }
        previous = {name: sys.modules.get(name) for name in modules}
        sys.modules.update(modules)
        try:
            path = self.project / "informa" / "exercise_catalog_0954.py"
            spec = importlib.util.spec_from_file_location("exercise_catalog_0954_test", path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.assertEqual("0.9.54", modules["app"].VERSION)
            self.assertTrue(REMOVED.isdisjoint(allowed))
            self.assertTrue(REMOVED.isdisjoint(guide_ids))
            self.assertTrue(REMOVED.isdisjoint(exercise_ids))
            self.assertIn("curl", allowed)
            self.assertIn("curl", exercise_ids)
        finally:
            for name, old in previous.items():
                if old is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = old

    def test_frontend_catalog_cleanup_and_preacher_description(self):
        source = self.project / "informa" / "web" / "exercise_catalog_0954.js"
        node = f"""
          const fs=require('fs'),vm=require('vm');
          const removed={json.dumps(sorted(REMOVED))};
          global.IF51_LIBRARY={{curl:{{name:'old'}},lat:{{name:'Lat'}},...Object.fromEntries(removed.map(id=>[id,{{name:id}}]))}};
          global.IF50_EX={{...IF51_LIBRARY}};
          global.IF51_PLANS={{B:{{ids:['lat','seated_row','curl']}}}};
          global.IF60_ALTERNATIVES={{lat:['seated_row','curl'],seated_row:['lat']}};
          global.IF60_GROUPS={{pull:['lat','seated_row','curl']}};
          global.IF50={{plan:[{{id:'seated_row'}},{{id:'curl'}}]}};
          global.document={{querySelector:()=>null,getElementById:()=>null,addEventListener:()=>{{}}}};
          global.setTimeout=()=>{{}};
          global.setInterval=()=>{{}};
          global.console={{log:()=>{{}}}};
          vm.runInThisContext(fs.readFileSync({json.dumps(str(source))},'utf8'));
          if(removed.some(id=>IF51_LIBRARY[id]||IF50_EX[id]))process.exit(1);
          if(!IF51_LIBRARY.curl.name.includes('appoggio inclinato'))process.exit(2);
          if(IF51_LIBRARY.curl.guide!==null)process.exit(5);
          if(IF51_PLANS.B.ids.includes('seated_row'))process.exit(3);
          if(IF50.plan.length!==1||IF50.plan[0].id!=='curl')process.exit(4);
        """
        subprocess.run(["node", "-e", node], check=True)

    def test_version_and_container_chain(self):
        assert_container(self, "exercise_catalog_0954", "0.9.54")


if __name__ == "__main__":
    unittest.main()
