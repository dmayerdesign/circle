(function(_) {
	angular.module('Circle')
	.controller('singleController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 'action', 
													function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init,   action) {
		console.log( $stateParams );

		$rootScope.currentState = 'single';

		var postId = $stateParams.id;
		console.log( postId );


		/**									 **/
		/** INIT single post **/
		/**									 **/
		$scope.initPost = function() {
			var scope = this;

			$http.get('api/post/getSingle?id=' + postId)
			.then(function(response) {
				$rootScope.post = response.data;
				$rootScope.post.image = $rootScope.post.images[0];
				if ( $rootScope.post.linkEmbed ) {
					$rootScope.post.image = JSON.parse($rootScope.post.linkEmbed).thumbnail_url;

					if ( JSON.parse($rootScope.post.linkEmbed).type === "photo" ) {
						$rootScope.post.image = JSON.parse($rootScope.post.linkEmbed).url;
					}
				}
				console.log( $rootScope.post );

				action.treatPost(scope, $rootScope);
			});
		};
		$scope.initPost();

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

		$scope.removeImage = function(id, path) {
			var scope = this;
			$http.post('api/post/removeImage', {postId: id, path: path})
			.then(function(response) {
				$rootScope.post.images = response.data;
			});
		};

	}]);
}(jQuery));