(function(_) {
	angular.module('Circle')
		.controller('signupController', ['$scope', '$rootScope', '$state', '$http', 'init',
														function( $scope,   $rootScope,   $state,   $http,   init) {

			$rootScope.currentState = 'signup';

			/**/
			/** INITIALIZE THE USER
			/**/
			if ( localStorage['User'] && JSON.parse(localStorage['User']) ) {
				var localUser = JSON.parse(localStorage['User']);
				if ( localUser.isEmailVerified ) {
					$state.go('main');
				} else {
					$scope.emailVerificationSent = true;
				}
			}
			/* END USER INIT */

			init.initFinal(_("body"));

			$scope.confirmPassword = function() {
				if ( !$scope.newUser || !$scope.newUser.password || !$scope.passwordConf || $scope.newUser.password !== $scope.passwordConf || !$scope.newUser.password.length ) {
					$scope.passwordsMatch = false;
					return;
				}
				if ( $scope.newUser.password === $scope.passwordConf ) {
					$scope.passwordsMatch = true;
				}
			};

			$scope.validatePassword = function() {
				if ( !$scope.newUser || !$scope.newUser.password || !$scope.newUser.password.length || $scope.newUser.password.length >= 8 ) {
					$scope.passwordTooShort = false;
					return;
				}
				if ( $scope.newUser.password.length < 8 ) {
					$scope.passwordTooShort = true;
				}
			};

			$scope.validateUsername = function(event) {
				$scope.usernameAvailable = false;
				$scope.usernameInvalid = false;

				if ( $scope.newUser && $scope.newUser.username && $scope.newUser.username.length ) {
					$scope.validationStarted = true;
				} else {
					$scope.validationStarted = false;
				}

				if ( event && event.target.className.indexOf("ng-invalid-pattern") > -1 ) {
					$scope.validationStarted = true;
					$scope.usernameInvalid = true;
					return;
				}

				if ( !$scope.newUser || !$scope.newUser.username ) {
					$scope.validationStarted = false;
					return;
				}
				$http.get('api/users/getUser?username=' + $scope.newUser.username)
				.then(function(response) {
					var user = response.data;
					if ( user && user.username ) {
						$scope.usernameAvailable = false;
						console.log("found a user?");
					} else {
						$scope.usernameAvailable = true;
					}
				}, function(error) {
					$scope.usernameAvailable = true;
					console.log("there was an error");
				});

			};

			$scope.createUser = function() {
				var scope = this;
				var user = scope.newUser;
				var accessCode = scope.newUser.accessCode;
				var accessAnswer = scope.newUser.accessAnswer;
				var emailVerCode = makeVerCode();
				var circleCredentials;
				user.emailVerification = emailVerCode;

				scope.loading = true;

				if ( !scope.passwordsMatch || scope.passwordTooShort || !scope.newUser.email || !scope.newUser.username ) {
					return;
				}

				if ( !scope.signupJoinCircle ) {
					scope.signupJoinCircle = true;
					return;
				}

				$http.post('api/user/signup', user)
				.then(function(res) {
					if ( res.data.userExists ) {
						scope.userExists = true;

						setTimeout(function() {
							$state.go('login');
							scope.loading = false;
						}, 3000);

						return;
					}

					if ( accessCode && accessAnswer ) {
						circleCredentials = {
							accessCode: accessCode,
							accessAnswer: accessAnswer
						};

						init.joinCircle( res.data, circleCredentials, function(user, circle) {
							scope.loggedIn = true;
							$rootScope.user = user;
							$rootScope.currentCircle = circle;
							$rootScope.circleJoined = true;

							var circles = {};
							circles[circle.accessCode] = circle;
							localStorage.setItem('Circles', JSON.stringify(circles));

							sendVerificationEmail(user.email, emailVerCode);
						});
					} else {
						localStorage.setItem('User', JSON.stringify(res.data));
						sendVerificationEmail(user.email, emailVerCode);
					}
				});

				// SEND VERIFICATION EMAIL
				function sendVerificationEmail(email, code) {
					jQuery.get("email/verify/" + email + "/" + code)
					.done(function(data) {
						console.log(email);
						console.log(code);
						console.log($scope.newUser);

						$scope.emailVerificationSent = true;
						$scope.loading = false;
						$scope.$apply();
					})
					.fail(function(err) {
						console.error("Something went wrong while sending the verification email. Data:" + err);
					});
				}
				// }

				function makeVerCode() { var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for ( var i=0; i < 18; i++ ) { text += possible.charAt(Math.floor(Math.random() * possible.length)); } return text; }
			};

			$scope.signupJoinCircle = false;

			/* intro animations */
			$scope.introAnimation = function() {
				var that = this;
				setTimeout(function() {
					that.justTheCircle = true;
					that.$apply();
				}, 300);
				setTimeout(function() {
					that.welcomeText = true;
					that.$apply();
				}, 1600);
				setTimeout(function() {
					that.introFinished = true;
					that.$apply();
				}, 3200);
			};
			$scope.introAnimation();

			/* END intro animations */
			
		}]);
}(jQuery));