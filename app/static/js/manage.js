requirejs.config({
	 paths: {
        "login": "login/login",
        "load": "loader/loader"  
    },
   	urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(["login", "load"], function(login, loader) {
    // tip;
    var loadFn = loader.loader;
    var loading = loadFn( "正在加载数据..." ).show();
    
	var albumId = SQ.getParam( "albumId" ),
        $pictureContent = $( ".picture-content" );

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
    var $downLoad = $( "#downLoad" ),
        $selectNum = $( "#selectNum" ),
        // 下载url;
        dl_root = "/photo/download_photo_by_id_ary?photoIdAry=";

	var app = {
		init: function () {
			this.initData();
            this.evt();
            this.selectAll();
            this.downLoad();
            this._delete();
		},
        // 初始化 / 更新图片列表;
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
                        $pictureContent.hide();  
                        $( ".delete-null" ).show();                     
                        return;
                    } 
                    // 相册信息;
                    $( "#albumInfor" ).html( SQ.T( $("#albumInfor-tpl").html(), {url: "/photo/index?albumId="+albumId,name: data.albumName, num: len, desc: data.albumDesc}) );
                    $pictureContent.show().find( ".mod-photo-list-small" )
                    .html( SQ.T($("#photoItem-tpl").html(), arr ) );  

                    $( "img", ".mod-photo-list-small" ).lazyload({effect: "fadeIn"});

                    ts.itemLength = len; // 有多少张图片;                 
                } else {
                    // 如果当前相册id不存在，则跳回首页;
                    window.location = "/";
                }
            }).always(function () {
                loading.hide(); // 隐藏加载提示;
            });   
        },
        evt: function () {
            var ts = this,
                $input = $( "#select-all" ).find( "input" );
            ts.formData = {};
            $pictureContent.on( "click", ".photo-item", function(e) {
                e.preventDefault();
                var $ts = $( this ),
                    index = $ts.index();
                $ts.toggleClass( "p-click-li" );
                if ( $ts.hasClass("p-click-li") ) {
                    ts.formData[ index ] = $ts.attr( "data-id" );
                    if ( ts.itemLength === $pictureContent.find(".p-click-li").length ) {
                        // 选中全选
                        $input.prop( "checked", true );
                    }
                } else {
                    $input.prop( "checked", false );
                    ts.formData[ index ] = null;
                }
                // 设置下载链接;
                ts.setUrl( ts.formData );
                $selectNum.html( $pictureContent.find(".p-click-li").length );
            }).on( "mouseenter", ".photo-item", function() {
                $( this ).addClass( "p-hover-li" );
            }).on( "mouseleave", ".photo-item", function() {
                $( this ).removeClass( "p-hover-li" );
            });

        },
        // 全选;
        selectAll: function () {
            var ts = this;
            $( "#select-all" ).on( "click", "input", function() {
                $item = $pictureContent.find( ".photo-item" );
                if ( $(this).prop("checked") ) {
                    $item.addClass( "p-click-li" ).each(function(index, el) {
                        ts.formData[ index ] = $(this).attr( "data-id" );
                    });
                } else {
                    ts.formData = {};
                    $item.removeClass( "p-click-li" );
                }
                // 设置下载链接;
                ts.setUrl( ts.formData );
                $selectNum.html( $pictureContent.find(".p-click-li").length );
            });
        },
        // 设置下载链接;
        setUrl: function (obj) {
            var arr = [];
            for ( var k in obj ) {
                obj[k] && arr.push( obj[k] );
            }
            $downLoad.attr( "href", dl_root+ arr );
        },

        downLoad: function () {
            var ts = this;
            $downLoad.on( "click", function(e) { 
                if ( !$pictureContent.find(".p-click-li").length ) {
                    e.preventDefault();
                    return alert( "请选择要下载的相片" );
                }
                
            });
        },
        // 删除照片;
        _delete: function () {
            var ts = this;
            $( "#deleteBtn" ).on( "click", function(e) {
                e.preventDefault();
                if ( !$pictureContent.find(".p-click-li").length ) {
                    return alert( "请选择要删除的相片" );
                }

                iconfirm("确定要删除选中的图片？",function (d) {
                    var arr = [];
                    for ( var k in ts.formData ) {
                        ts.formData[k] && arr.push( ts.formData[k] );
                    }
                    var d_loading = loadFn( "正在删除..." ).show();
                    d.destroy();
                    $.ajax({
                        url: "/photo/delete_photo_by_id_ary",
                        dataType: "json",
                        type: "POST",
                        data: {photoIdAry: arr}
                    }).done(function (data) {
                        if ( data.success ) {
                            ts.initData();
                            $selectNum.html( 0 );
                            ts.formData = {}; // 清空id对象;
                            loadFn( "删除成功" ).show().fadeOut( 800 );
                        } else {
                            loadFn( "删除失败" ).show().fadeOut( 800 );
                        }
                    }).always(function() {
                        d_loading.hide();
                    });
                });             

            });
        }
	};
	app.init();
});