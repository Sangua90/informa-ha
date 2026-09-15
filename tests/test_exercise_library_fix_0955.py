import json
import subprocess
import unittest
from pathlib import Path


class ExerciseLibraryFix0955Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_legacy_and_modern_pages_are_both_rendered(self):
        source = (self.project / "informa" / "web" / "exercise_catalog_0954.js").read_text()
        self.assertIn("['exercises','exercise-library-063']", source)
        self.assertIn("go('exercise-library-063')", source)
        self.assertNotIn("querySelector('[data-page=\"exercise-library-063\"]')?.remove()", source)
        self.assertIn("setInterval(routeExercisesButton,1200)", source)

    def test_catalog_filter_is_unchanged(self):
        source = (self.project / "informa" / "web" / "exercise_catalog_0954.js").read_text()
        self.assertIn("REMOVED_LOW_CABLE_IDS", source)
        self.assertIn("KEPT_ID='curl'", source)
        self.assertIn("appoggio inclinato", source)

    def test_runtime_populates_both_pages_with_filtered_catalog(self):
        source = self.project / "informa" / "web" / "exercise_catalog_0954.js"
        node = f"""
          const fs=require('fs'),vm=require('vm');
          const pages={{exercises:{{innerHTML:''}},'exercise-library-063':{{innerHTML:''}}}};
          const buttons={{if63ExercisesButton:{{}},if62ExercisesButton:{{}}}};
          global.IF51_LIBRARY={{
            lat:{{name:'Lat machine',group:'Schiena',equipment:'Fassi'}},
            curl:{{name:'Vecchio curl',group:'Bicipiti',equipment:'Fassi',guide:'curl'}},
            seated_row:{{name:'Rematore eliminato',group:'Schiena',equipment:'Fassi'}}
          }};
          global.IF50_EX={{...IF51_LIBRARY}};
          global.IF51_PLANS={{B:{{ids:['lat','seated_row','curl']}}}};
          global.IF60_ALTERNATIVES={{lat:['seated_row','curl']}};
          global.IF60_GROUPS={{pull:['lat','seated_row','curl']}};
          global.IF50={{plan:[]}};
          global.document={{
            querySelector:s=>s==='[data-page="exercises"]'?pages.exercises:(s==='[data-page="exercise-library-063"]'?pages['exercise-library-063']:null),
            getElementById:id=>buttons[id]||null,
            addEventListener:()=>{{}}
          }};
          global.setTimeout=()=>{{}};global.setInterval=()=>{{}};global.go=()=>{{}};
          global.console={{log:()=>{{}},error:()=>{{}}}};
          vm.runInThisContext(fs.readFileSync({json.dumps(str(source))},'utf8'));
          for(const page of Object.values(pages)){{
            if(!page.innerHTML.includes('Lat machine'))process.exit(1);
            if(!page.innerHTML.includes('appoggio inclinato'))process.exit(2);
            if(page.innerHTML.includes('Rematore eliminato'))process.exit(3);
          }}
          if(typeof buttons.if63ExercisesButton.onclick!=='function')process.exit(4);
        """
        subprocess.run(["node", "-e", node], check=True)

    def test_version_and_container_chain(self):
        config = (self.project / "informa" / "config.yaml").read_text()
        docker = (self.project / "informa" / "Dockerfile").read_text()
        self.assertIn('version: "0.9.55"', config)
        self.assertIn("COPY exercise_library_fix_0955.py /app/exercise_library_fix_0955.py", docker)
        self.assertIn("exercise_library_fix_0955:app", docker)


if __name__ == "__main__":
    unittest.main()
