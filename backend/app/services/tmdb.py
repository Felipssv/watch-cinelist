import httpx
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY  = os.getenv("TMDB_API_KEY")
BASE_URL = os.getenv("TMDB_BASE_URL")
HEADERS  = {"Authorization": f"Bearer {API_KEY}"}


async def search_movies(query: str, page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/search/movie",
            headers=HEADERS,
            params={"query": query, "page": page, "language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()


async def get_movie_details(tmdb_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/{tmdb_id}",
            headers=HEADERS,
            params={"language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()