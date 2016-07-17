(function(_) {
	angular.module('Circle')
	.controller('singleController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 'action', 
													function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init,   action) {
		console.log( $stateParams );

		var postId = $stateParams.id;
		console.log( postId );

		$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		$rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		if (!$rootScope.user || !$rootScope.user.email) {
			$state.go('signup');
			return;
		}
		$rootScope.loggedIn = true;
		init.app($rootScope.user._id, false, function(user, circle) {
			if (circle) {
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});
			}
		});

		$rootScope.location = $location;

		/**									 **/
		/** INIT single post **/
		/**									 **/
		$scope.initPost = function() {
			var scope = this;

			$http.get('api/post/getSingle?id=' + postId + '&circleId=' + $rootScope.currentCircle._id)
			.then(function(response) {
				$rootScope.post = response.data;
				if (!$rootScope.post || !$rootScope.post.content || !$rootScope.post.content.length) {
					$state.go('main');
					return;
				}
				$rootScope.post.image = $rootScope.post.images[0];
				if ( $rootScope.post.linkEmbed ) {
					$rootScope.post.image = JSON.parse($rootScope.post.linkEmbed).thumbnail_url;

					if ( JSON.parse($rootScope.post.linkEmbed).type === "photo" ) {
						$rootScope.post.image = JSON.parse($rootScope.post.linkEmbed).url;
					}
				}
				console.log( $rootScope.post );

				action.treatPost(scope, $rootScope);
			}, function(error) {
				window.location.href = '/';
			});
		};
		$scope.initPost();

		$scope.deleteCommentOption = {};

		$scope.toggleDeleteCommentOption = function(commentId, force) {
			if ($scope.deleteCommentOption[commentId]) {
				$scope.deleteCommentOption[commentId] = false;
			} else {
				$scope.deleteCommentOption[commentId] = true;
			}
		};

		$scope.deletePost = function(postId) {
			if (window.confirm("Delete this post?")) {
				var that = this;
				var request = {
					postId: postId,
					circleId: $rootScope.currentCircle._id
				};
				console.log(request);
				$http.post('api/post/delete', request).then(function(response) {
					that.posts = response.data;
					$state.go('main');
				});
			}
		};

		$scope.deleteComment = function(commentId, postId) {
			if (window.confirm("Delete this comment?")) {
				var that = this;
				var request = {
					commentId: commentId,
					postId: postId,
					circleId: $rootScope.currentCircle._id
				};
				$http.post('api/comment/delete', request).then(function(response) {
					$rootScope.post = response.data;
				});
			}
		};

		$scope.deletePostClicked = false;
		$scope.deletePostClick = function(click) {
			console.log(click);
			if (click === 'try') {
				$scope.deletePostClicked = true;
			}
			else if (click === 'cancel') {
				$scope.deletePostClicked = false;
			}
			console.log( $scope.deletePostClicked );
		};

		$scope.linkPreview = null;

		$scope.completedQuest = function(postId, username, status) {
			var scope = this;
			var request = status ? {postId: postId, username: username, undo: {status: status}} : {postId: postId, username: username};
			$http.post('api/quest/userCompletedQuest', request).then(function(response) {
				$rootScope.post = response.data;
			}, function(err) {
				console.error(err);
			});
		};

		$scope.allCompletedQuest = function(postId, usernames) {
			for (var i = 0; i < usernames.length; i++) {
				this.completedQuest(postId, usernames[i]);
			}
		};

		$scope.undoCompletedQuest = function(postId, usernames, newStatus) {
			for (var i = 0; i < usernames.length; i++) {
				this.completedQuest(postId, usernames[i], newStatus);
			}
		};

		$scope.newComment = {
			content: "",
			images: [],
			usersMentioned: []
		};

		$scope.generateLinkPreview = function() {
			var that = this;
			var content = this.newComment.content;
			var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
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

		$scope.postComment = function() {
			var that = this;

			if ( that.newComment.content.length <= 1 ) {
				return;
			}

			var commentLink = {};
			var linkPreview = that.linkPreview;

			var content = that.newComment.content;
			var members = $rootScope.currentCircle.members;
			var tagPattern = /\@([^\s!?,.]*)/gi;
			var match = content.match(tagPattern);
			var mentionedUsername;

			if (match) {
				for ( var i = 0; i < match.length; i++ ) {
					mentionedUsername = match[i].replace("@", "");
					for ( var index = 0; index < members.length; index++ ) {
						if ( mentionedUsername == members[index] ) {
							that.newComment.usersMentioned.push(mentionedUsername);
						}
					}
				}
			}

			var request = {
				postId: that.post._id,
				comment: {
					"authorName": $rootScope.user.name,
					"user": $rootScope.user.username || $scope.user.email,
					"userId": $rootScope.user._id,
					"avatar": $rootScope.user.avatar,
					"content": that.newComment.content,
					"images": that.newComment.images,
					"usersMentioned": that.newComment.usersMentioned
				}
			};

			if ( linkPreview ) {
				commentLink.url = linkPreview.url || linkPreview.thumbnail_url;
				commentLink.thumbnail_url = linkPreview.thumbnail_url;
				commentLink.title = linkPreview.title;
				commentLink.description = linkPreview.description;
				commentLink.provider_url = linkPreview.provider_url;
				commentLink.type = linkPreview.type;

				request.comment.linkEmbed = JSON.stringify(commentLink);
			}

			$http.post('api/comment/post', request)
			.success(function(response) {
				$rootScope.post = response;
				that.newComment = {
					content: "",
					images: [],
					usersMentioned: []
				};
				that.linkPreview = null;
			})
			.error(function(err) {
				console.error(err);
			});
		};

		$scope.removeImage = function(id, path) {
			$http.post('api/post/removeImage', {postId: id, path: path})
			.then(function(response) {
				$rootScope.post.images = response.data;
			});
		};

		$scope.castPollVote = function(id, choice, voter) {
			$http.post('api/poll/castVote', {postId: id, choice: choice, voter: voter})
			.then(function(response) {
				$rootScope.post.poll = response.data;
				console.log(response.data);
			}, function(err) {
				console.error(err);
			});
		};

		$scope.react = function($event, reaction, type, id, commentId, commenter) {
			action.react($event, reaction, type, id, commentId, commenter, $rootScope.user, $rootScope.currentCircle._id, function(post) {
				$rootScope.post = post;
			});
		};

		$scope.initDatePicker = function() {
			setTimeout(function() {
				_("#event_date").datepicker();
			}, 300);
		};

		var initSingle = function() {
			var winHeight = _(window).height();
			var _single = _("section.main");

			_single
				.css({height: (winHeight + 119) + "px"}) //.jScrollPane()
				.addClass("initiated");
		};
		var initSingleInt = setInterval(function() {
			if ( !_("section.main").hasClass("initiated") ) {
				initSingle();
				_(window).resize(initSingle);
			} else {
				clearInterval(initSingleInt);
			}
		}, 200);

		$scope.togglePostOptions = function(force) {
			console.log(typeof force);
			if (typeof force !== 'undefined') {
				$rootScope.postOptionsToggled = force;
			} else {
				$rootScope.postOptionsToggled ? $rootScope.postOptionsToggled = false : $rootScope.postOptionsToggled = true;
			}
			console.log($rootScope.postOptionsToggled);
		};

		_(window).load(function() {
			_(document).on("click", function(event) {
				var _t = _(event.target);
				console.log(_t);
				if ( !_t.hasClass("options-menu-container") && !_t.parents(".options-menu-container").length ) {
					$scope.togglePostOptions(false);
				}
			});
		});

	}]);
}(jQuery));