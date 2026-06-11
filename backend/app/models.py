from pydantic import BaseModel

class ScanRequest(BaseModel):
    project_path: str