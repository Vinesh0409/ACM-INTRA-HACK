from fastapi import FastAPI

from app.api import router as scan_router
from app.core import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

app.include_router(
    scan_router,
    prefix="/api",
    tags=["Scanner"]
)