# -*- coding:utf-8 -*-
"""
program: 相册相关的接口
author: zengfuwei@37.com
time: 20160627
"""
from __future__ import division

import os
import time
import re
from PIL import Image
from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
from shutil import move
from shutil import copyfile


from flask import current_app as App
from flask import request
from flask.ext.login import login_required, login_user, current_user, AnonymousUserMixin
from werkzeug import secure_filename

from ..extensions import db
from ..components import ret_val, row2dict, MyException, MyTime
from ..components import make_dir
# 加解密
from ..components.prpcrypt import Prpcrypt

from models import AlbumModel, PhotoModel


class AlbumManager(object):

    def __init__(self, username=None):
        """
        首先进行判断用户有没有相应的权限
        """
        self.aesObj = Prpcrypt()
        self.username = current_user.username
        self.albumBackupDir = "/tmp/gallery_bakcup/{}/{}".format(
            MyTime.timestamp_datetime(format='%Y%m%d'), self.username)

    def generate_hd_image(self, fileStatic, compressFileStatic):
        hdSize = 1200
        im = Image.open(fileStatic, mode='r')
        nativeWidth, nativeHeight = im.size
        nativeRate = nativeWidth / nativeHeight
        if not nativeRate:
            raise MyException("图片比例异常!")

        if nativeWidth <= hdSize or nativeHeight <= hdSize:
            pass
        else:
            # 宽度大于高度的情况下，高度要resize成1600，宽度 = 1600 * nativeRate
            if nativeWidth > nativeHeight:
                newNativeHeight = hdSize
                newNativeWidth = hdSize * nativeRate
            elif nativeWidth < nativeHeight:
                newNativeWidth = hdSize
                newNativeHeight = newNativeWidth / nativeRate
            else:
                newNativeWidth, newNativeHeight = hdSize, hdSize

            sizebox = (int(newNativeWidth), int(newNativeHeight))
            im = im.resize(sizebox, Image.ANTIALIAS)

        im.save(compressFileStatic, im.format, quality=100)
        im.close()

        return compressFileStatic

    def crop_thumbnail_image(self, fileStatic, sizeCompress, compressFileStatic):
        """
        裁剪图片保持高清图
        1，先判断原型图片是否大于缩略图，如果小于缩略图(宽或者高)，直接返回原生图片
        2，计算sizeCompress的比例(宽/高)、fileStatic的比例(宽/高)
            -- sizeCompress的比例(宽/高) > fileStatic的比例(宽/高), 代表fileStatic的高需要裁剪,
               fileStatic(高) = filestatic(宽)/sizeCompress的比例(宽/高)
            -- sizeCompress的比例(宽/高) < fileStatic的比例(宽/高), 代表fileStatic的宽需要裁剪
               fileStatic(宽) = filestatic(高)*sizeCompress的比例(宽/高)
            -- sizeCompress的比例(宽/高) = fileStatic的比例(宽/高), 不需要做什么
        """
        im = Image.open(fileStatic)
        nativeWidth, nativeHeight = im.size
        compressWidth, compressHeight = sizeCompress
        nativeRate = nativeWidth / nativeHeight
        compressRate = compressWidth / compressHeight

        if not nativeRate or not compressRate:
            raise MyException("图片比例异常!")

        if nativeWidth <= compressWidth or nativeHeight <= compressHeight:
            # 如果是小于压缩格式, 直接调整size
            pass
        else:

            if nativeWidth < nativeHeight:
                newNativeHeight = nativeWidth / compressRate
                delta = int((nativeHeight - newNativeHeight) / 2)
                # box两个坐标点确定矩形 (a, b, c, d) -> (a,b) (c,d)
                box = (0, delta, int(nativeWidth),
                       int(newNativeHeight + delta))
                im = im.crop(box)

            elif nativeWidth > nativeHeight:
                newNativeWidth = nativeHeight * compressRate
                delta = int((nativeWidth - newNativeWidth) / 2)
                # box两个坐标点确定矩形 (a, b, c, d) -> (a,b) (c,d)
                box = (delta, 0, int(newNativeWidth + delta),
                       int(nativeHeight))
                im = im.crop(box)
            else:
                # 相等不需要裁剪
                pass
        im_resized = im.resize(sizeCompress, Image.ANTIALIAS)
        im_resized.save(compressFileStatic, im.format, quality=100)

        return compressFileStatic

    def local_dir_translate_http_dir(self, localfileStatic, albumId):
        """
        将本地路径转换为HTTP路径，提供前端进行读取
        """
        httpFilenameStatic = ""
        if not os.path.isfile(localfileStatic):
            App.logger.error("file:[{}] is not exist!".format(localfileStatic))
            return httpFilenameStatic

        basename = os.path.basename(localfileStatic)

        httpFilenameStatic = "/static/uploadImg/{}/{}/{}".format(
            self.username, albumId, basename)
        return httpFilenameStatic

    def generate_compress_photo_path_to_save(self, nativeFileStatic, sizeCompress=(180, 180), filename=None, hdCompress=False):
        """
        对原生图像进行生成缩略图，并且进行save，更新数据库对应的路径
        @param nativeFileStatic 原生照片路径
        @param photoId 照片ID(用来更新数据库压缩路径)
        @param sizeCompress 生成缩略图的size
        @param filename 主要用来记录日志用的文件名
        @pram hdCompress 是否生成高清图 高清以1600作为size边界
        @return true/false
        """

        if not os.path.isfile(nativeFileStatic):
            App.logger.error(
                "photo file:[{}] is not exist!".format(nativeFileStatic))
            raise MyException("{}找不到!".format(filename))

        nativeFilename = os.path.basename(nativeFileStatic)
        nativeFileDir = os.path.dirname(nativeFileStatic)
        try:
            nativeFilePrefix, nativeFileSuffix = os.path.splitext(
                nativeFilename)
        except Exception, e:
            App.logger.error(e)
            raise MyException("{}文件名不规范!".format(filename))

        if hdCompress is False:
            compressFilePrefix = self.aesObj.encrypt(nativeFilePrefix)
        else:
            # 高清图路径
            compressFilePrefix = "{}_hd".format(
                self.aesObj.encrypt(nativeFilePrefix))

        if not compressFilePrefix:
            App.logger.warn(
                "compressFilePrefix:[{}] is empty!".format(compressFilePrefix))
            raise MyException("{}文件名加密失败!".format(filename))

        # 完成路径 原文件路径 + MD5文件名 + Unix时间戳 + 原文件后缀
        compressFileStatic = "{}/{}{}{}".format(nativeFileDir,
                                                compressFilePrefix, int(time.time()), nativeFileSuffix)

        if nativeFileStatic == compressFileStatic:
            raise MyException("压缩文件路径和源文件路径一样?")

        # 判断生成后的文件路径
        if os.path.isfile(compressFileStatic):
            App.logger.error(
                "compress file is exist [{}]??".format(compressFileStatic))
            raise MyException("{}缩略图生成失败!".format(filename))

        # 生成缩略图
        if hdCompress is False:
            compressFileStatic = self.crop_thumbnail_image(
                nativeFileStatic, sizeCompress, compressFileStatic)
        else:
            # 生成高清图路径
            compressFileStatic = self.generate_hd_image(
                nativeFileStatic, compressFileStatic)
        return compressFileStatic

    def get_album_list(self):
        """
        获取相册list
        """

        albumList = []

        # db.session.query(AlbumModel).join()
        albumObj = db.session.query(AlbumModel)\
            .filter(AlbumModel.username == self.username)\
            .order_by(AlbumModel.createTime).all()

        if albumObj:
            # 处理封面相册缩略图
            for row in albumObj:
                tmpDt = {}
                tmpDt = row2dict(row)
                tmpDt['cover_photo_path'] = ""
                tmpDt['photos_count'] = 0
                tmpDt['photo_index_url'] = "http://" + request.host + \
                    "/photo/index?albumId=" + str(row.id)

                # 相册创建时间更改为xxxx-xx-xx形式
                match = re.search('(\d{4}\-\d\d\-\d\d).*', tmpDt['createTime'])
                if match:
                    tmpDt['createTime'] = match.group(1)

                if row.photos:
                    tmpDt['photos_count'] = len(row.photos)
                    # 默认最后一张作为封面(使用缩略图)
                    tmpDt['cover_photo_path'] = row.photos[-1].compressFileStatic
                    for photo in row.photos:
                        if photo.is_conver_photo:
                            tmpDt['cover_photo_path'] = photo.compressFileStatic

                    # 将本地磁盘地址转换为 "/static/xxx/css/xxx.img"
                    if tmpDt['cover_photo_path']:
                        tmpDt['cover_photo_path'] = self.local_dir_translate_http_dir(
                            tmpDt['cover_photo_path'], row.id)

                albumList.append(tmpDt)

        return albumList

    def create_album(self, albumName, albumDesc=None):
        """
        创建相册
        1，查看相册名字是否已存在
        2, 提交返回相册ID
        """

        if not albumName:
            raise MyException("相册名字不能为空")

        albumName = albumName.strip()

        if albumDesc:
            albumDesc = albumDesc.strip()

        if len(albumName) > 30:
            raise MyException("相册名称不能超过30个字符,中文占3个字符")

        if len(albumDesc) > 45:
            raise MyException("相册名称不能超过45个字符,中文占3个字符")

        albumId = db.session.query(AlbumModel.id).filter(
            AlbumModel.albumName == albumName).filter(AlbumModel.username == self.username).first()
        if albumId:
            raise MyException("相册名字已存在,请检查")

        obj = AlbumModel(
            **{"albumName": albumName, "desc": albumDesc, "username": self.username, "createTime": MyTime.timestamp_datetime()})
        db.session.add(obj)
        try:
            db.session.commit()
        except Exception, e:
            App.logger.error(e)
            db.session.rollback()
            raise MyException("创建相册失败!")
        return obj.id

    def update_album(self, albumId, albumName, albumDesc=None):
        """
        创建相册
        1，查看相册名字是否已存在
        2, 提交返回相册ID
        """
        if not albumName or not albumId:
            raise MyException("相册名字不能为空!")

        albumName = albumName.strip()

        if albumDesc:
            albumDesc = albumDesc.strip()

        if len(albumName) > 30:
            raise MyException("相册名称不能超过30个字符,中文占3个字符")
        if len(albumDesc) > 45:
            raise MyException("相册描述不能超过45个字符,中文占3个字符")

        albumObj = db.session.query(AlbumModel).filter(
            AlbumModel.id == albumId).filter(AlbumModel.username == self.username).scalar()
        if not albumObj:
            raise MyException("相册不存在!")

        db.session.query(AlbumModel).filter(AlbumModel.id == albumId).update({
            AlbumModel.albumName: albumName,
            AlbumModel.desc: albumDesc
        })

        # 判断相册名字是否存在
        albumNameObjAry = db.session.query(AlbumModel).filter(
            AlbumModel.albumName == albumName).filter(AlbumModel.username == self.username).all()
        if len(albumNameObjAry) > 1:
            raise MyException("相册名字不能相同!")

        try:
            db.session.commit()
        except Exception, e:
            App.logger.error(e)
            db.session.rollback()
            raise MyException("修改相册失败!")

        return True

    def delete_album_by_id_ary(self, albumIdAry=[]):
        """
        删除相册
        """

        readyMoveDirDt = {}

        if not albumIdAry or type(albumIdAry) != list:
            raise MyException('请选中相册进行操作!')

        for id in albumIdAry:

            albumObj = db.session.query(AlbumModel).filter(AlbumModel.id == id).filter(
                AlbumModel.username == self.username).first()
            if not albumObj:
                App.logger.error(
                    "username:[{}], albumid:[{}] not find??".format(self.username, id))
                raise MyException("相册不存在?")

            db.session.query(PhotoModel).filter(
                PhotoModel.album_id == id).delete()
            db.session.query(AlbumModel).filter(AlbumModel.id == id).delete()
            App.logger.info(
                "{} delete album id is:{}".format(self.username, id))

            # 将相册地址进行备份
            readyMoveDirDt[str(albumObj.id)] = 1

        try:
            db.session.commit()
            make_dir(self.albumBackupDir)
            for albumId, val in readyMoveDirDt.iteritems():
                try:
                    albumDirStatic = "{}{}/{}/".format(App.config['GALLERY_CONFIG'][
                                                       'imageUpladCommonDir'], self.username, albumId)
                    move(albumDirStatic, self.albumBackupDir)
                except Exception, e:
                    App.logger.error(e)

        except Exception, e:
            App.logger.error(e)
            db.session.rollback()
            return False
        return True

    def upload_album(self, fileAry=[], fileHandle=None, albumId=None):
        """
        上传相片(上传的必须是图片格式，<100M)
        1， 判断文件格式是不是正确;
        2,  保存到本地
        2， 生成缩略图
        3， 保存相关数据DB
        """

        # 后缀不区分大小写
        excludeFileType = ['gif', 'jpg', 'jpeg', 'bmp', 'png']
        fileTypeValid = False

        # 记录文件的上传情况
        ret = {}

        if not fileHandle or not albumId:
            raise MyException("fileHandle/albumId param is imvalid!")

        if not fileAry or (type(fileAry)) != list:
            raise MyException("fileAry:[{}] is imvalid!".format(fileAry))
        albumObj = db.session.query(AlbumModel).filter(
            AlbumModel.id == albumId).filter(AlbumModel.username == self.username).first()
        if not albumObj:
            raise MyException("albumId is not imvalid!")

        # 保存的路径(/static/uploadImg/username/albumIdMd5/filemd5Unixtime)
        uploadCommonDir = "{}{}/{}".format(App.config['GALLERY_CONFIG'][
            'imageUpladCommonDir'], self.username, albumObj.id)

        for filename in fileAry:

            photoDt = {}

            # 过滤文件(暂时不用避免过滤中文文件)
            # filename = secure_filename(filename)

            if len(filename) > 100:
                App.logger.warn(" albumid:{} username:{} filename:{} 文件名过长!".format(
                    albumId, self.username, filename))
                raise MyException("{}文件名过长!".format(filename))

            # 根据原来的文件名判断是否需要上传
            repeatPhoto = db.session.query(PhotoModel).join(AlbumModel)\
                .filter(PhotoModel.album_id == albumId)\
                .filter(AlbumModel.username == self.username)\
                .filter(PhotoModel.photoName == filename).first()

            if repeatPhoto:
                uploadFileSize = len(fileHandle.read())
                saveFileSize = os.stat(repeatPhoto.nativeFileStatic).st_size
                # 如果文件名相等并且大小一样，则认为重复上传
                if uploadFileSize == saveFileSize:
                    App.logger.info("username:[{}] photoName:[{}] albumId:[{}] 经判断重复上传,跳过!".format(
                        self.username, filename, albumId))
                    raise MyException("{}重复上传!".format(filename))

            try:
                prefix, suffix = os.path.splitext(filename)
            except Exception, e:
                App.logger.error(e)
                return MyException("{}文件名不规范!".format(filename))
            prefixDes = "{}{}".format(
                self.aesObj.encrypt(prefix), int(time.time()))

            # 后缀判断
            for fileType in excludeFileType:
                if re.search('\.{}$'.format(fileType), filename, re.I):
                    print filename
                    fileTypeValid = True
            if fileTypeValid is False:
                raise MyException("{}格式不在[{}]里面!".format(
                    filename, ' '.join(excludeFileType)))

            # 加密后的文件名字
            filenameDes = "{}{}".format(prefixDes, suffix)
            filenameStatic = "{}/{}".format(uploadCommonDir, filenameDes)

            # 文件保存
            make_dir(uploadCommonDir)
            fileHandle.save(filenameStatic)

            if os.stat(filenameStatic).st_size / 1000000 > 100:
                App.logger.info("username:[{}] filename:[{}] size > 100M !".format(
                    self.username, filenameStatic))
                raise MyException("{}大于100M!".format(filename))

            compressFileStatic = self.generate_compress_photo_path_to_save(
                filenameStatic, filename=filename)
            hdFileStatic = self.generate_compress_photo_path_to_save(
                filenameStatic, filename=filename, hdCompress=True)
            if not compressFileStatic:
                return False

            photoDt['photoName'] = filename
            photoDt['nativeFileStatic'] = filenameStatic
            photoDt['album_id'] = int(albumId)
            photoDt['compressFileStatic'] = compressFileStatic
            photoDt['hdFileStatic'] = hdFileStatic
            photoDt['createTime'] = MyTime.timestamp_datetime()

            db.session.add(PhotoModel(**photoDt))
        try:
            db.session.commit()
        except Exception, e:
            App.logger.error(e)
            db.session.rollback()
            raise MyException("{}上传失败!".format(filename))

        return True
