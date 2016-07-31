requirejs.config({
   	urlArgs: "t=" + (new Date()).getTime(),
   	paths: {
        "load": "loader/loader"            
    },
    waitSeconds: 0
});
define(["load"], function(loader){
	var albumId = SQ.getParam( "albumId" ),
        $pictureContent = $( ".picture-content" ),
        $albumNull = $( ".album-null" );
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

	var $rgGallery = $( ".rg-gallery-wrap" );
	var app = {
		init: function ( data ) {
			this.data = data;	
			//this._prevLoad( data ); // 预加载缩列图;
		},
		_init: function () {
			this.evt();
			this.destroy();
		},
		// 获取相册的照片;
		initData: function () {
            var ts = this;
            $.ajax({
                url: "/photo/get_photos_by_album_id",
                type: "POST",
                dataType: "json",
                data: {albumId: albumId}
            }).done(function(data) {
                if ( data.success ) {
                    
                    var arr = data.data || [],
                        len = arr.length;

                    if ( !len ) {
                    	$rgGallery.find( ".close" ).trigger( "click" ); // 销毁预览;
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
                        // 创建预览;
                        var index = ts.gallery.current;
                        ts.gallery.destroy();
                        ts.gallery = new Gallery({
							$container: $("#gallery-show-area"),
							data: arr_view,
							current: index+1 >= len ? 0 : index
						});
                    }
                }
            });   
        },
		evt: function () {
			var ts = this;			
			$( ".mod-photo-list-small" ).on( "click", ".item-cover", function(e) {
				e.preventDefault();
				//$rgGallery.css("height",$(window).height()).show();
				$rgGallery.show();
				ts.gallery = new Gallery({
					$container: $("#gallery-show-area"),
					data: ts.data,
					current: $(this).closest(".photo-item").index()
				});
			});

			// 删除;
			$rgGallery.on( "click", ".delete", function(e) {
				e.preventDefault();
				var $ts = $(this);
	            iconfirm( "确定要删除当前的图片？",function (d) {
	                $.ajax({
	                    url: "/photo/delete_photo_by_id_ary",
	                    dataType: "json",
	                    type: "POST",
	                    data: {photoIdAry: [$ts.attr("data-id")]}
	                }).done(function (data) {
	                    if ( data.success ) {                   	
	                        ts.initData(); 
	                        d.destroy();    
	                    }
	                });
	            }); 
			});
		},
		destroy: function () {
			var ts = this;
			$rgGallery.on( "click", ".close", function(e) {
				e.preventDefault();
				$rgGallery.hide();
				ts.gallery.destroy();
			});
		},
		// 预加载缩列图;
		_prevLoad: function ( arr ) {
			var loadFn = loader.loader;
    		var loading = loadFn( "正在加载数据..." ).show();

			var len = arr.length,
				j = 0;
			for ( var i = 0, len = arr.length; i < len; i++ ) {
				(function (i) {
					var img = new Image();
					img.onload = function () {
						j++;
						if ( j >= len ) {
							loading.hide(); // 隐藏加载提示;
						}
					};
					img.src = arr[ i ].thumb;
				})(i);
			}
		}
	};
	app._init();
	return {
		init: function (data) {
			app.init( data );
		}
	};
});