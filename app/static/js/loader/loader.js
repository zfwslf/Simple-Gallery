/*
 * 加载;
*/

define(function(){	
	var tpl = '<div class="ui-popup-wrap">'+
				'<div class="bg"></div>'+
				'<div class="ui-popup loader-pop">'+
		        '<div class="qz-tips-box qz-tips-box-m">'+
		            '<div class="tips-box-txt tips-succeed">'+
		               ' <i class="icon-succeed-m"></i>'+
		                '{$msg}'+
		            '</div>'+
		        '</div>'+
		    '</div>';
	
	return {
		loader: function (msg) {
			$loader = $( tpl.replace("{$msg}", msg) );
			$( document.body ).append( $loader );
			return $loader;
		}
	};
});