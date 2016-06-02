(function(_) {
	angular.module('Circle')
	.controller('singleController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 
													function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init) {
		console.log( $stateParams );

		$rootScope.currentState = 'single';

		/**/
		/** INITIALIZE THE USER
		/**/
		if ( localStorage['User'] ) {
			var localUser = JSON.parse(localStorage['User']);
			if ( localUser.email ) {
				$rootScope.user = localUser;
			}
		}
		if ( !$scope.user || !$scope.user._id ) {
			$state.go('login');
			return;
		} else {
			$scope.loggedIn = true;
		}
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
				if ( $location.search().email && $location.search().verifyEmail ) {
					window.location.href = '/?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail + "/#/verify-email";
				}
				return;
			}

			if ( circle ) {
				init.getMembers(circle.accessCode, function(members) {
					$rootScope.users = members;
				});

				$scope.circleJoined = true;
				$scope.circleName = circle.name;
				$scope.circle = circle;

				console.log( circle );
				console.log( $scope.circleJoined );

				init.getPosts(circle._id, function(posts) {
					$scope.posts = posts;
					treatPostLink();
				});
			} else {
				$scope.circleJoined = false;
				$state.go('createCircle');
			}
		});
		/* END CIRCLE INIT */

		var postId = $stateParams.id;
		console.log( postId );


		/**									 **/
		/** INIT single post **/
		/**									 **/
		getPost($scope, postId);
		function getPost($scope, id) {
			$http.get('api/post/getSingle?id=' + id)
			.then(function(response) {
				$scope.post = response.data;
				$scope.post.image = $scope.post.images[0];
				if ( $scope.post.linkEmbed ) {
					$scope.post.image = JSON.parse($scope.post.linkEmbed).thumbnail_url;
					if ( JSON.parse($scope.post.linkEmbed).type === "photo" ) {
						$scope.post.image = JSON.parse($scope.post.linkEmbed).url;
					}
				}
				
				console.log( $scope.post );
			});
		}

		$scope.deletePost = function(postId) {
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
		function treatPostLink() {
			var _post = _("#post");
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


				_.get('http://api.embed.ly/1/oembed?key=be2a929b1b694e8d8156be52cca95192&url=' + theLink, function(data) {
					console.log(data);
					$scope.linkPreview = data;
				});
			} else {
				$scope.linkPreview = null;
			}

			_post.removeClass("not-treated");
			_article.html(content);
		};

		$scope.completedQuest = function(postId, username, status) {
			var scope = this;
			var request = status ? {postId: postId, username: username, undo: {status: status}} : {postId: postId, username: username};
			$http.post('api/quest/userCompletedQuest', request).then(function(response) {
				scope.post = response.data;
				window.location.reload();
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
				that.post = response;
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

	}]);
}(jQuery));