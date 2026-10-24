"""Shared model metadata without loading credentials or creating an engine."""

from sqlalchemy.orm import declarative_base

Base = declarative_base()
