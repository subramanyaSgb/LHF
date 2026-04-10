"""Async SQLAlchemy database engine, session factory, and helpers.

Provides:
- ``engine`` — the async engine bound to ``DATABASE_URL``
- ``AsyncSessionLocal`` — a session factory for request-scoped sessions
- ``Base`` — the declarative base all models inherit from
- ``get_db()`` — FastAPI dependency that yields a session per request
- ``init_db()`` — one-shot helper to create all tables (dev / first-run)
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for FastAPI dependency injection.

    The session is automatically closed when the request finishes.
    Write endpoints must call ``await db.commit()`` explicitly.

    Yields:
        AsyncSession: A scoped database session.
    """
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create all tables defined on ``Base.metadata``.

    Intended for development and first-run bootstrapping.  In production,
    use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
