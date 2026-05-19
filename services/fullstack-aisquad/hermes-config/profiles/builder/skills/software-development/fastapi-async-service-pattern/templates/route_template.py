"""FastAPI async route template — following the fscompanion service-layer pattern."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.database import async_session
from src.services.thing_service import ThingService
from src.schemas.thing import ThingCreate, ThingResponse

router = APIRouter()


async def get_db():
    """Async session dependency — use in every route module."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_thing(
    payload: ThingCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ThingService()
    result = await service.create(db, **payload.model_dump())
    return {"id": result["id"], "status": "created"}


@router.get("/", response_model=List[dict])
async def list_things(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    service = ThingService()
    return await service.list_active(db, skip=skip, limit=limit)


@router.get("/{thing_id}")
async def get_thing(
    thing_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ThingService()
    result = await service.get_by_id(db, thing_id)
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result


@router.post("/{thing_id}/action")
async def thing_action(
    thing_id: int,
    action: str,
    db: AsyncSession = Depends(get_db),
):
    service = ThingService()
    result = await service.perform_action(db, thing_id, action)
    if not result:
        raise HTTPException(status_code=400, detail="Action failed")
    return {"status": "done", "thing_id": thing_id}