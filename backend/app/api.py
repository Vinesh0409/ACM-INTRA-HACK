from fastapi import APIRouter
from app.models import ScanRequest
from app.services import ScannerService
router = APIRouter()
@router.post("/scan")
async def scan_project(request: ScanRequest):

    print("REQUEST RECEIVED")
    print(request)

    return ScannerService.scan(
        request.project_path
    )