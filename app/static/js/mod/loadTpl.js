requirejs.config({  
    urlArgs: "t=" + (new Date()).getTime(),
    waitSeconds: 0
});
define(function(){
	return function (fn) {
		console.log( typeof fn)
		$.ajax({
			url: "../tpl/tpl.html",
			dataType: "html",
			success: function (text) {
				$( document.body ).append( text );	
				fn();				
			},
			error: function () {
				alert( "加载模板失败，请刷新浏览器重试" );
			}
		});
	};
});