requirejs.config({
	 paths: {
	 	"mod-create": "mod/create", 
        "mod-picview": "mod/picview",
        "mod-upfile": "mod/upfile",
        "login": "login/login",
        "load": "loader/loader"            
    },
   	urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(["mod-create", "login", "mod-picview", "mod-upfile", "load"],function(modCmreate, login, picview, upfile, loader){
    var option_tpl = '<option value="{$value}" {$selected} >{$name}</option>';
    // tip;
    var loadFn = loader.loader;
    var loading = loadFn( "正在加载数据..." ).show();

    var iconfirm = function (msg,sureFn) {
        return new SQ.hdDialog({
            content: '<div class="confirm-tip"><p>' +msg+ '</p></div>',
            button: [
                {txt: "确定", callback: function (e,d) {
                    sureFn(d);
                }},
                {txt: "取消", callback:function (e,d) {
                    d.destroy();
                }}
            ]
        }).show();
    };

    var albumId = SQ.getParam( "albumId" ),
        $pictureContent = $( ".picture-content" ),
        $albumNull = $( ".album-null" );
    var app = {
        init: function () {
            var ts = this;
            this.setData();
            this.links();
            this.initData();
            this.initAlbum();
            modCmreate.create(function () {
                
                if ( $(".create-album-btn", "#create-album-form").hasClass("js-reflash") ) {
                    window.location = "/"; // 创建相册后,直接跳回到相册列表;
                }
                // 成功创建相册后;
                ts.initAlbum();
            });
            this.evt();

        },
        setData: function () {
            var ts = this;
            this.upfile = upfile({
                upSuccessFn: function () {
                    // 上传成功的回调;
                    ts.initData();
                }
            });
        },
        links: function () {
            var $box = $( "#links-box" );
            $box.find( ".download" ).attr( "href", "/photo/download/index?albumId="+albumId );
            $box.find( ".delete" ).attr( "href", "/photo/delete/index?albumId="+albumId );            
            $box.find( ".reflash" ).attr( "href", "/photo/index?albumId="+albumId );            
        },
        // 相册列表;
        initAlbum: function () {
            var ts = this;
            $.ajax({
                url: "/album/get_album_list",
                dataType: "json",
                type: "POST"
            }).done(function(data) {
                if ( !data.success ) {
                    return alert( data.message );
                }

                var arr = data.data || [],
                    i = 0,
                    len = arr.length,
                    option = '';

                var $upfilePop = $( ".js-upfile-pop" );
                if ( len ) {
                    // 设置相册不为空的标识;
                    $upfilePop.attr( "data-album", "true" );
                } else {                    
                    $upfilePop.removeAttr( "data-album" );
                }

                var tpl_data = [];
                for ( ; i < len; i++ ) {
                    var obj = {};
                    if ( arr[i].id == albumId ) {
                        obj = {
                            selected: 'selected="true"',
                            value: arr[i].id,
                            name: arr[i].albumName
                        };
                        // option += '<option selected="true" value="'+ arr[i].id +'">'+ arr[i].albumName +'</option>';
                        
                    } else {
                        obj = {
                            selected: '',
                            value: arr[i].id,
                            name: arr[i].albumName
                        };
                        // option += '<option value="'+ arr[i].id +'">'+ arr[i].albumName +'</option>';
                    }
                    tpl_data.push(obj);
                }
                option = SQ.T( option_tpl, tpl_data );
                // 设置相册select选项;
                ts.upfile.setAlbumSelect( option ); 
            });
        },
        // 图片列表;
        initData: function () {
            var ts = this;
            $.ajax({
                url: "/photo/get_photos_by_album_id",
                type: "POST",
                dataType: "json",
                data: {albumId: albumId}
            }).done(function(data) {
                if ( data.success ) {
                    // 设置用户名;
                    login.getuserinfor( data.username );
                    var arr = data.data || [],
                        len = arr.length;
                    
                    if ( !len ) {
                        $albumNull.show();
                        $pictureContent.hide();
                    } else {
                        $albumNull.hide();                    
                        // 相册信息;
                        $( "#albumInfor" ).html( SQ.T( $("#albumInfor-tpl").html(), {name: data.albumName, num: len, desc: data.albumDesc}) );
                        $pictureContent.show().find( ".mod-photo-list-small" )
                        .html( SQ.T($("#photoItem-tpl").html(), arr ) );

                        $( "img", $pictureContent ).lazyload({effect: "fadeIn"});
                        

                        var arr_view = [];
                        for ( var i = 0; i<len; i++ ) {
                            var obj = {
                                thumb: arr[i].compressFileStatic, // 缩略图;
                                large: arr[i].hdFileStatic,   // 大图链接;
                                id: arr[i].photoId, // 图片id;
                                dlLink: "/photo/download_photo_by_id_ary?photoIdAry="+arr[i].photoId, // 下载链接;
                                desc: (i+1)+"/"+len // 描述;
                            };
                            arr_view.push( obj );
                        }
                        // 初始化图片展示;
                        picview.init( arr_view );
                    }
                } else {
                    // 如果当前相册id不存在，则跳回首页;
                    window.location = "/";
                }
            }).always(function() {
                loading.hide(); // 隐藏加载提示;
            });   
        },

        evt: function () {
            var ts = this;
            $( ".mod-photo-list-small" ).on( "mouseenter", ".photo-item", function() {
                $( this ).addClass( "photo-item-hover" );
            }).on( "mouseleave", ".photo-item", function() {
                $( this ).removeClass( "photo-item-hover" );
                $( this ).find( ".photo-op-list" ).hide();
            }).on( "click", ".setting .set-btn", function(e) {
                e.preventDefault();
                $( this ).closest( ".setting" ).find( ".photo-op-list" ).show();
            })
            // 设置封面;
            .on( "click", ".setting .js-cr", function(e) {
                e.preventDefault();
                $( this ).closest( ".photo-item" ).blur();
                ts.setCr( $(this).attr("data-id") );
            })
            // 删除;
            .on( "click", ".setting .js-de", function(e) {
                e.preventDefault();
                $( this ).closest( ".photo-item" ).blur();
                ts.de( $(this).attr("data-id") );
            });
        },
        // 设置封面;
        setCr: function ( id ) {
            var $dialog = $( "#setCoverPop" );
            $.ajax({
                url: "/photo/set_photo_cover_by_id",
                type: "POST",
                dataType: "json",
                data: {photoId: id}
            }).done(function(data) {
                if ( data.success ) {
                    $dialog.show();
                    setTimeout(function () {
                        $dialog.hide();
                    },1000);
                } else {
                    data.message && alert( data.message );
                }
            });
        },
        // 删除;
        de: function ( id ) {
            var ts = this;
            iconfirm( "确定要删除当前的图片？",function (d) {
                $.ajax({
                    url: "/photo/delete_photo_by_id_ary",
                    dataType: "json",
                    type: "POST",
                    data: {photoIdAry: [id]}
                }).done(function (data) {
                    if ( data.success ) {
                        ts.initData();
                        d.destroy();
                    }
                });
            }); 
        }
    };
    app.init();

});