# -*- coding: utf-8 -*-
"""
    Utils has nothing to do with models and views.
"""

import string
import random
import os
#import requests
import json
import time

from flask import Blueprint, render_template, request
from flask.ext.login import login_required, login_user, current_user, logout_user
from werkzeug import secure_filename

from datetime import datetime
from flask import current_app as App

from ..extensions import db

from .my_time import MyTime


def ip_check(ipAddr):
    import socket
    try:
        socket.inet_aton(addr)
        return True
    except socket.error:
        return False


def get_upload_file_and_save():
    """
    获取前端uploaddify上传的文件
    """
    file = request.files['Filedata']
    uploadPath = App.config['UPLOAD_FOLDER_PATH']
    now = MyTime.timestamp_datetime('', "%Y%m%d_%H%M%S")
    filename = secure_filename(file.filename)
    import re
    if re.match(r'.*\..*', filename) == None:
        filename = ".{}".format(filename)
    filename = "{}_{}_{}" .format(current_user.username, now, filename)
    targeFile = os.path.join(uploadPath, filename)
    file.save(targeFile)
    return targeFile


def ret_val(success, data_or_message="", isLog=False):
    """内部接口返回的格式"""
    try:
        if success:
            if data_or_message:
                return {'success': True, 'data': data_or_message}
            else:
                return {"success": True, 'data': ""}
        else:
            if isLog:
                App.logger.error(data_or_message)
            return {"success": False, 'message': data_or_message}

    except Exception, e:
        App.logger.error(e)


def make_dir(dir_path):
    try:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
    except Exception, e:
        raise e


def get_current_time():
    """获取当前时间"""
    return datetime.utcnow()


# 任务下发服务端函数
# def send_http_post(payload):
#     headers = {'Content-type': 'application/json'}
#     if payload['url'] != "" and payload.has_key('url'):
#         url = payload['url']
#     else:
#         result = {'success': False,
#                   'message': 'In this post data has not url', 'data': []}
#         return result
#     req = requests.Session()
#     http = requests.adapters.HTTPAdapter(max_retries=3)
#     https = requests.adapters.HTTPAdapter(max_retries=3)
#     req.mount('http://', http)
#     req.mount('https://', https)

#     try:
#         r = req.post(url, data=json.dumps(payload), headers=headers)
#         result = r.json()
#     except:
#         result = {'success': False,
#                   'message': 'http post has faild', 'data': []}
#     return result

# def send_http_get(url):
#     headers = {'Content-type': 'application/json'}
#     req = requests.Session()
#     http = requests.adapters.HTTPAdapter(max_retries=3)
#     https = requests.adapters.HTTPAdapter(max_retries=3)
#     req.mount('http://', http)
#     req.mount('https://', https)

#     try:
#         result = req.get(url,data='',headers=headers)
#     except:
#         result = ''
#     return result


def row2dict(row):
    """
        SQLAlchemy query result row to dict
        example:
                this is a dist of list: [for row2dict(i) in db.session.query(Table).all()]

    """
    d = {}

    timeKeyAry = ['last_update', 'faultTime', 'date', 'beginTime', 'endTime', 'lastUpdateTime', 'createTime']

    for column in row.__table__.columns:

        d[column.name] = getattr(row, column.name)
        if column.name in timeKeyAry:
            d[column.name] = str(getattr(row, column.name))
    return d


def passwordEncrypt(passwordStr):
    import base64
    passwordKey = App.config['ROOT_PASSWORD_ENCRYPT_KEY']
    enc = []
    for i in range(len(passwordStr)):
        key_c = passwordKey[i % len(passwordKey)]
        enc_c = chr((ord(passwordStr[i]) + ord(key_c)) % 1024)
        enc.append(enc_c)
    return base64.urlsafe_b64encode("".join(enc))


def passwordDecrypt(ciphertextBase64):
    import base64

    # 加载加密key
    passwordKey = App.config['ROOT_PASSWORD_ENCRYPT_KEY']

    dec = []
    enc = base64.urlsafe_b64decode(ciphertextBase64)
    for i in range(len(enc)):
        key_c = passwordKey[i % len(passwordKey)]
        dec_c = chr((1024 + ord(enc[i]) - ord(key_c)) % 1024)
        dec.append(dec_c)
    return "".join(dec)
