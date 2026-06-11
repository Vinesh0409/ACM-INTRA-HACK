class SemverUtils:
    @staticmethod
    def get_risk(current: str, latest: str):

        if latest is None:
            return "UNKNOWN"

        current_major = current.split(".")[0]
        latest_major = latest.split(".")[0]

        if current_major != latest_major:
            return "HIGH"

        return "LOW"