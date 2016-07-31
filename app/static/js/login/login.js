/*
 * login 登录;
*/

requirejs.config({
   	urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(function(){	
	
	var app = {
		init: function () {
			this.login();
			this.logout();
		},
		login: function () {
			$( "#login-btn" ).on( "click", function(e) {
				e.preventDefault();
				var a = $( "#account" ).val(),
					p = $( "#password" ).val();
				if ( $.trim(a) == "" ) {					
					return sweetAlert( "用户名不能为空" );
				}
				if ( $.trim(p) == "" ) {
					return sweetAlert( "密码不能为空" );
				}

				var $ts = $( this );
				if ( $ts.hasClass("doing") ) return;
				$ts.addClass( "doing" ).html( "登录..." );
				$.ajax({
					url: "/user/login/login",
					type: "POST",
					dataType: "json",
					data: {
						loginname: a,
						loginPwd: $.md5(p)
					},
				}).done(function(data) {
					if ( data.success ) {
						window.location = data.data;
					} else {
						sweetAlert( data.message );
					}
				}).always(function() {
					$ts.removeClass( "doing" ).html( "登录" );
				});				
			});

			// enter login;
			$( document ).on( "keyup", "#account, #password", function(e) {
				if ( e.keyCode === 13 ) {
                    $( "#login-btn" ).trigger( "click" );
                }
			});
		},
		// 注销;
		logout: function () {
			$( "#logout" ).on( "click", function(e) {
				e.preventDefault();
				$.ajax({
					url: "/user/logout",
					type: "POST",
					dataType: "json"
				}).done(function(data) {
					if ( data.success ) {
						window.location = data.data;
					} else {
						sweetAlert( data.message );
					}
				});
			});
		},
		getuserinfor: function (u) {
			$( "#loginName" ).html( u );
		}
	};
	app.init();	
	// 暴露设置用户名的接口；
	return {
		getuserinfor: function (u) {
			app.getuserinfor(u);
		}
	};
});