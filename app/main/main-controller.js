(function(_) {
	angular.module('Circle')
	.controller('mainController', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$http', 'init', 'customizer', 'action', '$q', '$filter', 'Upload', 
						   					 function($scope,   $rootScope,   $state,   $stateParams,   $location,   $http,   init,   customizer,   action,   $q,   $filter,   Upload) {

		$rootScope.currentState = 'main';

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
		/* END USER INIT */

		/**/
		/** INITIALIZE THE CIRCLE
		/**/
		if ( localStorage['Current-Circle'] ) {
			$rootScope.currentCircle = JSON.parse(localStorage['Current-Circle']) || {};
		} else {
			$rootScope.currentCircle = $scope.user.circles && $scope.user.circles[0] || {};
		}
		init.getUserAndCircle($scope.user._id, $scope.currentCircle.accessCode, function(user, circle) {
			$scope.user = user; // update $scope.user

			if ( !$scope.user.isEmailVerified ) {
				console.log("email is not verified");
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
				}
				$scope.emailVerificationSent = true;
				$state.go('signup');
				return;
			}

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});

				$scope.circleJoined = true;
				$rootScope.circleJoined = true;
				$scope.circleName = circle.name;
				$scope.circle = circle;
				$rootScope.currentCircle = circle;
				customizer.getStyle($rootScope);

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					$scope.postsAllowed = {allow: 20};

					initUI();

					// Check for new posts
					// setInterval(function() {
					// 	$scope.incomingPosts = false;
					// 	init.getPosts($scope.circle._id, function(posts) {
					// 		$scope.incomingPosts = posts;
					// 		if ( $scope.incomingPosts && !$scope.postsAreFiltered && !$scope.postTypesAreFiltered ) {
					// 			$scope.difference = $scope.incomingPosts.length - $scope.posts.length;
					// 			if ( $scope.difference > 0 ) {
					// 				$scope.posts = posts;
					// 			}
					// 		}
					// 	});
					// }, 3000);

					// Search for filter in query string
					if ( $location.search().tag ) {
						$scope.showPostsTagged( $location.search().tag );
					}
				});
			
			} else {
				$scope.circleJoined = false;
				$rootScope.circleJoined = false;
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
			tags: [],
			quest: {},
			images: [],
			usersMentioned: []
		};

		$scope.customSelect = function customSelect(element, event) {
			var _element = _(element);
			var str = this.newPost.tags;
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
				if ( str && str.indexOf(appender) > -1 ) {
					str = str && str.replace(appender + tag, "");
				} else {
					str = str && str.replace(tag, "");
				}
			}

			this.newPost.tags = str;

			console.log(str);
			return str;
		};

		$scope.upload = function(file) {
			var endpoint;
			var scope = this;

			if (file) {
				Upload.upload({
					url: 'api/post/attachImage',
					method: 'POST',
					data: {
						userId: $scope.user._id,
						circleId: $rootScope.currentCircle._id
					},
					file: file
				})
				.progress(function(e) {
					console.log("uploading");
					scope.uploadInProgress = true;
				})
				.success(function(res) {
					console.log(res.filePath);
					scope.newPost.images.push(res.filePath);
					scope.uploadInProgress = false;
				})
				.error(function(err) {
					console.error(err);
					scope.uploadInProgress = false;
				});
			}
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

			that.newPost.tags = $tags.split(splitter);
			var tagNames = that.newPost.tags;
			var postLink = {};
			var linkPreview = that.linkPreview;

			var content = that.newPost.content;
			var members = $rootScope.currentCircle.members;
			var tagPattern = /\@([^\s.,!?]*)/gi;
			var match = content.match(tagPattern);
			var mentionedUsername;

			if (match) {
				for ( var i = 0; i < match.length; i++ ) {
					mentionedUsername = match[i].replace("@", "");
					for ( var index = 0; index < members.length; index++ ) {
						if ( mentionedUsername == members[index] ) {
							that.newPost.usersMentioned.push(mentionedUsername);
						}
						console.log(that.newPost.usersMentioned);
					}
				}
			}

			console.log(that.newPost.usersMentioned);

			var request = {
				"authorName": $scope.user.name,
				"user": $scope.user.username || $scope.user.email,
				"userId": $scope.user._id,
				"avatar": $scope.user.avatar,
				"circleId": $scope.circle._id,
				"content": that.newPost.content,
				"images": that.newPost.images,
				"type": that.newPost.type,
				"tags": that.newPost.tags,
				"usersMentioned": that.newPost.usersMentioned
			};

			if ( linkPreview ) {
				postLink.url = linkPreview.url || linkPreview.thumbnail_url;
				postLink.thumbnail_url = linkPreview.thumbnail_url;
				postLink.title = linkPreview.title;
				postLink.description = linkPreview.description;
				postLink.provider_url = linkPreview.provider_url;
				postLink.type = linkPreview.type;

				request.linkEmbed = JSON.stringify(postLink);
			}

			$http.post('api/post/post', request)
			.success(function(response) {
				console.log(request);
				console.log(response);
				that.posts = response;
				that.newPost = {
					content: "",
					tags: [],
					quest: {},
					images: [],
					usersMentioned: []
				};
				that.linkPreview = null;
				_("#new-post-area > *").blur();

				// if (request.usersMentioned.length) {
				// 	for ( var q = 0; q < request.usersMentioned.length; q++ ) {
				// 		var mentionedUser = request.usersMentioned[q];
				// 		var notification = {
				// 			user: mentionedUser,
				// 			creator: that.user.username,
				// 			action: "mentioned you in a post",
				// 			postId: response[0]._id
				// 		};
				// 		$http.post('api/user/notify', notification)
				// 		.then(function(res) {
				// 			console.log("notified " + mentionedUser);
				// 			console.log(res);
				// 		}, function(err) {
				// 			console.error(err);
				// 		});
				// 	}
				// }
			})
			.error(function(err) {
				console.error(err);
			});

			var tagsArr = [];
			for ( var i = 0; i < tagNames.length; i++ ) {
				$http.post('api/tags/addTag', {
					name: tagNames[i],
					circleId: $rootScope.currentCircle._id
				}).then(function(response) {
					if ( response.data ) {
						$http.get('api/tags/getTags?circleId=' + $rootScope.currentCircle._id)
						.then(function(response) {
							var tags = response.data;
							for ( var i = 0; i < tags.length; i++ ) {
								if ( tags[i].hasOwnProperty("name") ) {
									tagsArr.push(tags[i].name);
								}
							}
							
							if ( i === tagNames.length - 1 ) {
								$scope.circle.tags = tagsArr;
								$rootScope.currentCircle.tags = tagsArr;
								console.log("tagged it");
							}
						});
					}
					
				});
				console.log("looped");
			}
		};

		$scope.findUsersToMention = function() {
			var scope = this;
			var members = $rootScope.currentCircle.members;
			var content = scope.newPost.content;
			var tagPattern = /\@([^\s.,!?]*)/gi;
			var match = content.match(tagPattern);

			console.log(match);

			if ( !match || !match.length || match[0].length < 2 ) {
				return;
			}

			console.log(scope.attemptTag);

			if ( members ) {
				scope.searchUsersToMention = true;
				scope.attemptTag = match[match.length - 1].replace("@", "");
			} else {
				scope.searchUsersToMention = false;
			}

			for ( var i = 0; i < members.length; i++ ) {
				if ( scope.attemptTag === members[i] ) {
					scope.searchUsersToMention = false;
				}
			}
		};

		$scope.mentionUser = function(username) {
			var scope = this;
			var content = scope.newPost.content;
			var tagPattern = /\@([^\s.,!?]*)/gi;
			var match = content.match(tagPattern);
			var usernameFragment;
			for ( var i = 0; i < match.length; i++ ) {
				usernameFragment = match[i].replace("@", "");
				if ( username.indexOf(usernameFragment) > -1 ) {
					scope.newPost.content = content.replace(match[i], "@" + username + " ");
					scope.searchUsersToMention = false;
					_("#new_post_content").focus();
				}
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
					$scope.posts = $filter('filter')($scope.posts, {tags: tag});
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

					// clear "tag" query parameter if it exists
					if ( $location.search().tag ) {
						window.location.href = "/#/";
					}

					return $scope.posts;
				} else {
					$scope.posts = $filter('filter')($scope.posts, {type: type});
					$scope.postTypesAreFiltered = {
						filter: type
					};
					return $scope.posts;
				}
			});
		};

		$scope.showPostsMentioningMe = function(me) {
			if (me || typeof me === "undefined") {
				$scope.posts = $filter('filter')($scope.posts, {usersMentioned: $scope.user.username});
			}
			else if (me === false) {
				$scope.posts = $filter('filter')($scope.posts, {usersMentioned: undefined});
			}
			return $scope.posts;
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
			$rootScope.currentCircle = circle;
			$scope.circleName = circle.name;
			var circles = {};
			circles[circle.accessCode] = circle;
			localStorage.setItem('Circles', JSON.stringify(circles));
			$scope.circleJoined = true;
			$rootScope.circleJoined = true;
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
				console.log(theLink);

				_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
					console.log(data.url);
					console.log(data.thumbnail_url);
					console.log(data);

					if ( data.type === "photo" ) {
						data["src"] = data.url;
					} else {
						data["src"] = data.thumbnail_url;
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

		$rootScope.archiveLinkPreviews = {};
		function treatPostLinks() {
			var _posts = _(".post.not-treated");
			_posts.each(function() {
				var _post = _(this);

				var _article = _post.find("article");
				var _postInner = _post.find(".post-inner");
				var content = _article.html();
				var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				var urlMatch = new RegExp(urlPattern);
				var match = urlPattern.exec(content);
				var theLink;
				var postLinkData;

				if ( match ) {
					theLink = match[0];
					content = content.split(theLink);

					content[0] += "<a href='" + theLink + "' target='_blank' title='" + "'>" + theLink + "</a>";
					content[1] = "";
					content = content.join("");

					if ( _post.data("link-set") ) {
						setPostLinkData($scope, _post.data("link-set"));
					} else {
						_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
							setPostLinkData($scope, data);

							// use $http.post to set the post link if it didn't get set during the posting process
						});
					}

					function setPostLinkData($scope, data) {
						if ( data.type === "photo" || data.type === "video" ) {
							data.src = data.url;
						} else {
							data.src = data.thumbnail_url;
						}
						$rootScope.archiveLinkPreviews[_post.data("post-id")] = data;
						$scope.$apply();
					}

				} else {
					$rootScope.archiveLinkPreviews[_post.data("post-id")] = null;
					$scope.$apply();
				}

				_post.removeClass("not-treated");
				_article.html(content);
			});
		}
		setInterval(treatPostLinks, 500);

		$scope.tagsLimit = 5;

		$scope.clearNotification = function(all, id) {
			var scope = this;
			action.clearNotification(scope.user._id, all, id, function(user) {
				$rootScope.user.notifications = user.notifications;
				console.log(user);
			});
		};

		$rootScope.randomDismissal = function() {
			var index = Math.floor(Math.random() * 4);
			var dismissals = ["ok", "whatever", "fine", "cool"];
			console.log(dismissals[index]);
			return dismissals[index];
		}();

	}]);
}(jQuery));