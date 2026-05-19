---
name: FastAPI Async Service Pattern
description: Standard pattern for building async FastAPI routes with SQLAlchemy service layer in the fscompanion project.
tags: [fastapi, async, sqlalchemy, service-layer, api, pattern]
created: 2026-05-13
---

# FastAPI Async Service Pattern (fscompanion)

Every API route in fscompanion follows this consistent 4-layer pattern:

## Layer 1: Model (SQLAlchemy)

```python
# src/models/<domain>.py
class MyModel(Base):
    __tablename__ = "my_table"
    id = Column(UUID, primary_key=True, default=uuid4)
    # ... domain fields
    created_at = Column(DateTime, default=datetime.utcnow)
```

## Layer 2: Service (business logic)

```python
# src/services/<domain>.py
class MyService:
    async def create(self, session: AsyncSession, **kwargs) -> MyModel:
        entity = MyModel(**kwargs)
        session.add(entity)
        await session.commit()
        await session.refresh(entity)
        return entity

    async def get_active(self, session: AsyncSession, family_id: UUID) -> list[dict]:
        result = await session.execute(select(MyModel).where(...))
        return [row._asdict() for row in result]
```

## Layer 3: Pydantic Schemas (validation)

```python
# src/schemas/<domain>.py
class MyCreate(BaseModel):
    field: str
    class Config:
        from_attributes = True
```

## Layer 4: API Route

```python
# src/api/routes/<domain>.py
router = APIRouter()

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

@router.post("/", status_code=201)
async def create_thing(payload: MyCreate, db: AsyncSession = Depends(get_db)):
    service = MyService()
    result = await service.create(db, **payload.model_dump())
    return {"id": result.id, "status": "created"}
```

## Key Conventions

- **Async everywhere** — `async def` for all route handlers and service methods
- **Session lifecycle** — `get_db()` yields a session that auto-closes in `finally`
- **Service classes** — no route handler contains business logic; delegates to service
- **Dict responses** — routes return plain dicts, not ORM objects (avoids serialization issues)
- **UUID primary keys** — all models use UUID, set via `default=uuid4`
- **Status codes** — use FastAPI's `status_code` param on decorators, not manual `Response()`
- **Validation** — input validation is Pydantic's job, not the route's

## Files Built in This Session

- `src/api/main.py` — FastAPI app with CORS, includes all route modules
- `src/api/routes/` — families, intake, memory, support, roles, safety (3 sub-routes), qol, events, forecast, escalation
- `src/services/` — corresponding service classes for each domain
- `src/schemas/` — Pydantic schemas with shared `__init__.py` re-exports
- `src/database.py` — async engine + session factory + `Base` declarative

## Pitfalls

- Don't return ORM objects directly — SQLAlchemy objects aren't JSON-serializable
- Don't create sessions manually — always use the `get_db()` dependency
- Don't mix sync and async — `session.execute()` must be `await`ed
- Keep service classes stateless — instantiate fresh per request
- Circular imports between models and schemas — use forward references or separate files