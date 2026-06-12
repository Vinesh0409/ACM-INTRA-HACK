from pydantic_settings import BaseSettings
class settings(BaseSettings):
    APP_NAME: str = "Dependency Scanner"
    APP_VERSION: str = "0.1.0"

    class Config:
        env_file = ".env"

settings = settings()

class ProjectNotFoundException(Exception):
    pass


class PackageJsonNotFoundException(Exception):
    pass