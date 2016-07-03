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

		// var datepickerInt = setInterval(function() {
		// 	console.log($("#event_date").parent().html());
		// 	if ($("#event_date").length) {
		// 		$("#event_date").datepicker();
		// 		console.log("date picker found");
		// 		clearInterval(datepickerInt);
		// 	}
		// }, 300);

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

	// SERIOUSLY DIRTY WORKAROUND for weird bug where sometimes
	// all HTML except for inner text is stripped out of .post
	// (the one that's ng-repeating in main.html)
	setTimeout(function() {
		setInterval(function() {
			var $archivePost = $(".archive-post");
			$archivePost.each(function() {
				if ($(this).length && $(this).find("*").length < 2) {
					window.location.reload();
				}
			});
		}, 1000);
	}, 5000);

}(jQuery));