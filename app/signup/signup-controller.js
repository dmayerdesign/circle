(function(_) {
	angular.module('Circle')
		.controller('signupController', ['$scope', '$rootScope', '$state', '$http', 'init',
														function( $scope,   $rootScope,   $state,   $http,   init) {

			$rootScope.currentState = 'signup';

			/**/
			/** INITIALIZE THE USER
			/**/
			if ( localStorage['User'] ) {
				var localUser = JSON.parse(localStorage['User']);
				if ( localUser.isEmailVerified ) {
					$state.go('main');
				} else {
					$scope.emailVerificationSent = true;
				}
			}
			/* END USER INIT */

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

			$scope.validateUsername = function() {
				if ( $scope.newUser && $scope.newUser.username && $scope.newUser.username.length ) {
					$scope.validationStarted = true;
				}
				$scope.usernameValid = false;

				if ( !$scope.newUser.username ) {
					$scope.validationStarted = false;
					return;
				}
				$http.get('api/users/getUser?username=' + $scope.newUser.username)
				.then(function(response) {
					var user = response.data;
					if ( user && user.username ) {
						$scope.usernameValid = false;
						console.log("found a user?");
					} else {
						$scope.usernameValid = true;
					}
				}, function(error) {
					$scope.usernameValid = true;
					console.log("there was an error");
				});

			};

			$scope.createUser = function() {
				if ( !$scope.passwordsMatch || $scope.passwordTooShort || !$scope.newUser.email || !$scope.newUser.username ) {
					return;
				}

				if ( !$scope.signupJoinCircle ) {
					$scope.signupJoinCircle = true;
					return;
				}

				var user = $scope.newUser;
				var accessCode = $scope.newUser.accessCode;
				var accessAnswer = $scope.newUser.accessAnswer;
				var emailVerCode = makeVerCode();

				$scope.loading = true;

				if ( accessCode && accessAnswer ) {
					init.getCircle(accessAnswer, accessCode, function(circle) {
						console.log("circle:");
						console.log(circle);
						finishSignup(user, emailVerCode, circle);
					});
				} else {
					finishSignup(user, emailVerCode);
				}
				
				function finishSignup(user, code, circle) {
					user["emailVerification"] = code;

					$http.post('api/user/signup', user)
					.then(function(res) {
						if ( res.data.userExists ) {
							$scope.userExists = true;
							setTimeout(function() {
								$state.go('login');
							}, 3000);
							return;
						}

						if ( circle ) {
							init.joinCircle( res.data, circle, function(user, circle) {
								$scope.loggedIn = true;
								$scope.user = user;
								$scope.circle = circle;
								$scope.circleName = circle.name;
								$scope.circleJoined = true;

								var circles = {};
								circles[circle.accessCode] = circle;
								localStorage.setItem('Circles', JSON.stringify(circles));

								sendVerificationEmail(user.email, code);
							});
						} else {
							localStorage.setItem('User', JSON.stringify(res.data));
							sendVerificationEmail(user.email, code);
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
				}

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