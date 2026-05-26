"""update_rating_range_0_to_10

Revision ID: b68eb5dc4b71
Revises: seed_genres_tmdb
Create Date: 2026-05-26 15:57:52.775174

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b68eb5dc4b71'
down_revision: Union[str, Sequence[str], None] = 'seed_genres_tmdb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # reviews: 1-5 -> 0-10
    op.drop_constraint('ck_reviews_rating_range', 'reviews', type_='check')
    op.create_check_constraint(
        'ck_reviews_rating_range',
        'reviews',
        'rating IS NULL OR (rating >= 0 AND rating <= 10)',
    )

    # watchlist_entries: 1-5 -> 0-10
    op.drop_constraint('ck_watchlist_rating_range', 'watchlist_entries', type_='check')
    op.create_check_constraint(
        'ck_watchlist_rating_range',
        'watchlist_entries',
        'rating IS NULL OR (rating >= 0 AND rating <= 10)',
    )


def downgrade() -> None:
    op.drop_constraint('ck_reviews_rating_range', 'reviews', type_='check')
    op.create_check_constraint(
        'ck_reviews_rating_range',
        'reviews',
        'rating IS NULL OR (rating >= 1 AND rating <= 5)',
    )

    op.drop_constraint('ck_watchlist_rating_range', 'watchlist_entries', type_='check')
    op.create_check_constraint(
        'ck_watchlist_rating_range',
        'watchlist_entries',
        'rating IS NULL OR (rating >= 1 AND rating <= 5)',
    )
