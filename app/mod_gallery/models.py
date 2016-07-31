# -*- coding: utf-8 -*-


from flask import current_app as App
from flask import request
from flask.ext.login import login_required, login_user, current_user, AnonymousUserMixin

from ..extensions import db
from ..components import MyTime

from ..mod_user import User


class AlbumModel(db.Model):
    """
    相册信息表
    """
    __tablename__ = 'gallery_album_info'

    id = db.Column(db.Integer, primary_key=True)
    albumName = db.Column(db.String(100), unique=True)
    createTime = db.Column(db.String(100), default=MyTime.timestamp_datetime())
    desc = db.Column(db.Text())
    lastUpdateTime = db.Column(
        db.String(100), default=MyTime.timestamp_datetime())
    username = db.Column(db.String(100), db.ForeignKey(User.username))
    photos = db.relationship('PhotoModel', backref='album')


class PhotoModel(db.Model):
    """
    相片信息表
    """
    __tablename__ = 'gallery_photo_info'

    id = db.Column(db.Integer, primary_key=True)
    photoName = db.Column(db.String(100), unique=True)
    nativeFileStatic = db.Column(db.String(500))
    hdFileStatic = db.Column(db.String(500))
    compressFileStatic = db.Column(db.String(500))
    createTime = db.Column(db.String(100), default=MyTime.timestamp_datetime())
    lastUpdateTime = db.Column(
        db.String(100), default=MyTime.timestamp_datetime())
    album_id = db.Column(db.Integer, db.ForeignKey(AlbumModel.id))
    is_conver_photo = db.Column(db.Integer, default=0)
