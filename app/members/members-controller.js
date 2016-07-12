(function(_) {
	angular.module('Circle')
	.controller('membersController', ['$scope', '$rootScope', '$location', '$state', '$stateParams', '$http', 'init', 
													    function( $scope,   $rootScope,   $location,   $state,   $stateParams,   $http,   init) {

		// $rootScope.user = localStorage['User'] && localStorage['User'] !== "undefined" && JSON.parse(localStorage['User']);
		// $rootScope.currentCircle = localStorage['Current-Circle'] && localStorage['Current-Circle'] !== "undefined" && JSON.parse(localStorage['Current-Circle']);
		// if (!$rootScope.user || !$rootScope.user.email) {
		// 	$state.go('signup');
		// 	return;
		// }
		// $rootScope.loggedIn = true;
		// init.app($rootScope.user._id, false, function(user, circle) {
		// 	$rootScope.user = user;
		// 	if ( !$rootScope.user.isEmailVerified ) {
		// 		console.log("email is not verified");
		// 		if ( $location.search().email && $location.search().verifyEmail ) {
		// 			window.location.href = '/#/verify-email?email=' + $location.search().email + "&verifyEmail=" + $location.search().verifyEmail;
		// 		}
		// 		$scope.emailVerificationSent = true;
		// 		$state.go('signup');
		// 		return;
		// 	}
		// 	if (circle) {
		// 		$rootScope.circleJoined = true;
		// 		$rootScope.currentCircle = circle;
		// 		$rootScope.circles = localStorage['Circles'] && localStorage['Circles'].length && JSON.parse(localStorage['Circles']);
		// 		init.getMembers(circle.accessCode, function(members) {
		// 			$rootScope.users = members;
		// 		});
		// 		init.getPosts(circle._id, function(posts) {
		// 			$scope.posts = posts;
		// 			$scope.postsAllowed = {allow: 20};

		// 			init.getTags(circle._id, function(tags) {
		// 				$rootScope.categories = tags;
		// 			});
		// 		});

		// 	} else {
		// 		$rootScope.circleJoined = false;
		// 		$state.go('createCircle');
		// 	}
		// });


	}]);
}(jQuery));