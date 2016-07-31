# -*- coding:utf-8 -*-
"""
program: 相册相关的接口
author: zengfuwei@37.com
time: 20160627
"""

import time
import os
import re
from shutil import copyfile
from shutil import rmtree
from ..components import make_dir
import zipfile

from flask import current_app as App
from flask import request, make_response, send_file
from flask.ext.login import login_required, login_user, current_user, AnonymousUserMixin

from ..extensions import db
from ..components import ret_val, row2dict, MyException, MyTime, make_dir

from models import AlbumModel, PhotoModel
from .albumManager import AlbumManager


class PhotoManager(object):

    def __init__(self, username=None):
        self.username = current_user.username
        self.albumInstance = AlbumManager(username=self.username)

    def get_photos_by_album_id(self, albumId):
        """
        获取相片list根据相册ID
        """
        ret = []
        albumObj = db.session.query(AlbumModel).filter(AlbumModel.id == albumId).filter(
            AlbumModel.username == self.username).scalar()
        if not albumObj:
            raise MyException("albumId is not exist?")

        photoObjAry = db.session.query(PhotoModel).join(AlbumModel)\
            .filter(PhotoModel.album_id == albumId)\
            .filter(AlbumModel.username == self.username)\
            .order_by(db.desc(PhotoModel.createTime)).all()

        if not photoObjAry:
            return ret

        for photoObj in photoObjAry:
            tmpDt = {}
            tmpDt['createTime'] = str(photoObj.createTime)
            tmpDt['photoId'] = photoObj.id
            tmpDt['photoName'] = photoObj.photoName
            tmpDt['is_conver_photo'] = photoObj.is_conver_photo
            tmpDt['nativeFileStatic'] = self.albumInstance.local_dir_translate_http_dir(
                photoObj.nativeFileStatic, albumObj.id)
            tmpDt['compressFileStatic'] = self.albumInstance.local_dir_translate_http_dir(
                photoObj.compressFileStatic, albumObj.id)
            tmpDt['hdFileStatic'] = self.albumInstance.local_dir_translate_http_dir(
                photoObj.hdFileStatic, albumObj.id)
            ret.append(tmpDt)
        return ret

    def set_photo_cover_by_id(self, photoId):
        """
        设置相册封面。
        1，找到当前的相册ID
        2，把相册下面的设置封面全部清楚
        3，找到要设置的相片进行设置
        """
        if not photoId:
            raise MyException("系统繁忙, 找不到相册?")

        albumId = db.session.query(PhotoModel.album_id).filter(
            PhotoModel.id == photoId).scalar()
        if not albumId:
            raise MyException("系统繁忙，找不到相册!")

        db.session.query(PhotoModel).filter(
            PhotoModel.album_id == albumId).update({PhotoModel.is_conver_photo: 0})
        db.session.query(PhotoModel).filter(
            PhotoModel.id == photoId).update({PhotoModel.is_conver_photo: 1})
        try:
            db.session.commit()
        except Exception, e:
            App.logger.error(e)
            db.session.rollack()
            raise MyException("系统繁忙!")

        return True

    def delete_photo_by_id(self, photoIdAry):

        deleteFileAry = []

        if not photoIdAry or type(photoIdAry) != list:
            raise MyException("请选择要删除的相片!")

        for photoId in photoIdAry:
            photoId = int(photoId)
            photoObj = db.session.query(PhotoModel).join(AlbumModel).filter(
                AlbumModel.username == self.username).filter(PhotoModel.id == photoId).first()
            if not photoObj:
                raise MyException("找不到相片")
            db.session.query(PhotoModel.id).filter(
                PhotoModel.id == photoId).delete()
            # delete photo
            deleteFileAry.append(photoObj.nativeFileStatic)
            deleteFileAry.append(photoObj.compressFileStatic)
            deleteFileAry.append(photoObj.hdFileStatic)

        try:
            db.session.commit()
        except Exception, e:
            App.logger.error(e)
            db.session.rollback()
            return False

        if deleteFileAry:
            for f in deleteFileAry:
                try:
                    os.remove(f)
                except Exception, e:
                    pass
        return True

    def download_photo_by_id_ary(self, photoIdAry):
        response = ""
        downloadFileDt = {}
        albumName = ""
        if not photoIdAry or type(photoIdAry) != list:
            raise MyException("请选择要下载的相片!")

        isIE = False
        App.logger.info(request.headers.get('User-Agent'))
        if re.search('MSIE|Edge| rv:11', request.headers.get('User-Agent')):
            isIE = True

        for photoId in photoIdAry:
            photoId = int(photoId)
            obj = db.session.query(PhotoModel, AlbumModel)\
                .join(AlbumModel).filter(AlbumModel.username == self.username)\
                .filter(PhotoModel.id == photoId).first()
            if not obj:
                App.logger.error("photoid:{} can't find nativeFileStatic".format(
                    photoId))
                return False
            photoObj, albumObj = obj[0], obj[1]
            downloadFileDt[photoObj.nativeFileStatic] = {
                "photoName": photoObj.photoName,
                "photoId": photoObj.id,
                "albumId": photoObj.album_id,
                "albumName": albumObj.albumName
            }
            albumName = downloadFileDt[photoObj.nativeFileStatic]['albumName']

        if len(downloadFileDt) > 1:
            # 压缩图片，进行下载压缩文件 文件格式: 相册名_时间.tar.gz
            # 临时下载文件夹建立
            tmpDownloadDir = "{}{}/{}/".format(App.config['GALLERY_CONFIG'][
                'imageTempDownloaddDir'], self.username, int(time.time()))
            if os.path.exists(tmpDownloadDir):
                rmtree(tmpDownloadDir)
            make_dir(tmpDownloadDir)
            zipfilename = "{}_{}.zip".format(
                albumName, MyTime.timestamp_datetime(format="%Y-%m-%d"))
            tmpDownloadZipFile = "{}{}".format(tmpDownloadDir, zipfilename)
            f = zipfile.ZipFile(tmpDownloadZipFile, 'w', zipfile.ZIP_DEFLATED)
            for nativeFileStatic, one in downloadFileDt.iteritems():
                tmpDownloadphotoFile = "{}{}".format(
                    tmpDownloadDir, one['photoName'])
                copyfile(nativeFileStatic, tmpDownloadphotoFile)
                # cd 过去之后就解决压缩文件存在路径层级问题
                os.chdir(tmpDownloadDir)
                f.write(one['photoName'])
            f.close()
            response = make_response(send_file(tmpDownloadZipFile))
            if isIE is True:
                # 避免IE edge浏览器下载中文名乱码
                zipfilename = zipfilename.encode('gbk')
            response.headers[
                "Content-Disposition"] = "attachment; filename={};".format(zipfilename)

        elif len(downloadFileDt) == 1:
            # 如果是一张直接下载文件
            for nativeFileStatic, one in downloadFileDt.iteritems():
                # 临时下载文件夹建立
                tmpDownloadDir = "{}{}/{}/".format(App.config['GALLERY_CONFIG'][
                    'imageTempDownloaddDir'], self.username, int(time.time()))
                if os.path.exists(tmpDownloadDir):
                    rmtree(tmpDownloadDir)
                make_dir(tmpDownloadDir)
                tmpDownloadFile = "{}{}".format(
                    tmpDownloadDir, one['photoName'])
                # 用户需要下载以前的照片的名字
                # 所以需要先复制
                copyfile(nativeFileStatic, tmpDownloadFile)
                response = make_response(send_file(tmpDownloadFile))
                if isIE is True:
                    one['photoName'] = one['photoName'].encode('gbk')
                response.headers[
                    "Content-Disposition"] = "attachment; filename=\"{}\";".format(one['photoName'])
        else:
            raise MyException("用户没有选择相片?")

        return response
