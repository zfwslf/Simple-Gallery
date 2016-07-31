requirejs.config({
	paths: {
        "mod-create": "mod/create"       
    },
   	urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(["mod-create"], function (modCmreate) {
	var $win = $( window );
	return function (opts) {
		var app = {
			init: function () {
				this.evt();
			},
			evt: function () {
				var ts = this;
				$( document ).on( "click", ".js-upfile-pop", function(e) {
					if ( !$(this).attr("data-album") ) {
						// 如果相册为空; 属性data-album在album.js pic.js 里设置;
						return alert( "请先创建相册" );
					}
					e.preventDefault();
					ts.insertDialog();
				});
				
			},
			// 设置相册下拉列表;
			setAlbumSelect: function (option) {
				var ts = this;
				ts.option = option;
				if ( ts.$select ) {
					ts.$select.html( option );
				} 
			},
			_destroy: function () {
				var ts = this;
				ts.$dialogTpl.off();
				ts.$dialogTpl.remove();
				// 销毁图片上传实例;
				ts.uploader && ts.uploader.destroy();
			},
			_setAgain: function () {
				var ts = this;
				ts.$dialogTpl.off();
				// 销毁图片上传实例;
				ts.uploader && ts.uploader.destroy();
				ts.initUpload();

			},
			insertDialog: function () {
				var ts = this;
				ts.$dialogTpl = $( $("#upload-dialog-tpl").html() );
				ts.$sqdialog = ts.$dialogTpl.find( ".sq-dialog" );
				ts.$select = ts.$dialogTpl.find( ".album-select" ).html( ts.option || "" );
				ts.before_html = ts.$dialogTpl.find( "#before-uploader" ).html();
				$( "body" ).append( ts.$dialogTpl );

				ts.upfileDialogEvt();

				ts.initUpload();
					    
			},
			// 设置上传弹窗样式;
			setCss: function () {
				var w = $win.width(),
					cw = w,
					h = $win.height(),
					ch = h-100;
				if ( w > 800 ) {
					cw = 800;
				}
				if ( h > 500 ) {
					ch = 400;
				} 

				this.$sqdialog.find( ".queueList" ).height( ch );
				$( "#success-uploader" ).height( ch );
				this.$sqdialog.css({
					width: cw,
					marginLeft: -cw/2, marginTop: -this.$sqdialog.height()/2
				});
			},

			upfileDialogEvt: function () {
				var ts = this;
				// dialog;
				ts.$dialogTpl.on( "click", ".sq-dialog-close", function(e) {
					e.preventDefault();
					ts._destroy();
				}).on( "change", ".album-select", function() {
					ts.albumId = $( this ).val();
				});
			},
			// 初始化上传;
			initUpload: function () {
				var ts = this;
				this.setCss();
			    var $wrap = $( "#uploader" ),
			    	$before = $( "#before-uploader" ),

			    	$success = $( "#success-uploader" ), // 成功上传图片容器;

			        // 图片容器
			        $queue = $( '<ul class="filelist"></ul>' ).appendTo( $wrap.find(".queueList") ),

			        // 状态栏，包括进度和控制按钮
			        $statusBar = $wrap.find( ".statusBar" ),

			        // 文件总体选择信息。
			        $info = $statusBar.find( ".info" ),

			        // 上传按钮
			        $upload = $wrap.find( ".uploadBtn" ),

			        // 没选择文件之前的内容。
			        $placeHolder = $wrap.find( ".placeholder" ),

			        // 总体进度条
			        $progress = $statusBar.find( ".progress" ).hide(),

			        // 添加的文件数量
			        fileCount = 0,

			        // 添加的文件总大小
			        fileSize = 0,

			        // 优化retina, 在retina下这个值是2
			        ratio = window.devicePixelRatio || 1,

			        // 缩略图大小
			        thumbnailWidth = 110 * ratio,
			        thumbnailHeight = 110 * ratio,

			        // 可能有pedding, ready, uploading, confirm, done.
			        state = "pedding",

			        // 所有文件的进度信息，key为file id
			        percentages = {},

			        // WebUploader实例
			        uploader,
			        up_error_txt = ""; // 上传错误提示;

			    if ( !WebUploader.Uploader.support() ) {
			        alert( 'Web Uploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器');
			        throw new Error( 'WebUploader does not support the browser you are using.' );
			    }

			    // 实例化
			    uploader = this.uploader = WebUploader.create({
			        pick: {
			            id: "#filePicker",
			            label: "点击选择图片"
			        },
			        chunked: true,
			       	chunkSize: 100 * 1024 * 1024,
			        compress: false, // 不压缩
			        dnd: "#uploader .queueList",
			        paste: document.body,
			        duplicate: true, // 去重复;
			        accept: {
			            title: "Images",
			            extensions: "gif,jpg,jpeg,bmp,png",
			            mimeTypes: "image/*"
			        },
			        formData: {albumId: $(".album-select").val()}, // 相册id;
			        // swf文件路径
			        swf: "/static/js/webuploader/Uploader.swf",

			        // runtimeOrder: "flash",
			        
			        disableGlobalDnd: true,

			        chunked: true,        
			        server: "/album/upload", // 上传服务器接口;
			        fileNumLimit: 300,
			        fileSizeLimit: 3000 * 1024 * 1024,    // 3000 M
			        fileSingleSizeLimit: 100 * 1024 * 1024    // 100 M
			    });

			    // 添加“添加文件”的按钮，
			    uploader.addButton({
			        id: "#filePicker2",
			        label: "继续添加"
			    });

			    // 当有文件添加进来时执行，负责view的创建
			    function addFile( file ) {
			    	var name = file.name;
			    	// 	ext = name.substring( name.lastIndexOf(".")+1 ),
			    	// 	r = name.substring( 0, name.lastIndexOf(".") );
			    	// name = (r.length > 10 ? r.substring(0, 10) : r) + "." + ext;
			        var $li = $( '<li id="' + file.id + '">' +
			                '<p class="title">' + name + '</p>' +
			                '<p class="imgWrap"></p>'+
			                '<p class="progress"><span></span></p>' +
			                '</li>' ),

			            $btns = $('<div class="file-panel">' +
			                '<span class="cancel">删除</span>').appendTo( $li ),
			            $prgress = $li.find('p.progress span'),
			            $wrap = $li.find( 'p.imgWrap' ),
			            $info = $('<p class="error"></p>'),

			            showError = function( code ) {
			                switch( code ) {
			                    case 'exceed_size':
			                        text = '文件大小超出';
			                        break;

			                    case 'interrupt':
			                        text = '上传暂停';
			                        break;

			                    default:
			                        text = '上传失败，请重试';
			                        break;
			                }

			                $info.text( text ).appendTo( $li );
			            };

			        if ( file.getStatus() === 'invalid' ) {
			            showError( file.statusText );
			        } else {
			            // @todo lazyload
			            $wrap.text( '预览中' );
			            uploader.makeThumb( file, function( error, src ) {
			                if ( error ) {
			                    $wrap.text( '不能预览' );
			                    return;
			                }

			                var img = $('<img src="'+src+'">');
			                $wrap.empty().append( img );
			            }, thumbnailWidth, thumbnailHeight );

			            percentages[ file.id ] = [ file.size, 0 ];
			            file.rotation = 0;
			        }
			        // 文件状态变化;
			        file.on('statuschange', function( cur, prev ) {
			            if ( prev === 'progress' ) {
			                $prgress.hide().width(0);
			            } else if ( prev === 'queued' ) {
			                $li.off( 'mouseenter mouseleave' );
			                $btns.remove();
			            }

			            // 成功
			            if ( cur === 'error' || cur === 'invalid' ) {
			                //console.log( file.statusText );
			                showError( file.statusText );
			                percentages[ file.id ][ 1 ] = 1;
			            } else if ( cur === 'interrupt' ) {
			                showError( 'interrupt' );
			            } else if ( cur === 'queued' ) {
			                percentages[ file.id ][ 1 ] = 0;
			            } else if ( cur === 'progress' ) {
			                $info.remove();
			                $prgress.css('display', 'block');
			            } else if ( cur === 'complete' ) {
			                $li.append( '<span class="success"></span>' );
			            }

			            $li.removeClass( 'state-' + prev ).addClass( 'state-' + cur );
			        });

			        $li.on( 'mouseenter', function() {
			            $btns.show();
			        });

			        $li.on( 'mouseleave', function() {
			            $btns.hide();
			        });

			        $btns.on( "click", "span", function() {
			            uploader.removeFile( file );
			        });

			        $li.appendTo( $queue );
			    }

			    // 负责view的销毁
			    function removeFile( file ) {
			        var $li = $( "#"+file.id );

			        delete percentages[ file.id ];
			        updateTotalProgress();
			        $li.off().find( ".file-panel" ).off().end().remove();
			    }

			    function updateTotalProgress() {
			        var loaded = 0,
			            total = 0,
			            spans = $progress.children(),
			            percent;

			        $.each( percentages, function( k, v ) {
			            total += v[ 0 ];
			            loaded += v[ 0 ] * v[ 1 ];
			        } );

			        percent = total ? loaded / total : 0;

			        spans.eq( 0 ).text( Math.round( percent * 100 ) + '%' );
			        spans.eq( 1 ).css( 'width', Math.round( percent * 100 ) + '%' );
			        updateStatus();
			    }

			    function updateStatus() {
			        var text = '', stats, cn = "";

			        if ( state === 'ready' ) {
			            text = '选中' + fileCount + '张图片，共' +
			                    WebUploader.formatSize( fileSize ) + '。';
			        } else if ( state === 'confirm' ) {
			            stats = uploader.getStats();
			            if ( stats.uploadFailNum ) {
			            	var cn = "hasFailed";
			            	text = '<p class="f-l">有<span>' + stats.uploadFailNum + '</span>张上传失败</p>'+
			            		'<p class="retry-btn"><a class="ignore" href="/">取消并查看相册</a><a class="retry" href="#">重新上传</a></p>';
			                // text = '已成功上传' + stats.successNum+ '张照片至相册，'+
			                //     stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
			            	new SQ.hdDialog({
								title: "图片上传错误信息提示",
								content: '<div class="up-error-wrap">'+up_error_txt+'</div>'
							}).show();
							up_error_txt = "";
			            }

			        } else {
			            stats = uploader.getStats(); // 获取文件统计信息;
			            /* 	successNum 上传成功的文件数
							progressNum 上传中的文件数
							cancelNum 被删除的文件数
							invalidNum 无效的文件数
							uploadFailNum 上传失败的文件数
							queueNum 还在队列中的文件数
							interruptNum 被暂停的文件数
						*/
			            text = '共' + fileCount + '张（' +
			                    WebUploader.formatSize( fileSize )  +
			                    '），已上传' + stats.successNum + '张';

			            if ( stats.uploadFailNum ) {
			                text += '，失败' + stats.uploadFailNum + '张';			    
			            }
			        }

			        $info.addClass( cn ).html( text );
			    }

			    function setState( val ) {
			        var file, stats;

			        if ( val === state ) {
			            return;
			        }

			        $upload.removeClass( 'state-' + state );
			        $upload.addClass( 'state-' + val );
			        state = val;

			        switch ( state ) {
			            case 'pedding':
			                $placeHolder.removeClass( 'element-invisible' );
			                $queue.parent().removeClass('filled');
			                $queue.hide();
			                $statusBar.addClass( 'element-invisible' );
			                uploader.refresh();
			                break;

			            case 'ready':
			                $placeHolder.addClass( 'element-invisible' );
			                $( '#filePicker2' ).removeClass( 'element-invisible');
			                $queue.parent().addClass('filled');
			                $queue.show();
			                $statusBar.removeClass('element-invisible');
			                uploader.refresh();
			                break;

			            case 'uploading':
			                $( '#filePicker2' ).addClass( 'element-invisible' );
			                $progress.show();
			                $upload.text( '暂停上传' );
			                break;

			            case 'paused':
			                $progress.show();
			                $upload.text( '继续上传' );
			                break;

			            case 'confirm':
			                $progress.hide();
			                $upload.text( '开始上传' ).addClass( 'disabled' ).hide();

			                stats = uploader.getStats();
			                if ( stats.successNum && !stats.uploadFailNum ) {
			                    setState( 'finish' );
			                    return;
			                }
			                break;
			            case 'finish':
			                stats = uploader.getStats();
			                if ( stats.successNum ) {
			                	// 所有图片都上传成功;
			                	successAll( stats.successNum );
			                } else {
			                    // 没有成功的图片，重设
			                    state = 'done';
			                    //location.reload();
			                }
			                break;
			        }

			        updateStatus();
			    }
			    // 所有图片都上传成功;
			    var successAll = function ( num ) {
			    	$( "#before-uploader" ).hide();
			        $success.show().find( ".num" ).html( num );
			        var id = $( ".album-select" ).val();
			        // 设置查看相册的链接;
			        $success.find( ".check-photo" ).attr( "href", "/photo/index?albumId="+id );
			        opts.upSuccessFn();
			    }
			    
			    // 每个文件上传到服务端响应后,触发事件;
			    uploader.on( 'uploadAccept', function( file, response ) {
			    	if ( !response.success ) {
			    		var t = response.message || '系统异常，请重试';
			    		up_error_txt += '<p class="up-error-txt">'+ t +'</p>';
			    		// 通过return false来告诉组件，此文件上传有错。
			    		return false;
			    	}
				});
				uploader.on( 'uploadBeforeSend', function(obj,data) {
					// 上传前设置参数;
					data.albumId = $(".album-select").val();
				});
				// reset
				uploader.on( 'reset', function() {
					$queue.html( "" );
				});

			    uploader.onUploadProgress = function( file, percentage ) {
			        var $li = $('#'+file.id),
			            $percent = $li.find('.progress span');

			        $percent.css( 'width', percentage * 100 + '%' );
			        percentages[ file.id ][ 1 ] = percentage;
			        updateTotalProgress();
			    };

			    uploader.onFileQueued = function( file ) {
			        fileCount++;
			        fileSize += file.size;

			        if ( fileCount === 1 ) {
			            $placeHolder.addClass( 'element-invisible' );
			            $statusBar.show();
			        }

			        addFile( file );
			        setState( 'ready' );
			        updateTotalProgress();
			    };

			    uploader.onFileDequeued = function( file ) {
			        fileCount--;
			        fileSize -= file.size;

			        if ( !fileCount ) {
			            setState( 'pedding' );
			        }

			        removeFile( file );
			        updateTotalProgress();

			    };

			    uploader.on( 'all', function( type ) {
			        var stats;
			        switch( type ) {
			            case 'uploadFinished':
			                setState( 'confirm' );
			                break;

			            case 'startUpload':
			                setState( 'uploading' );
			                break;

			            case 'stopUpload':
			                setState( 'paused' );
			                break;

			        }
			    });

			    uploader.onError = function( code ) {
			    	switch( code ) {
			    		case "Q_EXCEED_NUM_LIMIT": 
			    			alert( "选择上传的图片超过了300张" );
			    			break;
			    		case "Q_EXCEED_SIZE_LIMIT": 
			    			alert( "选择上传的图片总大小超过了3000M" );
			    			break;
			    		case "F_EXCEED_SIZE": 
			    			alert( "选择上传的图片大小超过了100M" );
			    			break;
			    		case "Q_TYPE_DENIED":
			    			alert( "您上传的图片格式不符合，请上传gif,jpg,jpeg,bmp,png格式的图片" );
			    			break;
			    		default:
			    			alert( 'Eroor: ' + code );
			    	}
			        
			    };

			    $upload.on('click', function() {
			    	if ( $(".album-select").val() == "" ) return alert( "请先创建相册" );
			        if ( $(this).hasClass( 'disabled' ) ) {
			            return false;
			        }

			        if ( state === 'ready' ) {
			            uploader.upload();
			        } else if ( state === 'paused' ) {
			            uploader.upload();
			        } else if ( state === 'uploading' ) {
			            uploader.stop();
			        }
			    });

			    // 重新上传;
			    $info.on( 'click', '.retry', function() {
			    	$upload.show();
			    	$info.removeClass("hasFailed");
			        uploader.retry();
			    });
			    // 忽略按钮;
			    $info.on( 'click', '.ignore', function() {
			        //alert( 'todo' );
			        ts.$dialogTpl.find( ".sq-dialog-close" ).trigger( "click" ); // 关闭上传弹窗;
			    });

			    $success.on( "click", ".again", function(e) {
			    	e.preventDefault();
			    	$success.hide();
			    	$before.html( ts.before_html ).show();
			    	ts.initUpload();
			    });

			    $upload.addClass( 'state-' + state );
			    updateTotalProgress();
			}

		};

		app.init();
		// api;
		return {
			// 设置相册下拉列表选项;
			setAlbumSelect: function ( option ) {
				app.setAlbumSelect(option);
			}
		};
	};
});