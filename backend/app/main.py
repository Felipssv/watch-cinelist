from fastapi import FastAPI
from app.database import engine
from app import models
from app.routers import movies


app = FastAPI()

app.include_router(movies.router)

@app.get("/")
def root():
    return {"status": "banco conectado"}