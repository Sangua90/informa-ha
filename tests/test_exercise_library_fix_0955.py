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
        self.assertIn("const page=ensurePage('exercise-library-063')", source)
        self.assertIn("page.classList.add('active')", source)
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
        self.assertRegex(config, r'version: "0\.9\.(?:5[5-9]|[6-9][0-9])"')
        self.assertIn("COPY exercise_library_fix_0955.py /app/exercise_library_fix_0955.py", docker)
        self.assertRegex(docker, r'exercise_(?:library_fix_0955|navigation_fix_0956|menu_fix_0957|menu_fix_0958|menu_fix_0959|menu_fix_0960):app')


if __name__ == "__main__":
    unittest.main()
