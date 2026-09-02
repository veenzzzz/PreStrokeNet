from app.core.database import Base, engine

# Import all models so SQLAlchemy registers every table before create_all.
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")