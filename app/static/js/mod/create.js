requirejs.config({  
    urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(function(){
	var createDialog = new SQ.hdDialog({
			title: "创建相册",
			content: $("#create-album-tpl").html().replace( "{$id}", "create-album-form" ).replace( "{$btnTxt}", "创建")
		}),
	editDialog = new SQ.hdDialog({
		title: "编辑相册",
		content: $("#create-album-tpl").html().replace( "{$id}", "edit-album-form" ).replace( "{$btnTxt}", "提交")
	}),
	$createForm = $( "#create-album-form" ),
	$editForm = $( "#edit-album-form" );

	var reg = /[\u4e00-\u9fa5]/g; // 中文正则;
		//s_reg = /<script.*?>.*?<\/script>/ig;

	return {
		// 创建相册;
		create: function (fn) {
			$( document ).on( "click", ".js-create-pop", function(e) {
				e.preventDefault();
				// 标识是否在pic页面的top部里创建相册;
				if ( $(this).attr("data-reflash") ) {
					$( ".create-album-btn", $createForm ).addClass( "js-reflash" );
				} else {
					$( ".create-album-btn", $createForm ).removeClass( "js-reflash" );
				}
				createDialog.show();	
			});
			$createForm.on( "click", ".create-album-btn", function(e) {
				e.preventDefault();
				var $ts = $createForm,
					name = $ts.find( ".name" ).val(),
					text = $ts.find( "textarea" ).val();
				if ( !$.trim(name) ) {
					return alert( "请填写相册名称" );
				}

				var val = $.trim(name).replace( reg, "xxx" );
				if ( val.length > 30 ) {
					return alert( "相册名称不能超过30个字符，中文占3个字符" );
				}
				// 过滤script；
				// if ( s_reg.test($.trim(name)) ) {
				// 	return alert( "相册名称不能包含script标签" );
				// }

				var val1 = $.trim(text).replace( reg, "xxx" );
				if ( val1 && val1.length > 45 ) {
					return alert( "描述内容不能超过45个字符，中文占3个字符" );
				}
				// 过滤script；
				// if ( val1 && s_reg.test($.trim(text)) ) {
				// 	return alert( "描述内容不能包含script标签" );
				// }
				
				$.ajax({
					url: "/album/create",
					dataType: "json",
					type: "POST",
					data: {
						albumName: $.trim(name),
						albumDesc: $.trim(text)
					}						
				}).done(function (data) {
					if ( data.success ) {
						fn();
						$createForm.find( "input, textarea" ).val( "" );
						createDialog.hide();
					} else {
						data.message && alert( data.message );
					}
				});

			}).on( "click", ".cancel-btn", function(e) {
				e.preventDefault();
				createDialog.hide();
			});
		},
		edit: function (fn) {
			$( "#albumContent" ).on( "click", ".edit", function(e) {
				e.preventDefault();
				var $ts = $editForm,
					$wrap = $( this ).closest( ".album-list" );
				$ts.find( ".name" ).val( $wrap.find(".name").text() );
				$ts.find( "textarea" ).val( $(this).attr("data-desc") );
				$ts.attr( "data-id", $wrap.attr("data-id") ); // 相册id;
				editDialog.show();
			});
			$editForm.on( "click", ".create-album-btn", function(e) {
				e.preventDefault();
				var $ts = $editForm,
					name = $ts.find( ".name" ).val(),
					text = $ts.find( "textarea" ).val();
				if ( !$.trim(name) ) {
					return alert( "请填写相册名称" );
				}

				var val = $.trim(name).replace( reg, "xxx" );
				if ( val.length > 30 ) {
					return alert( "相册名称不能超过30个字符，中文占3个字符" );
				}
				// 过滤script；
				// if ( s_reg.test($.trim(name)) ) {
				// 	return alert( "相册名称不能包含script标签" );
				// }

				var val1 = $.trim(text).replace( reg, "xxx" );
				if ( val1 && val1.length > 45 ) {
					return alert( "描述内容不能超过45个字符，中文占3个字符" );
				}
				// 过滤script；
				// if ( val1 && s_reg.test($.trim(text)) ) {
				// 	return alert( "描述内容不能包含script标签" );
				// }
				
				$.ajax({
					url: "/album/update",
					dataType: "json",
					type: "POST",
					data: {
						albumId: $ts.attr("data-id"),
						albumName: $.trim(name),
						albumDesc: $.trim(text)
					}						
				}).done(function (data) {
					if ( data.success ) {
						fn();
						$editForm.find( "input, textarea" ).val( "" );						
						editDialog.hide();
					} else {
						data.message && alert( data.message );
					}
				});

			}).on( "click", ".cancel-btn", function(e) {
				e.preventDefault();
				editDialog.hide();
			});
		}
	};
	
});