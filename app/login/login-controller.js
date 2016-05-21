(function() {
	angular.module('Circle')
		.controller('loginController', ['$scope', '$state', '$http', function($scope, $state, $http) {

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

					if ( getParameterByName("verifyEmail") ) { // failsafe
						window.location.href = '/?email=' + getParameterByName("email") + "&verifyEmail=" + getParameterByName("verifyEmail");
					} else {
						window.location.href = '/';
					}
				})
				.error(function(err) {
					console.error(err);
				});

				function getParameterByName(name, url) { if (!url) url = window.location.href; name = name.replace(/[\[\]]/g, "\\$&"); var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url); if (!results) return null; if (!results[2]) return null; return decodeURIComponent(results[2].replace(/\+/g, " ")); }
			};

		}]);
}());