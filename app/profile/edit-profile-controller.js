(function() {
	angular.module('Circle')
		.controller('editProfileController', ['Upload', '$scope', '$rootScope', '$location', '$state', '$http', 'init',
																 function( Upload,   $scope,   $rootScope,   $location,   $state,   $http,   init) {

			$rootScope.currentState = "edit-profile";
			setInterval(function() {
				if ( $location.url().indexOf("single") > -1 ) {
					$rootScope.currentState = "single";
				}
				if ( $location.url().indexOf("categories") > -1 ) {
					$rootScope.currentState = "categories";
				}
				if ( $location.url().indexOf("members") > -1 ) {
					$rootScope.currentState = "members";
				}
				if ( $location.url().indexOf("edit-profile") > -1 ) {
					$rootScope.currentState = "editProfile";
				}
			}, 1000);
			

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
						$rootScope.user = data;
						console.log(data);
					})
					.error(function(err) {
						console.error(err);
					})
				}
			};

			$scope.editProfile = function(part) {
				var request = {
					userId: $scope.user._id
				};

				request[part] = $scope.user[part];

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