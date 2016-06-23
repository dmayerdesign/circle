(function($) {
	// Update Avatars
	window.onload = function() {

		$(window).resize(bodyHeight);
		bodyHeight();
		function bodyHeight() {
			var height = $(window).height() + "px";
			$("body").css({
				height: height
			});
		}

		$(".circle-not-joined #background").css({
			backgroundImage: "url(images/intro-bg.jpg)"
		});

		var datepickerInt = setInterval(function() {
			if ($("#event_date").length) {
				$("#event_date").datepicker();
				clearInterval(datepickerInt);
			}
		}, 300);

	};

	$.fn.extend({
		ariaHide: function() {
			this.css("display", "none");
			this.css("visibility", "hidden");
			this.attr("aria-hidden", "true");
		},

		ariaShow: function(display) {
			if ( !display ) { display = "block" }
			this.css("display", display);
			this.css("visibility", "visible");
			this.attr("aria-hidden", "false");
		}
	});

}(jQuery));