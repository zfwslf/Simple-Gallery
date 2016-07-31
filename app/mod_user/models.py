# -*- coding: utf-8 -*-

from flask.ext.login import AnonymousUserMixin
from flask.ext.login import UserMixin
from ..extensions import db


class Anonymous(AnonymousUserMixin):

    def __init__(self):
        self.username = 'Guest'


class User(UserMixin, db.Model):
    """
    用户表model,主要进行用户登录逻辑判断
    """
    __tablename__ = 'gallery_user_info'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(100))
    email = db.Column(db.String(100))

    # # ================================================================
    # # Class methods

    @classmethod
    def authenticate(self, loginname, loginPwd):
        """登录验证"""
        user = db.session.query(User).filter(
            db.or_(User.username == loginname, User.email == loginname)).first()
        if user is None:
            return user, False
        if loginPwd == user.password:
            authenticated = True
        else:
            authenticated = False
        return user, authenticated
