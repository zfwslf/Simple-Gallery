# -*- coding: utf-8 -*-

import sys
#
# 解决flask remder_template包含中文的问题
reload(sys)
sys.setdefaultencoding('utf-8')

from flask.ext.script import Manager, Shell
from app import create_app
from app.extensions import db

app = create_app()
manager = Manager(app)


def make_shell_context():
    return dict(app=app, db=db)
manager.add_command("shell", Shell(make_context=make_shell_context))


@manager.command
def initdb():
    """Init/reset database."""

    # db.drop_all()
    db.create_all()


if __name__ == "__main__":
    manager.run()
    #app.run(threaded=True, port=5001)
