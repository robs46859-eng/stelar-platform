from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_url: str = ""
    fullstack_internal_api_key: str = ""
    product: str = "arkham-governance"

    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()
