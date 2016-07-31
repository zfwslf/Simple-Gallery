requirejs.config({
    paths: {
        "mod-create": "mod/create",
        "mod-upfile": "mod/upfile",
        "login": "login/login",
        "load": "loader/loader"
    }, 
      
    urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(["mod-create", "mod-upfile", "login", "load"],function(modCmreate, upfile, login, loader){	
    var option_tpl = '<option value="{$value}">{$name}</option>';
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
	
    var $albumContent = $( "#albumContent" ),
        $albumNull = $( "#albumNull" ),
        ceilTpl = $( "#ceilTpl" ).html();

    var app = {
        init: function () {
            var ts = this;
            this.setData();
            this.initList();
            this.evt();
            modCmreate.create(function () {
                // 创建相册成功后，刷新相册列表;
                ts.initList();
            });
            modCmreate.edit(function () {
                // 编辑相册成功后，刷新相册列表;
                ts.initList();
            });
        },
        setData: function () {
            var ts = this;
            this.upfile = upfile({
                upSuccessFn: function () {
                    // 图片上传成功的回调;
                    ts.initList();
                }
            });
        },
        // 初始化相册列表;
        initList: function () {
            var ts = this;
            $.ajax({
                url: "/album/get_album_list",
                dataType: "json",
                type: "POST"
            }).done(function(data) {
                if ( !data.success ) return alert( data.message );
                // 设置用户名;
                login.getuserinfor( data.username );
                var arr = data.data || [],
                    i = 0,
                    len = arr.length,
                    option = '';

                var tpl_data = [];
                for ( ; i < len; i++ ) {
                    if ( !arr[i].cover_photo_path ) {
                        arr[i].cover_photo_path = "/static/css/images/cover_bg.png"; // 默认封面图;
                    }
                    tpl_data.push({
                        value: arr[i].id,
                        name: arr[i].albumName
                    });
                    //option += '<option value="'+ arr[i].id +'">'+ arr[i].albumName +'</option>';
                }
                option = SQ.T( option_tpl, tpl_data );

                var $upfilePop = $( ".js-upfile-pop" );
                if ( len ) {
                    // 设置相册不为空的标识;
                    $upfilePop.attr( "data-album", "true" );
                    
                    $albumNull.hide();
                    $albumContent.show().html( SQ.T(ceilTpl, arr) );
                    
                } else {
                    $upfilePop.removeAttr( "data-album" );
                    $albumContent.hide();
                    $albumNull.show();
                }   
   
                // 设置相册select选项;
                ts.upfile.setAlbumSelect( option );             
            }).always(function () {
                loading.hide(); // 隐藏加载提示;
            });            
        },
        evt: function () {
            var ts = this;
            $albumContent.on( "mouseenter", ".album-list", function() {
                $( this ).addClass( "li-hover" );
            }).on( "mouseleave", ".album-list", function() {
                $( this ).removeClass( "li-hover" );
            // 删除;
            }).on( "click", ".delete", function(e) {
                e.preventDefault();
                var $ts = $(this);
                iconfirm( "确定要删除当前相册？", function (d) {
                    $.ajax({
                        url: "/album/delete",  
                        dataType: "json",
                        type: "POST",
                        data: {albumIdAry: [$ts.attr("data-id")]}
                    }).done(function(data) {
                        if ( data.success ) {
                            // 刷新相册列表;
                            ts.initList();
                            d.destroy();
                        } else {
                            data.message && alert( data.message );
                        }
                    });  
                });
            });
        }
    };
    app.init();

});