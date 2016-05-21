(function() {
	angular.module('Circle')
	.controller('verifyEmailController', ['$scope', '$state', '$http', 'init', function($scope, $state, $http, init) {

	/** SPECIAL FOR THIS CONTROLLER: validate email **/
		if ( getParameterByName("email") && getParameterByName("verifyEmail") ) {
			var emailParam = getParameterByName("email");
			var codeParam = getParameterByName("verifyEmail");

			/**/
			/** INITIALIZE THE USER
			/**/
			if ( localStorage['User'] ) {
				var localUser = JSON.parse(localStorage['User']);
				if ( localUser.email ) {
					$scope.user = localUser;
					$scope.loggedIn = true;

					if ( $scope.user.emailVerification !== codeParam ) {
						console.log( $scope.user.emailVerification + " should equal " + codeParam );
						//localStorage.clear();
						//window.location.href = '/?email=' + emailParam + "&verifyEmail=" + codeParam + "/#/login";
					}

					if ( $scope.user.isEmailVerified ) {
						console.log("email is already verified!");
						$state.go('main');
						return;
					}
				}
			}
			
			if ( !$scope.user || !$scope.user._id ) {
				window.location.href = '/?email=' + emailParam + "&verifyEmail=" + codeParam + "/#/login";
				return;
			}
			/* END USER INIT */

			$http.post('api/user/verifyEmail', {code: codeParam, userId: $scope.user._id}).then(function(response) {
				if ( response.data.isEmailVerified ) {
					$scope.user.isEmailVerified = true;
					$state.go('main');
				}
			});
		}

		function getParameterByName(name, url) { if (!url) url = window.location.href; name = name.replace(/[\[\]]/g, "\\$&"); var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url); if (!results) return null; if (!results[2]) return null; return decodeURIComponent(results[2].replace(/\+/g, " ")); }
		/** END email validation **/

	}]);
}());