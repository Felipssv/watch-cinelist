import httpx
import os

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


async def get_popular_movies(page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/popular",
            headers=HEADERS,
            params={"page": page, "language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()
    
async def get_top_rated_movies(page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/top_rated",
            headers=HEADERS,
            params={"page": page, "language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()


async def get_upcoming_movies(page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/upcoming",
            headers=HEADERS,
            params={"page": page, "language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()

async def get_now_playing_movies(page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/movie/now_playing",
            headers=HEADERS,
            params={"page": page, "language": "pt-BR"}
        )
        response.raise_for_status()
        return response.json()