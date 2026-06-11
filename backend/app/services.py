import json 
import os
import requests
from packaging import version
from app.utils import SemverUtils

class DependencyService:

    @staticmethod
    def get_dependencies(project_path: str):

        package_json = os.path.join(
            project_path,
            "package.json"
        )

        print("PACKAGE PATH:", package_json)
        print("EXISTS:", os.path.exists(package_json))

        with open(
            package_json,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        print("DATA:", data)

        return data.get(
            "dependencies",
            {}
        )

class ScannerService:

    @staticmethod
    def scan(project_path: str):

        print("SCAN STARTED")

        dependencies = (
            DependencyService.get_dependencies(
                project_path
            )
        )

        print("DEPENDENCIES:", dependencies)

        report = []

        for package, current in dependencies.items():

            print("PACKAGE:", package)
            print("CURRENT:", current)

            latest = NpmService.get_latest_version(
                package
            )

            print("LATEST:", latest)

            status = VersionService.get_status(
                current,
                latest
            )

            risk = (
                SemverUtils
                .get_risk(
                    current,
                    latest
                )
            )

            report.append({
                "package": package,
                "current": current,
                "latest": latest,
                "status": status
            })

        return {
            "dependencies": report
        }

           
    
class NpmService:
    @staticmethod
    def get_latest_version(
        package_name: str
    ):
        url = (
            f"https://registry.npmjs.org/"
            f"{package_name}"
        )

        response = requests.get(url)
            
        if response.status_code != 200:
            return None
        data = response.json()
        return data["dist-tags"]["latest"]
    
class VersionService:

    @staticmethod
    def get_status(
        current: str,
        latest: str
    ):

        current = current.replace("^", "")
        current = current.replace("~", "")

        if version.parse(current) < version.parse(latest):
            return "outdated"

        return "latest"
    
