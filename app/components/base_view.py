# -*- coding: utf-8 -*-

from flask import jsonify, request
from flask.views import MethodView
from flask import Blueprint, render_template, request
from logger import Logger
import re
"""
各个模块的views需要继承
"""
#logger = Logger('/urlVerify', '/urlVerify.log')

class BaseView(MethodView):

    def __init__(self):
        pass

    """
        后端接口返回成功的格式
    """

    def render_json_success(self, data=""):
        return jsonify(
            {
                'success': True,
                'message': 'success',
                'data': data
            }
        )

    """后端接口返回失败的格式"""

    def render_json_failure(self, message, data=None):
        try:
            return jsonify(
                {
                    'success': False,
                    'message': str(message),
                    'data': data
                }
            )
        except Exception, e:
            return jsonify(
                {
                    'success': False,
                    'message': message,
                    'data': data
                }
            )

    """
        检查QueryString中必须要包含一些项
        @param string param get/post中必须要有的参数且不能为空
          example:   paramstr = "key, key2, key3"
        @return 
            success: None
            failed:  render_json_failure
    """

    def require_request(self, paramstr):
        needRequire = []
        if isinstance(paramstr, str) and paramstr:
            paramList = paramstr.split(',')
            for p in paramList:
                p = p.strip()
                if not request.form.get(p):
                    needRequire.append(p)
        else:
            return self.render_json_failure("paramstr must be string!!")

        if len(needRequire) > 0:
            errmsg = "Params [ {} ] needed!" .format(', '.join(needRequire))
            return self.render_json_failure(errmsg)

        return True
class VerifyUrl():
    def __init__(self):
        pass
    """
      url参数验证
    """

    def verify_request_get_json(self, verifyType=None):
        resultDict = request.get_json()
        if resultDict is None:
            return request.get_json()
        if self.filter_dict_value(resultDict):
            return False
        else:
            return request.get_json()
    
    #递归字典
    def filter_dict_value(self,d):
        #是否匹配标识位
        flagFilter = 0
        for k,v in d.iteritems():
            if isinstance(v, dict):
                v= self.filter_dict_value(v)
            if v:
                if self.sql_verify(v):
                    flagFilter = 1
        return  flagFilter   
    """
      SQL注入类检测
    """
  
    def sql_verify(self, checkData):
        # select,update,insert,delete,联合查询过滤
        reSqlObj1 = re.search(r'(?:delete|update|insert|select|)\
            .*?\b(?:from|into|set|union)?\b\s*(?:where\s*.*?=)?',\
             str(checkData), re.I)
        # 关键词过滤show version|user|database|sleep|benchmark|load_file
        reSqlObj2 = re.search(r'(?:show)?.*?(?:version|user|\
            database|sleep|benchmark|load_file)\s*(?:current_user)?',\
            str(checkData), re.I)
        #or,and,
        reSqlObj3 = re.search(r'\b(?:and|or|alert|use)\b',str(checkData), re.I)
        #特殊字符过滤
        reSqlObj4 = re.search(r'(?:\.\.?\/|[|$&*()])',str(checkData),re.I)
        if reSqlObj1 or reSqlObj2 or reSqlObj3 or reSqlObj4:
            line = str(checkData) + '有注入风险'
            logger.inslog(2, 'sql_verify').info(line)
            return 1
        else:
            return 0

