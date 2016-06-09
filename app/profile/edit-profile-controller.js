(function() {
	angular.module('Circle')
		.controller('editProfileController', ['Upload', '$scope', '$rootScope', '$state', '$http', 'init',
																 function( Upload,   $scope,   $rootScope,   $state,   $http,   init) {

			$rootScope.currentState = 'edit-profile';
			

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