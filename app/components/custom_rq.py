#!/usr/bin/env python
# -*- coding: utf-8 -*-
from app.components import *
import threading
from multiprocessing import Process, Pool
import multiprocessing
from rq import Queue, Connection, Worker, get_current_job
from rq.utils import ColorizingStreamHandler
from ..config import DefaultConfig
import redis
import logging
import sys

class CustomRq():
    def __init__(self):
        self.logger = Logger('/queue' ,'/queue.log')
        self.conn = redis.StrictRedis(host=DefaultConfig.RQ_DEFAULT_HOST, port=DefaultConfig.RQ_DEFAULT_PORT, \
                                         db=DefaultConfig.RQ_DEFAULT_DB, password=DefaultConfig.RQ_DEFAULT_PASSWORD)

    def _task_queue_consumer(self):
        # 补货rq.worker的日志
        self.logger.inslog(2,'rq.worker')

        listen = DefaultConfig.RQ_QUEUE_LIST
        with Connection(self.conn):
            worker = Worker(list(map(Queue, listen)))
            res = worker.work()
            self.logger.inslog('2','CUSTOM').info(res)

    def threading_queue(self):
        t = threading.Thread(target=self._task_queue_consumer())
        t.daemon = True
        t.start()
        t.join()

    def init_app(self,proNum):
        # pr = Process(target=self.threading_queue,args=())
        # pr.start()
        jobs = []
        for i in range(proNum):
            p = Process(target=self.threading_queue, args=())
            jobs.append(p)
            p.start()

        # pid_list = []
        # pool = multiprocessing.Pool(processes=4)   #multiprocessing pool多进程池，processes=4 指定进程数
        # for i in xrange(3):
        #     pool.apply_async(self.threading_queue(),)
        # for i in multiprocessing.active_children():
        #     pid_list.append(i.pid)
        #     pid_list.append(os.getpid())
        #     pool.close()
        #     pool.join()