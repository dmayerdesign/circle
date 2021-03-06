(function(_) {
	angular.module('Circle')
		.controller('loginController', ['$scope', '$rootScope', '$state', '$location', '$http', 'init',
													 function( $scope,   $rootScope,   $state,   $location,   $http,   init) {

			$rootScope.currentState = 'login';
			$rootScope.location = $location;

			$rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
			if ($rootScope.user && $rootScope.user.email) {
				$state.go('main');
				return;
			}
			
			init.initFinal(_("body"));

			$scope.demoUsers = ["alex", "amy", "avy", "dave", "hamid", "rain"];

			$scope.logIn = function(alreadyLoggedIn, demoCredentials) {
				$scope.login = alreadyLoggedIn ? JSON.parse(localStorage['User']) : $scope.login;
				
				console.log(demoCredentials);
				if (demoCredentials && typeof demoCredentials !== 'undefined') {
					$scope.login = demoCredentials;
				}

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
}(jQuery));