$(function() {
	// ======================= imagesLoaded Plugin ===============================
	// https://github.com/desandro/imagesloaded

	// $('#my-container').imagesLoaded(myFunction)
	// execute a callback when all images have loaded.
	// needed because .load() doesn't work on cached images

	// callback function gets image collection as argument
	//  this is the container

	// original: mit license. paul irish. 2010.
	// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

	$.fn.imagesLoaded 		= function( callback ) {
		var $images = this.find('img'),
			len 	= $images.length,
			_this 	= this,
			blank 	= 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

		function triggerCallback() {
			callback.call( _this, $images );
		}

		function imgLoaded() {
			if ( --len <= 0 && this.src !== blank ){
				setTimeout( triggerCallback );
				$images.off( 'load error', imgLoaded );
			}
		}

		if ( !len ) {
			triggerCallback();
		}

		$images.on( 'load error',  imgLoaded ).each( function() {
			// cached images don't fire load sometimes, so we reset src.
			if (this.complete || this.complete === undefined){
				var src = this.src;
				// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				// data uri bypasses webkit log warning (thx doug jones)
				this.src = blank;
				this.src = src;
			}
		});

		return this;
	};

	function Gallery (opts) {
		var ts = this;
		$.extend(this,{
			$container: null,
			current: 0,
			data: [],

		}, opts||{} );	
		var gallery_data = ts.data;		
		var tpl = $( "#galleryTpl" ).html(),
			html = "";
		for ( var i = 0, len = gallery_data.length; i<len; i++ ) {
			var item = gallery_data[ i ];
			if ( i >= 20 ) {
				html += '<li><a href="#"><img data-s="'+item.thumb+'" src="/static/css/images/loader.gif"/" data-large="'+item.large+'" data-id="'+item.id+'" data-dlurl="'+item.dlLink+'" alt="image01" data-description="'+item.desc+'" /></a></li>';
			} else {
				html += '<li><a href="#"><img src="'+item.thumb+'" data-large="'+item.large+'" data-id="'+item.id+'" data-dlurl="'+item.dlLink+'" alt="image01" data-description="'+item.desc+'" /></a></li>';	
			}
			
		}
		ts.$container.html( tpl.replace("{@li_html}",html) ).show();
		ts.$rgGallery = $( "#rg-gallery" );
		// carousel container
		this.$esCarousel			= ts.$rgGallery.find('div.es-carousel-inner'),
		// the carousel items
		this.$items				= ts.$esCarousel.find('ul > li'),
		// total number of items
		this.itemsCount			= ts.$items.length;

		this.mode 			= 'carousel',
			// control if one image is being loaded
		this.anim			= false,
		this.init();
	}
	Gallery.prototype = {
		init: function() {		
			var ts = this;	
			// (not necessary) preloading the images here...
			ts.$items.add('<img src="/static/css/images/loader.gif"/><img src="/static/css/images/black.png"/>').imagesLoaded( function() {
				// add options
				// _addViewModes();
				
				// add large image wrapper
				ts._addImageWrapper();
				
				// show first image
				ts._showImage( ts.$items.eq( ts.current ) );
				ts._evt();
			});
			
			// initialize the carousel
			if( this.mode === 'carousel' ){
				ts._initCarousel();
			}
			
			
		},
		_initCarousel	: function() {
			var ts = this;
			// we are using the elastislide plugin:
			// http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
			ts.$esCarousel.show().elastislide({
				imageW 	: 65,
				onClick	: function( $item ) {
					if( ts.anim ) return false;
					ts.anim	= true;
					// on click show image
					ts._showImage($item);
					// change current
					ts.current	= $item.index();
				}
			});
			
			// set elastislide's current to current
			ts.$esCarousel.elastislide( 'setCurrent', this.current );
			
		},
		_addImageWrapper: function() {
			var ts = this;
			// adds the structure for the large image and the navigation buttons (if total items > 1)
			// also initializes the navigation events
			
			var html = _.template( $('#img-wrapper-tmpl').html() )( {itemsCount : ts.itemsCount} );
			$( "#rg-origin-images" ).html( html );
			
			if( ts.itemsCount > 1 ) {
				// addNavigation
				var $navPrev		= ts.$rgGallery.find('a.rg-image-nav-prev'),
					$navNext		= ts.$rgGallery.find('a.rg-image-nav-next'),
					$imgWrapper		= ts.$rgGallery.find('div.rg-image');
					
				$navPrev.on('click.rgGallery', function( event ) {
					ts._navigate( 'left' );
					return false;
				});	
				
				$navNext.on('click.rgGallery', function( event ) {
					ts._navigate( 'right' );
					return false;
				});
			
				// add touchwipe events on the large image wrapper
				$imgWrapper.touchwipe({
					wipeLeft			: function() {
						ts._navigate( 'right' );
					},
					wipeRight			: function() {
						ts._navigate( 'left' );
					},
					preventDefaultEvents: false
				});
			
				$(document).on('keyup.rgGallery', function( event ) {
					if (event.keyCode == 39)
						ts._navigate( 'right' );
					else if (event.keyCode == 37)
						ts._navigate( 'left' );	
				});
				
			}
			
		},
		_evt: function () {
			var h = 89; //
			var $rgThumbs = $(".rg-thumbs");
			$(window).on( "resize.gallery", function() {
				$("#rg-origin-images").find(".rg-image").css({
					height: $(this).height() -h -60,
					width: $(this).width() -100
				});
				$rgThumbs.show();
			}).trigger("resize.gallery");
		},
		_navigate		:function( dir ) {
			var ts = this;
			// navigate through the large images
			
			if( ts.anim ) return false;
			ts.anim	= true;
			
			if( dir === 'right' ) {
				if( ts.current + 1 >= ts.itemsCount )
					ts.current = 0;
				else
					++ts.current;
			}
			else if( dir === 'left' ) {
				if( ts.current - 1 < 0 )
					ts.current = ts.itemsCount - 1;
				else
					--ts.current;
			}
			
			ts._showImage( ts.$items.eq( ts.current ) );
			
		},
		_showImage		:function( $item ) {
			var ts = this;
			// shows the large image that is associated to the $item
			
			var $loader	= ts.$rgGallery.find('div.rg-loading').show();
			
			ts.$items.removeClass('selected');
			$item.addClass('selected');
				 
			var $thumb		= $item.find('img'),
				largesrc	= $thumb.data('large'),
				title		= $thumb.data('description'),
				id 			= $thumb.data('id'),
				url 		= $thumb.data('dlurl');
			
			$('<img/>').load( function() {
				
				ts.$rgGallery.find('div.rg-image').empty().append('<img src="' + largesrc + '"/>');
				
				if( title ) {
					var $rgCp = ts.$rgGallery.find('div.rg-caption').show();
					$rgCp.find('.desc').text( title );
					$rgCp.find('.download').attr('href', url);
					$rgCp.find('.delete').attr('data-id', id);
				}
				
				$loader.hide();
				
				if( ts.mode === 'carousel' ) {
					ts.$esCarousel.elastislide( 'reload' );
					ts.$esCarousel.elastislide( 'setCurrent', ts.current );
				}
				
				ts.anim	= false;
				
			}).attr( 'src', largesrc );
			
		},
		addItems		:function( $new ) {
			var ts = this;
			ts.$esCarousel.find('ul').append($new);
			ts.$items 		= ts.$items.add( $($new) );
			ts.itemsCount	= ts.$items.length; 
			ts.$esCarousel.elastislide( 'add', $new );
		
		},
		destroy: function () {
			var ts = this;
			$(document).off('keyup.rgGallery');
			$(window).off('resize.gallery');
			ts.$container.html("");
		}
	};
	window.Gallery = Gallery;
	
	/*
	Example to add more items to the gallery:
	
	var $new  = $('<li><a href="#"><img src="images/thumbs/1.jpg" data-large="images/1.jpg" alt="image01" data-description="From off a hill whose concave womb reworded" /></a></li>');
	Gallery.addItems( $new );
	*/
});