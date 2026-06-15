import json 
import os
import requests
from packaging import version
from app.utils import SemverUtils
from app.models import ScanRequest

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
    def scan(request: ScanRequest):

        print("SCAN STARTED")
        print("Type:", request.type)
        print("Path:", request.path)

        dependencies = {}
        dev_dependencies = {}
        if request.type == "node" and isinstance(request.content, dict):
            dependencies = request.content.get("dependencies") or {}
            dev_dependencies = request.content.get("devDependencies") or {}

        def process_dependencies(dep_dict):
            report = []
            for package, current in dep_dict.items():
                print("PACKAGE:", package)
                print("CURRENT:", current)

                latest = NpmService.get_latest_version(
                    package
                )

                repo_url = latest.get("repo_url")
                latest = latest.get("latest")

                print("LATEST:", latest)

                status = VersionService.get_status(
                    current,
                    latest
                )

                entry = {
                    "package": package,
                    "current": current,
                    "latest": latest,
                    "status": status,
                }
                if status == "outdated":
                    entry["repo_url"] = repo_url
                report.append(entry)
            return report

        dep_report = process_dependencies(dependencies)
        dev_report = process_dependencies(dev_dependencies)

        return {
            "path": request.path,
            "dependencies": dep_report,
            "devDependencies": dev_report
        }

           
    
class NpmService:

    @staticmethod
    def get_latest_version(
        package_name: str
    ) -> dict:

        url = (
            f"https://registry.npmjs.org/"
            f"{package_name}"
        )

        response = requests.get(url)
            
        if response.status_code != 200:
            return {"latest": None, "repo_url": None}

        data = response.json()

        latest = data.get("dist-tags", {}).get("latest")

        # Extract raw repository URL from the registry metadata
        repo_url = None
        repository = data.get("repository")
        if isinstance(repository, dict):
            repo_url = repository.get("url")
        elif isinstance(repository, str):
            repo_url = repository

        return {
            "latest": latest,
            "repo_url": repo_url
        }
    
class VersionService:

    @staticmethod
    def get_status(
        current: str,
        latest: str
    ):
        if not current or not latest:
            return "unknown"
        
        current_clean = current.lstrip("^~>=< ")
        latest_clean = latest.lstrip("^~>=< ")

        current_clean = current_clean.replace("x", "0").replace("*", "0")
        latest_clean = latest_clean.replace("x", "0").replace("*", "0")

        try:
            if version.parse(current_clean) < version.parse(latest_clean):
                return "outdated"
        except Exception:
            return "unknown"

        return "latest"
    
