#-*- coding: utf-8 -*-

import json
from urllib import quote

from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask import escape, send_from_directory
from flask import current_app as App
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login

from ...extensions import db

from .baseViews import modGallery, baseView


from ..albumManager import AlbumManager


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)


# @modGallery.route("/site-map")
# def site_map():
#     links = []
#     for rule in App.url_map.iter_rules():
#         # Filter out rules we can't navigate to in a browser
#         # and rules that require parameters
#         if ("GET" in rule.methods or 'POST' in rule.methods) and has_no_empty_params(rule):
#             url = url_for(rule.endpoint, **(rule.defaults or {}))
#             links.append((url, rule.endpoint))

#     return baseView.render_json_success(links)


@modGallery.route('/',  methods=['GET'])
def _album_index():
    """相册主页"""
    return render_template('album.html')


@modGallery.route('/robots.txt')
def _rotbots():
    return send_from_directory(App.static_folder, request.path[1:])


@modGallery.route('/album/get_album_list', methods=['POST'])
def get_album_list():
    abObj = AlbumManager()
    data = abObj.get_album_list()
    ret = {
        "success": True,
        "message": "success",
        "data": data,
        "username": current_user.username
    }
    return jsonify(ret)


@modGallery.route('/album/create', methods=['POST'])
def album_create():
    """
    创建相册
    """
    albumName = request.form.get('albumName', None)
    albumDesc = request.form.get('albumDesc', None)

    abObj = AlbumManager()
    ret = abObj.create_album(albumName, albumDesc)
    if ret:
        # 返回相册ID
        return baseView.render_json_success(ret)
    else:
        return baseView.render_json_failure("创建失败!")


@modGallery.route('/album/delete', methods=['POST'])
def album_delete():
    """
    删除相册
    """
    # print request.form.items()
    albumIdAry = request.form.getlist("albumIdAry[]")
    abObj = AlbumManager()
    # print albumIdAry, type(albumIdAry)
    ret = abObj.delete_album_by_id_ary(albumIdAry)
    if ret:
        return baseView.render_json_success("删除成功!")
    else:
        return baseView.render_json_failure("删除失败!")


@modGallery.route('/album/update', methods=['POST'])
def album_update():
    albumId = request.form.get('albumId', None)
    albumName = request.form.get('albumName', None)
    albumDesc = request.form.get('albumDesc', None)

    abObj = AlbumManager()
    ret = abObj.update_album(albumId, albumName, albumDesc)
    if ret:
        # 返回相册ID
        return baseView.render_json_success("修改成功")
    else:
        return baseView.render_json_failure("修改失败!")


@modGallery.route('/album/upload', methods=['POST'])
def album_upload():
    """
    上传相册
    """
    # debug
    albumId = request.form.get('albumId', None)
    # request.file['xxx'] to get file
    file = request.files['file']
    fileAry = [file.filename]

    abObj = AlbumManager()
    ret = abObj.upload_album(fileAry, fileHandle=file, albumId=albumId)
    if ret:
        return baseView.render_json_success("{}上传成功".format(file.filename))
    else:
        return baseView.render_json_failure("{}上传失败!".format(file.filename))
