(function(_) {
	angular.module('Circle')
	.controller('mainController', ['$scope', '$state', '$http', 'init', 'action', '$q', '$filter', 
						   function($scope,   $state,   $http,   init,   action,   $q,   $filter) {

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$scope.user = localUser;
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('signup');
			return;
		} else {
			$scope.loggedIn = true;
		}
		
		function getParameterByName(name, url) { if (!url) url = window.location.href; name = name.replace(/[\[\]]/g, "\\$&"); var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url); if (!results) return null; if (!results[2]) return null; return decodeURIComponent(results[2].replace(/\+/g, " ")); }
		/* END USER INIT */

		/**/
		/** INITIALIZE THE CIRCLE
		/**/
		if ( localStorage['Current-Circle'] ) {
			$scope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$scope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}
		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$scope.user = user; // update $scope.user

			if ( !$scope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( getParameterByName("email") && getParameterByName("verifyEmail") ) {
					window.location.href = '/?email=' + getParameterByName("email") + "&verifyEmail=" + getParameterByName("verifyEmail") + "/#/verify-email";
				}
				$scope.emailVerificationSent = true;
				$state.go('signup');
				return;
			}

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$scope.users = members;
				});

				$scope.circleJoined = true;
				$scope.circleName = circle.name;
				$scope.circle = circle;

				console.log( circle );
				console.log( $scope.circleJoined );

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					$scope.postsAllowed = {allow: 20};

					// Check for new posts
					setInterval(function() {
						$scope.incomingPosts = false;
						init.getPosts($scope.circle._id, function(posts) {
							$scope.incomingPosts = posts;
							if ( $scope.incomingPosts && !$scope.postsAreFiltered && !$scope.postTypesAreFiltered ) {
								$scope.difference = $scope.incomingPosts.length - $scope.posts.length;
								if ( $scope.difference > 0 ) {
									$scope.posts = posts;
								}
							}
						});
					}, 3000);

					initUI();
				});
			
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		$scope.postOrder = 'date';
		$scope.orderPosts = function(postOrder) {
			$scope.postOrder = postOrder;
		};

		$scope.newPost = {
			content: "",
			tags: "",
			quest: {}
		};

		$scope.customSelect = function customSelect(element, event) {
			var _element = _(element);
			var str = this.newPost.tags;
			//var str = _element.val();
			var _target = _(event.target);
			var tag = _target.data("option");
			var _customSelector = _target.parents(".select");
			var isSelected = _target.hasClass("selected");
			var appender = ", ";
			if ( str && str.indexOf(",") > -1 ) {
				appender = ",";
			}
			if ( str && str.indexOf(" ") > -1 ) {
				appender = " ";
			}
			if ( str && str.indexOf(", ") > -1 ) {
				appender = ", ";
			}
			
			if ( !isSelected ) {
				_target.addClass("selected");
				if ( str && str.length && str.indexOf(tag) === -1 ) {
					str = str + appender + tag;
				}
				if ( !str || !str.length ) {
					str = tag;
				}
			} else {
				_target.removeClass("selected");
				if ( str.indexOf(appender) > -1 ) {
					str = str && str.replace(appender + tag, "");
				} else {
					str = str && str.replace(tag, "");
				}
			}

			this.newPost.tags = str;

			console.log(str);
			return str;
		};
		
		$scope.sendPost = function(event) {
			if ( event && event.which !== 13 ) { return; }
			var that = this;

			if ( that.newPost.content.length <= 1 ) {
				return;
			}

			if ( !that.newPost.tags || that.newPost.tags.length <= 1 ) {
				that.newPost.tags = "random";
			}

			$tags = that.newPost.tags;

			var splitter = $tags.indexOf(",") > -1 ? "," : " ";
			splitter = $tags.indexOf(", ") > -1 ? ", " : splitter;

			var tagNames = $tags.split(splitter);

			var request = {
				user: $scope.user.username || $scope.user.email,
				userId: $scope.user._id,
				avatar: $scope.user.avatar,
				circleId: $scope.circle._id,
				content: that.newPost.content,
				type: that.newPost.type,
				tags: tagNames,
				link: $scope.linkPreview
			};

			if ( that.newPost.type === 'quest' && that.newPost.quest && that.newPost.quest.questers ) {
				var questersObj = that.newPost.quest.questers;
				var questersArr = [];
				for ( var questerId in questersObj ) {
					questersArr.push(questerId);
				}
				request.quest = {
					questers: questersArr
				};
			}

			that.linkPreview = null;

			$http.post('api/post/post', request)
			.success(function(response) {
				console.log(response);
				$scope.posts = response;
				that.newPost = {};
				_("#new-post-area > *").blur();
			})
			.error(function(err) {
				console.error(err);
			});

			for ( var i = 0; i < tagNames.length; i++ ) {
				$http.post('api/tags/addTag', {
					name: tagNames[i],
					circleId: $scope.circle._id
				}).then(function(response) {
					if ( response.data ) {
						$http.get('api/tags/getTags?circleId=' + $scope.circle._id)
						.then(function(response) {
							var tagsArr = [];
							var tags = response.data;
							for ( var i = 0; i < tags.length; i++ ) {
								if ( tags[i].hasOwnProperty("name") ) {
									tagsArr.push(tags[i].name);
								}
							}
							
							$scope.circle.tags = tagsArr;

						});
					}
					
				});
			}
		};

		$scope.setNewPosts = function() {
			$scope.posts = angular.copy($scope.incomingPosts);
			$scope.incomingPosts = undefined;
		};

		$scope.showPostsTagged = function(tag) {
			var that = this;
			init.getPosts($scope.circle._id, function(posts) {
				console.log($scope.postsAreFiltered);
				$scope.posts = posts;
				that.postsAllowed = {allow: 20};

				if ( !$scope.postsAreFiltered || typeof $scope.postsAreFiltered === 'undefined' ) {
					$scope.postsAreFiltered = false;
				}

				if ( !tag || typeof tag === 'undefined' ) {
					$scope.postsAreFiltered = false;
					return $scope.posts;
				} else {
					$scope.posts = $filter('filter')($scope.posts, tag);
					$scope.postsAreFiltered = {
						filter: tag
					};
					return $scope.posts;
				}
			});
		};

		$scope.showPostsOfType = function(type) {
			var that = this;
			init.getPosts($scope.circle._id, function(posts) {
				console.log($scope.postTypesAreFiltered);
				$scope.posts = posts;
				that.postsAllowed = {allow: 20};

				if ( !$scope.postTypesAreFiltered || typeof $scope.postTypesAreFiltered === 'undefined' ) {
					$scope.postTypesAreFiltered = false;
				}

				if ( !type || typeof type === 'undefined' ) {
					$scope.postTypesAreFiltered = false;
					return $scope.posts;
				} else {
					$scope.posts = $filter('filter')($scope.posts, type);
					$scope.postTypesAreFiltered = {
						filter: type
					};
					return $scope.posts;
				}
			});
		};

		$scope.applyFilterClasses = function() {
			if ( $scope.postTypesAreFiltered && $scope.postsAreFiltered ) {
				return $scope.postTypesAreFiltered.filter + " " + $scope.postsAreFiltered.filter;
			}
			if ( $scope.postsAreFiltered ) {
				return $scope.postsAreFiltered.filter;
			}
			if ( $scope.postTypesAreFiltered ) {
				return $scope.postTypesAreFiltered.filter;
			}
		};

		function initCircle(circle) {
			$scope.loggedIn = true;
			$scope.circle = circle;
			$scope.circleName = circle.name;
			var circles = {};
			circles[circle.accessCode] = circle;
			localStorage.setItem('Circles', JSON.stringify(circles));
			$scope.circleJoined = true;
			$scope.showPostsTagged();

			$state.go('main');
		}

		var initArchive = function() {
			var $head = _("head");
			var winHeight = _(window).height();
			var _archive = _(".posts-archive-container");

			_archive
				.css({height: (winHeight + 30) + "px"}) //.jScrollPane()
				.addClass("initiated");
		};
		var initArchiveInt = setInterval(function() {
			if ( !_(".posts-archive-container").hasClass("initiated") ) {
				initArchive();
				_(window).resize(initArchive);
			} else {
				clearInterval(initArchiveInt);
			}
		}, 200);

		$scope.showTagsDropdown = function() {
			$scope.tagsDropdownVisible = $scope.tagsDropdownVisible ? false : true;
		};

		$scope.resizeAvatar = function(avatar) {
			var _avatar = _(avatar);
			_avatar.css({
				height: auto,
				width: auto
			});
			var avatarWidth = _avatar.width();
			var avatarHeight = _avatar.height();
			var _container = _avatar.parents(".avatar-container");
			var containerDimensions = {
				width: _container.width(),
				height: _container.height()
			};

			if ( avatarWidth > avatarHeight ) {
				var stretchDir = "height";
				var marginDir = "top";
				var diff = containerDimensions.height - avatarHeight;
			} else {
				var stretchDir = "width";
				var marginDir = "left";
				var diff = containerDimensions.width - avatarWidth;
			}

			var cssObj = {};
			cssObj[stretchDir] = containerDimensions[stretchDir];
			cssObj["margin-" + marginDir] = -diff;
			
			_avatar.css(cssObj);
		};

		$scope.postsAllowed = {allow: 20};

		$scope.loadMore = function() {
			this.postsAllowed.allow += 20;
			console.log( this.postsAllowed );
		};

		$scope.generateLinkPreview = function() {
			var that = this;
			var content = this.newPost.content;
			var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
			var urlMatch = new RegExp(urlPattern);
			var match = urlPattern.exec(content);
			var theLink;

			if ( match ) {
				theLink = match[0];

				_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
					console.log(data);
					if ( data.type === "photo" ) {
						data.src = data.url;
					} else {
						data.src = data.thumbnail_url;
					}
					that.linkPreview = data;
				});
			} else {
				that.linkPreview = null;
			}
		};

		function initUI() {
			var initDrawers = function($drawers, $sidebars) {
				$drawers.each(function() {
					var height = _(this).outerHeight(true);
					TweenMax.fromTo( _(this), 0.1, {
						y: 500 // needs to be jumpstarted for some reason
					},
					{
						y: height,
						delay: 1
					});

					_(this).addClass("animation-initiated");
				});

				$sidebars.each(function() {
					var width = _(this).outerWidth(true);
					TweenMax.fromTo( _(this), 0.1, {
						x: -500 // needs to be jumpstarted for some reason
					},
					{
						x: -width,
						delay: 1
					});

					_(this).addClass("animation-initiated");
				});
			};
			initDrawers( _(".bottom-drawer"), _(".main-menu") );

			var initAddPost = function() {
				_("#post_type_regular").prop("checked", true);
			};
			initAddPost();
		}

		$scope.goToPost = function(post_id) {
			console.log(window.location.href);
			$state.go("single", {id: post_id});

		};

		$scope.archiveLinkPreviews = {};
		function treatPostLink() {
			var _posts = _(".post.not-treated");
			_posts.each(function() {
				var _post = _(this);

				var _article = _post.find("article");
				var content = _article.html();
				var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				var urlMatch = new RegExp(urlPattern);
				var match = urlPattern.exec(content);
				var theLink;

				if ( match ) {
					theLink = match[0];
					content = content.split(theLink);

					content[0] += "<a href='" + theLink + "' target='_blank' title='" + "'>" + theLink + "</a>";
					content[1] = "";
					content = content.join("");

					if ( _post.data("link-set") ) {
						$scope.archiveLinkPreviews[_post.data("post-id")] = _post.data("link-set");
						$scope.$apply();
					} else {
						_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
							console.log(data);
							if ( data.type === "photo" ) {
								data.src = data.url;
							} else {
								data.src = data.thumbnail_url;
							}
							$scope.archiveLinkPreviews[_post.data("post-id")] = data;
							$scope.$apply();

							// use $http.post to set the post link if it didn't get set during the posting process
						});
					}
				} else {
					$scope.archiveLinkPreviews[_post.data("post-id")] = null;
					$scope.$apply();
				}

				_post.removeClass("not-treated");
				_article.html(content);
			});
		}
		setInterval(treatPostLink, 2000);

		$scope.getPostImage = function(post) {
			return this.archiveLinkPreviews[post._id] || post.images[0];
		};

	}]);
}(jQuery));