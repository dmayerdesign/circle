(function(_) {
	angular.module('Circle')
		.controller('editProfileController', ['Upload', '$scope', '$rootScope', '$location', '$state', '$http', 'init',
																 function( Upload,   $scope,   $rootScope,   $location,   $state,   $http,   init) {

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

			$scope.editProfile = function() {
				var request = $rootScope.user;

				$http.post('api/profile/editProfile', request)
				.success(function(response) {
					console.log("profile updated");
				})
				.error(function(err) {
					console.error("profile update failed");
				});
			};

			$scope.goToSection = function(section) {
				_("#" + section).show().siblings("section").hide();
			};


		}]);
}(jQuery));