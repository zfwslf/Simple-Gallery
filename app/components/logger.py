#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import os
from .utils import *
class Logger():
    def __init__(self, logforder,logfile):
        '''
            指定保存日志的文件路径，日志级别，以及调用文件
            将日志文件写入到指定文件中
        :return:
        '''

        #用字典保存日志级别
        self.format_dict = {
           1 : logging.Formatter('%(asctime)s - DEBUG - %(name)s - %(message)s'),
           2 : logging.Formatter('%(asctime)s - INFO - %(name)s - %(message)s'),
           3 : logging.Formatter('%(asctime)s - WARINING - %(name)s - %(message)s'),
           4 : logging.Formatter('%(asctime)s - ERROR - %(name)s - %(message)s'),
           5 : logging.Formatter('%(asctime)s - CRITICAL - %(name)s - %(message)s')
        }

        # 创建文件夹
        logpath =  os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir)) + '/logs'
        make_dir(logpath)
        logpath =  logpath + logforder
        make_dir(logpath)

        # 生成日志文件路径
        self.logfile =  logpath + logfile


        #创建一个handler，用于写入日志文件
        # self.fh = logging.FileHandler(self.logfile)
        # self.fh = logging.FileHandler.RotatingFileHandler(self.logfile, maxBytes=100000, backupCount=10)
        self.fh = logging.handlers.RotatingFileHandler(self.logfile, maxBytes=100000000, backupCount=10)
        self.fh.setLevel(logging.DEBUG)

        #创建一个handler,用于输出到控制台
        self.ch = logging.StreamHandler()
        self.ch.setLevel(logging.DEBUG)



    def inslog(self,loglevel,logtype):

        #创建一个logger
        self.logger = logging.getLogger(logtype)
        if not len(self.logger.handlers):
            self.logger.setLevel(logging.DEBUG)


            #定义handler的输出格式
            #formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            formatter = self.format_dict[int(loglevel)]
            self.fh.setFormatter(formatter)
            self.ch.setFormatter(formatter)

            # 给logger添加handler
            self.logger.addHandler(self.fh)
            self.logger.addHandler(self.ch)
        return self.logger

    def getlog(self):
        return self.logger
