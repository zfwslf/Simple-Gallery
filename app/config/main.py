# -*- coding: utf-8 -*-

import os

from ..components import make_dir
import db_config

import gallery_config


class BaseConfig(object):

    PROJECT = "app"

    # Get app root path, also can use flask.root_path.
    # ../../config.py
    PROJECT_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

    DEBUG = True
    RQ_CUSTOM_SWITCH = False
    TESTING = False
    DEBUG_TB_INTERCEPT_REDIRECTS = False

    ADMINS = ['youremail@yourdomain.com']

    SECRET_KEY = 'my secret key'
    INSTANCE_FOLDER_PATH = os.path.join(PROJECT_ROOT, '../logs/instance')
    make_dir(INSTANCE_FOLDER_PATH)

    # SqlAlchemy - mysql
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_POOL_SIZE = 0  # 连接池连接个数, 0表示没有限制
    SQLALCHEMY_POOL_RECYCLE = 10  # 连接池空闲时间
    SQLALCHEMY_DATABASE_URI = 'mysql://%s:%s@%s/%s' % (db_config.mysql_config['user'], db_config.mysql_config[
                                                       'passwd'], db_config.mysql_config['host'], db_config.mysql_config['database'])
    # 业务配置
    GALLERY_CONFIG = gallery_config.config


class DefaultConfig(BaseConfig):

    DEBUG = True
    SQLALCHEMY_ECHO = False


class ProductConfig(BaseConfig):
    """
        线上专用的配置
    """
    DEBUG = False
    SQLALCHEMY_ECHO = False


class TestConfig(BaseConfig):
    DEBUG = True
    WTF_CSRF_ENABLED = False

    SQLALCHEMY_ECHO = False


# 配置文件
configDict = {
    'online': ProductConfig,
    'test': TestConfig,
    'default': DefaultConfig
}
