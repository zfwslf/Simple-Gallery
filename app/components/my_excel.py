# -*- coding: utf-8 -*-

import re


from flask import current_app as App
from flask.ext import excel
import pyexcel.ext.xls

from .utils import ret_val
from .my_exception import MyException
from .my_time import MyTime


class MyExcel(object):

    @classmethod
    def export_excel_with_data(self, inputAry, exportTemplateTitleDict="", filename="export"):
        """
        将输入的数据字段结构，进行导出excel
        @inputAry array (第一个元素的字典内容的keys为标题)
        example:
            [
                {
                        key: xx
                        key_2: xx
                        key_3 : xxx
                },
                {
                        key: xxx
                        key_2: xx
                        key_3 : xxx
                }
            ]

        @exportTemplateTitle  dict
                example:
                        'exportTemplateTitle': {
                            "业务路径": {
                                        "dbfield": 'tree_path',
                                        'type': "text",
                                'val': '',
                                },
                                {
                                        xxx : {
                                        'dbfield' : 'xxxx',
                                        'type': 'xxx',
                                        ''
                                        }
                                }

                         }

        """

        if not exportTemplateTitleDict:
            raise MyException("exportTemplateTitleKey is empty!")

        if type(inputAry) != list or not inputAry:
            raise MyException("inputary is not list or is empty!")

        if filename is 'export':
            filename = "{}.{}" .format(
                filename, MyTime.timestamp_datetime('', "%Y%m%d_%H%M"))

        chTitileAry = []
        titleAry = []
        for index, one in enumerate(exportTemplateTitleDict):
            tmpAry = {}
            if hasattr(one['title'], 'decode'):
                one['title'] = u'{}'.format(one['title'])
            tmpAry[one['dbfield']] = one['title']
            titleAry.append(one['title'])
            chTitileAry.append(tmpAry)

        excelAry = []
        excelAry.append(titleAry)

        for index, one in enumerate(inputAry):
            tmpAry = []
            for title_index, title_one in enumerate(chTitileAry):
                for dbfield, title in title_one.iteritems():
                    if hasattr(title, 'decode'):
                        title = u'{}'.format(title)

                    if dbfield in one:
                        if type(one[dbfield]) == list or type(one[dbfield]) == dict:
                            App.logger.warn(
                                "one[dbfield] dbfield:[{}] must not be list or dict to export excel!".format(dbfield))
                            continue

                        if hasattr(one[dbfield], 'decode'):
                            one[dbfield] = u'{}'.format(one[dbfield])

                        tmpAry.append(one[dbfield])

                    else:
                        tmpAry.append("")
            excelAry.append(tmpAry)

        return excel.make_response_from_array(excelAry, "xls", file_name=filename)
        return excel.make_response_from_records(excelAry, "xls", file_name=filename)
