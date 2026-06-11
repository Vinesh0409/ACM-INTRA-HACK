from pydantic_settings import BaseSettings
class settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str

    class Config:
        env_file = ".env"

settings = settings()

class ProjectNotFoundException(Exception):
    pass


class PackageJsonNotFoundException(Exception):
    pass