# coding: utf-8
import sys
import md5


class Prpcrypt():

    def __init__(self):
        pass

    # 加密函数，如果text不是16的倍数【加密文本text必须为16的倍数！】，那就补足为16的倍数
    def encrypt(self, text):
        m = md5.new()
        m.update(text.encode('utf-8'))
        return m.hexdigest()

    # 解密后，去掉补足的空格用strip() 去掉
    def decrypt(self, text):
        pass


# if __name__ == '__main__':
#     s = 'sdf'
#     p = Prpcrypt()
#     print p.encrypt(s)
