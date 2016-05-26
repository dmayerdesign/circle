(function() {
	angular.module('Circle')
		.controller('loginController', ['$scope', '$rootScope', '$state', '$location', '$http', function($scope, $rootScope, $state, $location, $http) {

			$rootScope.currentState = 'login';

			/**/
			/** INITIALIZE THE USER
			/**/
			if ( localStorage['User'] ) {
				var localUser = JSON.parse(localStorage['User']);
				if ( localUser && localUser.email ) {
					$state.go('main');
					return;
				}
			}
			/* END USER INIT */

			$scope.logIn = function(alreadyLoggedIn) {
				$scope.login = alreadyLoggedIn ? JSON.parse(localStorage['User']) : $scope.login;

				var request = {
					email: $scope.login.email,
					password: $scope.login.password
				};

				console.log( "login request:");
				console.log( request );

				$http.post('api/user/login', request)
				.success(function(res) {
					console.log("response is: " + JSON.stringify(res));
					localStorage.setItem('User', JSON.stringify(res));
					$scope.loggedIn = true;

					if ( $location.search().verifyEmail ) { // failsafe
						window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
					} else {
						window.location.href = '/';
					}
				})
				.error(function(err) {
					console.error(err);
				});

			};

		}]);
}());