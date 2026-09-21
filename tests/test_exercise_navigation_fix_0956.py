from container_contract import assert_container
import json
import subprocess
import unittest
from pathlib import Path


class ExerciseNavigationFix0956Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_profile_exercise_tap_uses_capture_and_direct_navigation(self):
        source = (self.project / "informa" / "web" / "exercise_catalog_0954.js").read_text()
        self.assertIn("function openExerciseLibrary()", source)
        self.assertIn("button?.closest('[data-page=\"profile\"]')&&label==='Esercizi'", source)
        self.assertIn("event.stopImmediatePropagation()", source)
        self.assertIn("page.classList.add('active')", source)
        self.assertIn("},true);", source)
        self.assertIn("direct_library_navigation=1", source)

    def test_catalog_and_dual_page_render_remain_active(self):
        source = (self.project / "informa" / "web" / "exercise_catalog_0954.js").read_text()
        self.assertIn("REMOVED_LOW_CABLE_IDS", source)
        self.assertIn("['exercises','exercise-library-063']", source)
        self.assertIn("KEPT_ID='curl'", source)

    def test_runtime_tap_activates_library_page(self):
        source = self.project / "informa" / "web" / "exercise_catalog_0954.js"
        node = f"""
          const fs=require('fs'),vm=require('vm');let clickHandler=null;
          const classes=()=>{{const s=new Set();return {{add:x=>s.add(x),remove:x=>s.delete(x),has:x=>s.has(x)}}}};
          const pages={{exercises:{{innerHTML:'',classList:classes()}},'exercise-library-063':{{innerHTML:'',classList:classes()}}}};
          const exerciseButton={{textContent:'🏋️ Esercizi',closest:s=>s==='[data-page="profile"]'?{{}}:null}};
          global.IF51_LIBRARY={{lat:{{name:'Lat machine',group:'Schiena'}},curl:{{name:'Curl',group:'Bicipiti'}}}};
          global.IF50_EX={{...IF51_LIBRARY}};global.IF51_PLANS={{A:{{ids:['lat','curl']}}}};
          global.IF60_ALTERNATIVES={{}};global.IF60_GROUPS={{}};global.IF50={{plan:[]}};
          global.document={{
            querySelector:s=>s==='[data-page="exercises"]'?pages.exercises:(s==='[data-page="exercise-library-063"]'?pages['exercise-library-063']:null),
            querySelectorAll:s=>s==='.page'?Object.values(pages):[],
            getElementById:id=>id==='if63ExercisesButton'?exerciseButton:null,
            addEventListener:(name,fn)=>{{if(name==='click')clickHandler=fn}}
          }};
          global.window={{scrollTo:()=>{{}}}};global.history={{replaceState:()=>{{}}}};
          global.setTimeout=()=>{{}};global.setInterval=()=>{{}};global.console={{log:()=>{{}},error:()=>{{}}}};
          vm.runInThisContext(fs.readFileSync({json.dumps(str(source))},'utf8'));
          const event={{target:{{closest:s=>s==='button'?exerciseButton:null}},preventDefault:()=>{{}},stopImmediatePropagation:()=>{{}}}};
          clickHandler(event);
          if(!pages['exercise-library-063'].classList.has('active'))process.exit(1);
          if(!pages['exercise-library-063'].innerHTML.includes('Lat machine'))process.exit(2);
        """
        subprocess.run(["node", "-e", node], check=True)

    def test_version_and_container_chain(self):
        assert_container(self, "exercise_navigation_fix_0956", "0.9.56")


if __name__ == "__main__":
    unittest.main()
