from container_contract import assert_container
import importlib.util
import subprocess
import sys
import types
import unittest
from pathlib import Path


class ExerciseMenuFix0959Test(unittest.TestCase):
    def setUp(self):
        self.project = Path(__file__).parents[1]

    def test_router_is_loaded_before_the_application_script(self):
        index = (self.project / "informa" / "web" / "index.html").read_text()
        capture = index.index("document.addEventListener('click'")
        application = index.index('<script src="app.js?v=0960"></script>')
        self.assertLess(capture, application)
        self.assertIn("event.stopImmediatePropagation()", index)
        self.assertIn("label!=='Esercizi'", index)
        self.assertIn("exercise-library-0958?v=0960", index)
        self.assertIn("window.location.pathname.replace", index)

    def test_router_captures_any_exercise_control_before_old_handlers(self):
        index = (self.project / "informa" / "web" / "index.html").read_text()
        script = index.split("<script>", 1)[1].split("</script>", 1)[0]
        node = f"""
          const vm=require('vm');
          let handler=null,assigned=null,prevented=false,stopped=false;
          global.document={{addEventListener:(name,fn,capture)=>{{
            if(name!=='click'||capture!==true)process.exit(1);handler=fn;
          }}}};
          global.window={{location:{{pathname:'/api/hassio_ingress/token',assign:url=>assigned=url}}}};
          vm.runInThisContext({script!r});
          const control={{textContent:'🏋️ Esercizi'}};
          handler({{target:{{closest:()=>control}},preventDefault:()=>prevented=true,stopImmediatePropagation:()=>stopped=true}});
          if(!prevented||!stopped)process.exit(2);
          if(assigned!=='/api/hassio_ingress/token/exercise-library-0958?v=0960')process.exit(3);
        """
        subprocess.run(["node", "-e", node], check=True)

    def test_version_and_container_chain(self):
        class DummyApp:
            def get(self, _path):
                return lambda function: function

        root = types.SimpleNamespace(VERSION="0.9.58", jsonify=lambda **data: data)
        modules = {
            "app": root,
            "exercise_menu_fix_0958": types.SimpleNamespace(app=DummyApp()),
        }
        previous = {name: sys.modules.get(name) for name in modules}
        sys.modules.update(modules)
        try:
            path = self.project / "informa" / "exercise_menu_fix_0959.py"
            spec = importlib.util.spec_from_file_location("exercise_menu_fix_0959_test", path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.assertEqual("0.9.59", root.VERSION)
        finally:
            for name, old in previous.items():
                if old is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = old

        assert_container(self, "exercise_menu_fix_0959", "0.9.59")


if __name__ == "__main__":
    unittest.main()
