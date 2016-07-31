# -*- encoding:utf-8 -*-

import os
import time


from flask import Blueprint, render_template

from flask import current_app as App
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login

from ...extensions import db
from ...components import BaseView


modUser = Blueprint('modUser', __name__, url_prefix='/user')
baseView = BaseView()
