#-*- coding: utf-8 -*-

import os
import time


from flask import Blueprint, render_template, request, redirect
from flask import current_app as App
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login

from ...extensions import db
from ..models import User

from ...components.prison import Prison

from .baseViews import modUser, baseView


@modUser.route('/login/index',  methods=['GET'])
def loginIndex():
    """登录主页"""
    return render_template('login.html')


@modUser.route('/login/login', methods=['POST'])
def actionLogin():
    loginname = request.form.get('loginname')
    loginPwd = request.form.get('loginPwd')

    # 验证登录
    user, authenticated = User.authenticate(loginname, loginPwd)
    if authenticated is True:
        # 保存session(default 1年)
        if login_user(user, True):
            indexUrl = "http://" + request.host
            return baseView.render_json_success(indexUrl)
    return baseView.render_json_failure("用户名或者密码错误!")


@modUser.route('/logout',  methods=['POST'])
@login_required
def logout():
    """退出登录"""
    logout_user()
    loginUrl = "http://" + request.host + "/user/login/index"
    return baseView.render_json_success(loginUrl)
