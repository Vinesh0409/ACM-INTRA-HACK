class SemverUtils:
    @staticmethod
    def get_risk(current: str, latest: str):
        
        current = current.lstrip("^~")
        latest = latest.lstrip("^~")

        current_parts = current.split(".")
        latest_parts = latest.split(".")

        while len(current_parts) < 3:
            current_parts.append("0")

        while len(latest_parts) < 3:
            latest_parts.append("0")

        current_major = int(current_parts[0])
        latest_major = int(latest_parts[0])

        current_minor = int(current_parts[1])
        latest_minor = int(latest_parts[1])

        current_patch = int(current_parts[2])
        latest_patch = int(latest_parts[2])
        
        if current_major != latest_major:
            return "HIGH"

        if current_minor != latest_minor:
            return "MEDIUM"

        if current_patch != latest_patch:
            return "LOW"

        return "NONE"