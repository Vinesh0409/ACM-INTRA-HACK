from pydantic import BaseModel
from typing import Dict, Any

class ScanRequest(BaseModel):
    type: str
    path: str
    content: Dict[str, Any]