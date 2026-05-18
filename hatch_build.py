import os
import shutil
import subprocess
import sys

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if self.target_name not in ["wheel", "sdist"]:
            return

        source_dir = os.path.join(self.root, "assets", "dist")
        dest_dir = os.path.join(self.root, "sacro", "static", "sacro")

        # Skip npm build if assets already exist (e.g. during editable/dev install)
        if os.path.exists(source_dir) and os.listdir(source_dir):
            print(
                "Frontend assets already built, skipping npm build...",
                file=sys.stderr,
            )
        else:
            print("Building frontend assets...", file=sys.stderr)

            if not shutil.which("npm"):
                print(
                    "Error: 'npm' is not installed or not in PATH.",
                    file=sys.stderr,
                )
                sys.exit(1)

            print("Installing npm dependencies...", file=sys.stderr)
            subprocess.check_call("npm install", shell=True)

            print("Compiling assets with npm...", file=sys.stderr)
            subprocess.check_call("npm run build", shell=True)

        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)

        print(
            f"Copying assets from {source_dir} to {dest_dir}...",
            file=sys.stderr,
        )
        shutil.copytree(source_dir, dest_dir, dirs_exist_ok=True)
