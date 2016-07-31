#-*- coding: utf-8 -*-

import re

from flask import Blueprint, render_template, request, redirect, jsonify
from flask import current_app as App
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login

from ...extensions import db

from .baseViews import modGallery, baseView

from ..photoManager import PhotoManager
from ..models import AlbumModel


@modGallery.route('/photo/index',  methods=['GET'])
def _photo_index():
    """相册主页"""
    return render_template("pic.html")
    # return render_template('index.html')


@modGallery.route('/photo/download/index', methods=['GET'])
def _donwload_index():
    return render_template("download.html")


@modGallery.route('/photo/delete/index', methods=['GET'])
def _delete_index():
    return render_template("delete.html")


@modGallery.route('/photo/get_photos_by_album_id', methods=['POST'])
def _get_photos_by_album_id():
    """
    获取相片缩略图list进行展示
    """
    albumId = request.form.get('albumId', None)
    phObj = PhotoManager()
    data = phObj.get_photos_by_album_id(albumId)

    albumObj = db.session.query(AlbumModel).filter(
        AlbumModel.id == albumId).first()

    ret = {
        "success": True,
        'message': '',
        'data': data,
        'username': current_user.username,
        'albumName': albumObj.albumName,
        'albumDesc': albumObj.desc
    }

    return jsonify(ret)


@modGallery.route('/photo/set_photo_cover_by_id', methods=['POST'])
def set_photo_cover_by_id():
    """
    设置相册的封面
    """
    photoId = request.form.get('photoId', None)
    phObj = PhotoManager()
    data = phObj.set_photo_cover_by_id(photoId)
    if data:
        return baseView.render_json_success("设置成功!")
    else:
        return baseView.render_json_failure("设置相册封面失败!")


@modGallery.route('/photo/delete_photo_by_id_ary', methods=['POST'])
def delete_photo_by_id_ary():
    """
    设置相册的封面
    """
    photoIdAry = request.form.getlist('photoIdAry[]')
    phObj = PhotoManager()
    data = phObj.delete_photo_by_id(photoIdAry)
    if data:
        return baseView.render_json_success("删除成功!")
    else:
        return baseView.render_json_failure("删除失败!")


@modGallery.route('/photo/download_photo_by_id_ary', methods=['GET', 'POST'])
def download_photo_by_id_ary():
    """
    根据ID下载照片
    """

    photoIdAry = request.args.get('photoIdAry')
    if re.search(',', photoIdAry):
        photoIdAry = re.split(',', photoIdAry)
    else:
        photoIdAry = [photoIdAry]

    phObj = PhotoManager()
    return phObj.download_photo_by_id_ary(photoIdAry)
