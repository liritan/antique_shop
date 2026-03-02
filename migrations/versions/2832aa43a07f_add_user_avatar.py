"""add user avatar

Revision ID: 2832aa43a07f
Revises: 8c7cfaf7938c
Create Date: 2026-03-02 16:45:18.812855

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2832aa43a07f'
down_revision = '8c7cfaf7938c'
branch_labels = None
depends_on = None


from alembic import op
import sqlalchemy as sa

def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatar_url', sa.String(length=255), nullable=False, server_default=""))

    # (опционально) если не хочешь, чтобы default оставался на уровне БД:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('avatar_url', server_default=None)

def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('avatar_url')

    # ### end Alembic commands ###
