(function(_) {
	angular.module('Circle')
		.controller('signupController', ['$scope', '$state', '$http', 'init', function($scope, $state, $http, init) {

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

			$scope.createUser = function() {
				if ( !$scope.passwordsMatch || $scope.passwordTooShort ) {
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
					user.emailVerification = code;

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
						jQuery.get("email/verify/" + email + "/" + code).done(function(data) {
							console.log(email);
							console.log(code);
							console.log($scope.newUser);

							$scope.emailVerificationSent = true;
							$scope.$apply();
						}).fail(function(err) {
							console.error("Something went wrong while sending the verification email. Data:" + err)
						});
					}
				}

				function makeVerCode() { var text = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for ( var i=0; i < 18; i++ ) { text += possible.charAt(Math.floor(Math.random() * possible.length)); } return text; }
			};

			$scope.signupJoinCircle = false;

			// var verticallyCenter = setInterval(function() {
			// 	if ( _(".setup-form-container").length ) {
			// 		_(".setup-form-container").css({
			// 			top: (window.innerHeight / 3) + "px",
			// 			opacity: 1
			// 		});
			// 		clearInterval(verticallyCenter);
			// 	}
			// }, 500);


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