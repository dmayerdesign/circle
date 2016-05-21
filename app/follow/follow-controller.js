(function() {
	angular.module('Circle')
	.controller('followController', ['$scope', '$http', function($scope, $http) {
		
		$scope.user = JSON.parse(localStorage['User-Data']);
		if ($scope.user) {
			$scope.user.circles = localStorage['Circles'] ? JSON.parse(localStorage['Circles']) : undefined;
		}

		$http.get('api/users/get')
		.then(function(response) {
			$scope.users = response.data;
			console.log( $scope.users );
		}, function(err) {
			console.error(err);
		});

		$scope.follow = function(userId, otherId) {
			request = {
				userId: userId,
				otherId: otherId
			};

			$http.post('api/users/follow', request).then(function() {
				console.log("now following " + otherId);
			});
		}
	}]);
}());