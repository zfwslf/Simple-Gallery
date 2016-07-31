# -*- encoding:utf-8 -*-

from flask import Blueprint, render_template

from flask import current_app as App
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login

from ...extensions import db
from ...components import BaseView


modGallery = Blueprint('modGallery', __name__, url_prefix='')
baseView = BaseView()


@modGallery.before_request
@login_required
def check_login():
    pass
