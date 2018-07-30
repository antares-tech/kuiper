define(function(require) {
	$(function() {
		$.ajax ({
			async : true,
			contentType : 'application/json',
			type : 'POST',
			url    : '/authenticate/oauth2?response_type=code&client_id=akshat&client_secret=lfkasdjf&areq_type=local&redirect_uri=http://localhost:2178/r',
			success : function (_data, textStatus, xhr) {

				console.log (_data);

			},
			error : function (xhr, textStatus, error) {

			}
		});
	});
});
