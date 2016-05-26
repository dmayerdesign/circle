(function() {
	angular.module('Circle')
		.controller('editProfileController', ['Upload', '$scope', '$rootScope', '$state', '$http', 'init',
																 function( Upload,   $scope,   $rootScope,   $state,   $http,   init) {

			$rootScope.currentState = 'edit-profile';

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
				$state.go('login');
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
					});
				} else {
					$scope.circleJoined = false;
					$state.go('createCircle');
				}
			});
			/* END CIRCLE INIT */

			$scope.$watch(function() {
				return $scope.file
			}, function() {
				$scope.upload($scope.file);
			});

			$scope.upload = function(file) {
				if (file) {
					Upload.upload({
						url: 'api/profile/updatePhoto',
						method: 'POST',
						data: {userId: $scope.user._id},
						file: file
					})
					.progress(function(e) {
						console.log("uploading");
					})
					.success(function(data) {
						console.log(data);
					})
					.error(function(err) {
						console.error(err);
					})
				}
			};

			$scope.editProfile = function() {
				var request = {
					userId: $scope.user._id
				};

				if ( $scope.user.username ) {
					request.username = $scope.user.username;
				}

				if ( $scope.user.bio ) {
					request.bio = $scope.user.bio;
				}

				$http.post('api/profile/editProfile', request)
				.success(function() {
					console.log("profile updated");
				})
				.error(function(err) {
					console.error("profile update failed");
				});
			};


		}]);
}());