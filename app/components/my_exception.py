# -*- encoding:utf-8


class MyException(Exception):

    def __init__(self, value):
        self.value = value

    def __str__(self):
        return self.value
