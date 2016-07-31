# -*- coding: utf-8 -*-

import os

from flask import Flask

from .extensions import db, login_manager
from .config import ProductConfig, configDict, DefaultConfig

from .components import BaseView, MyException

from .mod_user import modUser, User, Anonymous
from .mod_gallery import modGallery


# For import *
__all__ = ['create_app']

#
DEFAULT_BLUEPRINTS = (
    modUser,
    modGallery,
)


def create_app(app_name=None, blueprints=None):
    """Create a Flask app."""

    if app_name is None:
        app_name = ProductConfig.PROJECT
    if blueprints is None:
        blueprints = DEFAULT_BLUEPRINTS

    app = Flask(app_name, instance_path=ProductConfig.INSTANCE_FOLDER_PATH,
                instance_relative_config=True)
    configure_app(app)
    configure_hook(app)
    configure_blueprints(app, blueprints)
    configure_extensions(app)
    configure_logging(app)

    #configure_context_processor(app)

    return app


def configure_app(app):
    """Different ways of configurations."""

    configType = os.getenv('FLASK_CONFIG', 'default')
    if configType in configDict:
        app.config.from_object(configDict[configType])
    else:
        app.config.from_object(ProductConfig)

    # Use instance folder instead of env variables to make deployment easier.
    # toobar debug
    if app.config['DEBUG'] is True:
        from flask_debugtoolbar import DebugToolbarExtension
        toolbar = DebugToolbarExtension(app)


def configure_extensions(app):
    # flask-sqlalchemy
    db.init_app(app)

    # flask-login
    login_manager.login_view = 'modUser.loginIndex'
    login_manager.anonymous_user = Anonymous

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(id)
    login_manager.setup_app(app)

def configure_blueprints(app, blueprints):
    """Configure blueprints in views."""

    for blueprint in blueprints:
        app.register_blueprint(blueprint)


def configure_logging(app):
    """Configure file(info) and email(error) logging."""

    import logging
    from logging.handlers import SMTPHandler

    # Set info level on logger, which might be overwritten by handers.
    # Suppress DEBUG messages.
    app.logger.setLevel(logging.INFO)
    try:
        app.logger.StreamHandler()
    except Exception, e:
        pass
    info_log = os.path.join(app.config['INSTANCE_FOLDER_PATH'], 'app.log')
    info_file_handler = logging.handlers.RotatingFileHandler(
        info_log, maxBytes=100000000, backupCount=10)
    info_file_handler.setLevel(logging.INFO)
    info_file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s '
        '[in %(pathname)s:%(lineno)d]')
    )
    app.logger.addHandler(info_file_handler)


def configure_context_processor(app):
    @app.context_processor
    def common_nav_list():
        pass


def configure_hook(app):

    @app.before_first_request
    def initialize():
        pass

    @app.errorhandler(MyException)
    def unhandled_exception(e):
        """catch all exception"""
        baseView = BaseView()
        app.logger.error(e)
        return baseView.render_json_failure(e)
