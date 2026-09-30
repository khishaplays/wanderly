from flask import Flask

from .config import Config
from .extensions import cors, db, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)

    from . import models
    from .routes.destinations import destinations_bp

    app.register_blueprint(destinations_bp)

    @app.get("/api/health")
    def health():
        return {
            "status": "ok",
            "message": "Wanderly API is running",
        }

    return app