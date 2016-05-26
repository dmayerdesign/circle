(function() {
	angular.module('Circle')
	.controller('verifyEmailController', ['$scope', '$rootScope', '$location', '$state', '$http', 'init',
															 function( $scope,   $rootScope,   $location,   $state,   $http,   init) {

	$rootScope.currentState = 'verify-email';

		console.log($location);

	/** SPECIAL FOR THIS CONTROLLER: validate email **/
		if ( $location.search().email && $location.search().verifyEmail ) {
			var emailParam = $location.search().email;
			var codeParam = $location.search().verifyEmail;

			/**/
			/** INITIALIZE THE USER
			/**/
			if ( localStorage['User'] ) {
				var localUser = JSON.parse(localStorage['User']);
				if ( localUser.email ) {
					$scope.user = localUser;
					$scope.loggedIn = true;

					if ( $scope.user.emailVerification && $scope.user.emailVerification !== codeParam ) {
						console.log( $scope.user.emailVerification + " should equal " + codeParam + ", but it doesn't!" );
						localStorage.clear();
						window.location.href = '/#/login?email=' + emailParam + "&verifyEmail=" + codeParam;
					}

					if ( $scope.user.isEmailVerified ) {
						console.log("email is already verified!");
						$state.go('main');
						return;
					}
				}
			}

			if ( !$scope.user || !$scope.user._id ) {
				window.location.href = '/#/login?email=' + emailParam + "&verifyEmail=" + codeParam;
				return;
			}
			/* END USER INIT */

			$http.post('api/user/verifyEmail', {code: codeParam, userId: $scope.user._id}).then(function(response) {
				console.log( response.data );

				if ( response.data.isEmailVerified ) {
					$scope.user.isEmailVerified = true;
					
					$state.go('main');
				}
			});
		}

		/** END email validation **/

	}]);
}());