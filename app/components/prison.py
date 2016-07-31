# -*- coding:utf-8 -*-

import redis

from flask import request

from my_exception import MyException
from ..config.db_config import redis_config


class Prison(object):

    def __init__(self, redisKey, interval=60, thresold=15, prisonTime=3600):
        self.interval = int(interval)
        self.thresold = int(thresold)
        self.prisonTime = int(prisonTime)
        self.redisKeyPrefix = "redis_of_prison_key"
        self.redisObj = redis.StrictRedis(host=redis_config['Flask-cache']['CACHE_REDIS_HOST'], port=redis_config[
                                          'Flask-cache']['CACHE_REDIS_PORT'], password=redis_config['Flask-cache']['CACHE_REDIS_PASSWORD'], db=0)
        self.redisKey = "{}_{}_{}".format(
            self.redisKeyPrefix, request.remote_addr, redisKey)

    def req_prison_valify(self, redisKey, isCalCount=True):
        """
        判断rediskey是否存在
                - 存在，计算thresold是否达到阈值，达到阈值进行IP封禁, 返回False，没有达到直接加1
                - 不存在，直接写key，重置为1
        @return boolean True: 没有封禁 False: 封禁
        """

        redisVal = self.redisObj.get(self.redisKey)
        if redisVal:
            redisVal = int(redisVal)

        if redisVal >= self.thresold:
            if isCalCount is True:
                self.redisObj.incr(self.redisKey)

            return False
        elif redisVal > 0 and redisVal < self.thresold:
            if isCalCount is True:
                self.redisObj.incr(self.redisKey)
        else:
            self.redisObj.set(self.redisKey, 1)
            self.redisObj.expire(self.redisKey, self.prisonTime)

        return True
