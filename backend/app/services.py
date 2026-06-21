import json 
import os
import requests
import subprocess
from packaging import version
from app.utils import SemverUtils
from app.models import ScanRequest
import subprocess

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

        content = request.content



        dependencies = {}
        dev_dependencies = {}
        if request.type == "node" and isinstance(content, dict):
            dependencies = content.get("dependencies") or {}
            dev_dependencies = content.get("devDependencies") or {}


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

                security_info = (
                    SecurityService.check_vulnerability(package,current)
                )

                risk = SemverUtils.get_risk(
                    current,
                    latest
                )
                recommendation = (
                    RecommendationService
                    .get_recommendation(
                        status,
                        risk,
                        security_info["vulnerable"]
                    )
                )
                priority = (
                    PriorityService
                    .calculate_priority(
                        risk,
                        security_info["vulnerable"]
                    )
                )
                

                
                entry = {
                    "package": package,
                    "current": current,
                    "latest": latest,
                    "status": status,
                    "risk": risk,
                    "vulnerable": security_info[
                        "vulnerable"],
                        "vulnerability_count":
                        security_info.get(
                            "count",
                            0
                        ),
                        "vulnerability_id":
                        security_info.get(
                            "id"
                        ),
                        "severity": security_info.get(
                                "severity",
                                "NONE" ),
                        "summary":
                        security_info.get(
                            "summary"
                        ),
                        "recommendation":
                            recommendation,
                        "priority": priority,
                        
                }
                if status == "outdated":
                    entry["repo_url"] = repo_url
                report.append(entry)
            return report
        
        dependency_tree = (
            DependencyTreeService
            .get_tree(
                request.path
            )
        )

        dependency_graph = (
            DependencyGraphService
            .build_real_graph(
                dependency_tree
            )
        )

        graph_stats = (
            GraphAnalyticsService
            .get_stats(
                dependency_graph
            )
        )

        dep_report = process_dependencies(dependencies)
        dev_report = process_dependencies(dev_dependencies)
        combined_report = (
            dep_report +
            dev_report
        )

        health_score = (
            HealthScoreService
            .calculate(
                combined_report
            )
        )

        

        return {
            "path": request.path,

            "summary": {
                "total_packages":
                    len(combined_report),

            "outdated":
                health_score["outdated"],

            "vulnerable":
                health_score["vulnerable"],

            "high_risk":
                health_score["high_risk"]
        },

            "health_score": {
                "score":
                    health_score["score"],

            "status":
                health_score["status"]
        },
            "dependency_graph":
                dependency_graph,

            "graph_stats":
                graph_stats,

            "dependencies":
                dep_report,

            "devDependencies":
                dev_report
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
    
class SecurityService:
    @staticmethod
    def check_vulnerability(
        package_name: str,
        package_version: str
    ):
        url = "https://api.osv.dev/v1/query"
        payload = {
            "package":{
                "name": package_name,
                "ecosystem": "npm"
            },
            "version": package_version
        }

        try:

            response = requests.post(
                url,
                json=payload,
                timeout=10
            )
            if response.status_code != 200:
                return{
                    "vulnerable": False
                }
            data = response.json()
            vulns = data.get(
                "vulns",
                []
            )
            if len(vulns) == 0:
                return {
                    "vulnerable": False,
                    "severity": "NONE"
                }
            severity = "LOW"
            aliases = vulns[0].get(
                "aliases",
                []
            )
            if len(aliases) > 0:
                severity = "HIGH"
            return {
                "vulnerable": True,
                "severity": severity,
                "count": len(vulns),
                "id": vulns[0].get("id"),
                "summary": vulns[0].get("summary")
            }
        
        except Exception as e:

            print(
                "OSV Error:",
                str(e)
            )

            return {
                "vulnerable": False,
                "severity": "UNKNOWN"
            }
        
class HealthScoreService:

    @staticmethod
    def calculate(report):

        score = 100

        outdated = 0
        vulnerable = 0
        high_risk = 0

        for dependency in report:

            if dependency["status"] == "outdated":
                score -= 2
                outdated += 1

            if dependency.get("risk") == "HIGH":
                score -= 10
                high_risk += 1

            if dependency.get("vulnerable"):
                score -= 20
                vulnerable += 1

        score = max(score, 0)

        if score >= 90:
            status = "Excellent"

        elif score >= 70:
            status = "Good"

        elif score >= 50:
            status = "Needs Attention"

        else:
            status = "Critical"

        return {
            "score": score,
            "status": status,
            "outdated": outdated,
            "vulnerable": vulnerable,
            "high_risk": high_risk
        }

class RecommendationService:

    @staticmethod
    def get_recommendation(
        status: str,
        risk: str,
        vulnerable: bool
    ):

        if vulnerable:
            return "UPDATE IMMEDIATELY"

        if risk == "HIGH":
            return "REVIEW BEFORE UPDATE"

        if status == "outdated":
            return "UPDATE WHEN POSSIBLE"

        return "NO ACTION REQUIRED"
    
class PriorityService:

    @staticmethod
    def calculate_priority(
        risk,
        vulnerable
    ):

        score = 0

        if vulnerable:
            score += 100

        if risk == "HIGH":
            score += 50

        elif risk == "MEDIUM":
            score += 25

        elif risk == "LOW":
            score += 10

        return score
    
class DependencyGraphService:

    @staticmethod
    def build_real_graph(tree):

        graph = {}

        dependencies = (
            tree.get(
                "dependencies",
                {}
            )
        )

        for package, info in (
            dependencies.items()
        ):

            children = list(
                info.get(
                    "dependencies",
                    {}
                ).keys()
            )

            graph[package] = {

                "version":
                    info.get(
                        "version"
                    ),

                "children":
                    children
            }

        return graph
    
class GraphAnalyticsService:

    @staticmethod
    def get_stats(graph):

        nodes = len(graph)

        edges = sum(
            len(
                data["children"]
            )
            for data in graph.values()
        )

        return {
            "nodes": nodes,
            "edges": edges
        }
    
class DependencyTreeService:

    @staticmethod
    def get_tree(project_path: str):

        try:

            result = subprocess.run(
                [
                    "npm.cmd",   # Windows
                    "ls",
                    "--json",
                    "--all"
                ],
                cwd=project_path,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print("NPM ERROR:")
                print(result.stderr)
                return {}

            return json.loads(
                result.stdout
            )

        except Exception as e:

            print(
                "Dependency Tree Error:",
                str(e)
            )

            return {}
            