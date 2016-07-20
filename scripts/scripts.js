(function($) {
	$(document).ready(function() {
		$(window).resize(bodyHeight);
		bodyHeight();
		function bodyHeight() {
			var height = $(window).height() + "px";
			$("body").css({
				height: height
			});
		}
	});


	window.onload = function() {

		$(".circle-not-joined #background").css({
			backgroundImage: "url(images/intro-bg.jpg)"
		});

		$(".lazy-load-bg").each(function() {
			var $this = $(this);
			console.log($this.data("bg-style"));
			$this.css({
				"background-image": "url(" + $this.data("bg-style") + ")"
			});
		});

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
		},

		isPartOf: function(selectors) {
			var selector;
			var that = this;
			var oneMatches = false;
			if (!selectors || typeof selectors === "undefined") {
				return false;
			}
			if (typeof selectors === "string") {
				selector = selectors;
				return testSelector(selector);
			}
			if (typeof selectors === "object" && selectors.length) {
				selectors.forEach(function(s) {
					if (testSelector(s)) {
						oneMatches = true;
					}
				});
				if (oneMatches) {
					return true;
				} else {
					return false;
				}
			}
			function testSelector(s) {
				if (that.is(s) || that.parents(s).length) {
					return true;
				}
				else {
					return false;
				}
			}
		} 
	});

	// SERIOUSLY DIRTY WORKAROUND for weird bug where sometimes
	// all HTML except for inner text is stripped out of .post
	// (the one that's ng-repeating in main.html)
	function dirtyCheckForGlitch() {
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
	}
	dirtyCheckForGlitch();
	window.addEventListener("hashchange", dirtyCheckForGlitch, false);

}(jQuery));