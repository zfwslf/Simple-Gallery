# -*- coding:utf-8 -*-

import requests
import inspect
from flask import current_app as App
from flask.ext.login import current_user

from utils import *
from my_exception import MyException


class MyRequests(object):

    @classmethod
    def request(self, url,  params={}, reqtype="get", timeout=60, conetentTypeJson="", encodingUtf8=True):
        """
         request interface with it can't auto loging deubg message
         and the control of timeout and retry
         @param string url		要请求的接口
         @param string reqtype 	reuqest的类型 post/get
         @param int    timeout	请求的超时时间(默认60秒)
         @param string conetentTypeJson   是否使用json体进行请求(conetent-Type: application/json)
         @param boolean encodingUtf8      默认使用utf8编码
         @param boolean opsApi            是否需要封装publickKey signature两个参数
        """
        username = current_user.username
        curframe = inspect.stack()[1][3]

        if reqtype != 'post' and reqtype != 'get':
            raise MyException("curframe:[{}] url:[{}] reqtype:[{}] case:[MyRequests \
            only support type of get or post.....]" .format(curframe, url, reqtype))
        if reqtype == 'get' and conetentTypeJson:
            raise MyException("only post can use with conetentTypeJson!")

        App.logger.info(
            "reqtype:[{}] url:[{}] params:[{}]".format(reqtype, url, params))

        if reqtype == 'post':
            if conetentTypeJson:
                r = requests.post(url, json=params, timeout=timeout)
            else:
                r = requests.post(url, data=params, timeout=timeout)
        else:
            r = requests.get(url, params=params, timeout=timeout)
        if encodingUtf8 is True:
            r.encoding = "utf-8"

            if r.status_code != 200:
                raise MyException(
                    'url[{}] status_code:[{}]'.format(url, r.status_code))
        jsonRes = r.json()

        if not jsonRes['success'] or jsonRes['success'] == 'false':
            App.logger.error("curframe:[{}] url:[{}] case:[{}]" .format(
                curframe, url, jsonRes['message']))
            raise MyException(jsonRes['message'])

        return jsonRes['data']
