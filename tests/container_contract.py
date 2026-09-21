"""Check feature inclusion through the current container's transitive import chain."""
import ast
import re
from pathlib import Path

def assert_container(test, module, minimum):
    root = Path(__file__).parents[1] / 'informa'
    docker = (root / 'Dockerfile').read_text(encoding='utf-8')
    config = (root / 'config.yaml').read_text(encoding='utf-8')
    version = re.search(r'version: "([\d.]+)"', config).group(1)
    test.assertGreaterEqual(tuple(map(int, version.split('.'))), tuple(map(int, minimum.split('.'))))
    test.assertIn('COPY *.py /app/', docker)
    entry = re.search(r'"([\w]+):app"', docker).group(1)
    seen = set()
    def visit(name):
        if name in seen or not (root / (name + '.py')).exists():
            return
        seen.add(name)
        tree = ast.parse((root / (name + '.py')).read_text(encoding='utf-8'))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    visit(alias.name)
            elif isinstance(node, ast.ImportFrom) and node.module:
                visit(node.module)
    visit(entry)
    test.assertIn(module, seen, f'{module} is not reachable from {entry}')
    if (root / 'web' / (module + '.js')).exists():
        bundled = re.search(r'RUN for f in (.*?); do cat', docker).group(1).split()
        test.assertIn(module + '.js', bundled)
