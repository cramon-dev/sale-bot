var http = require('http');
var fs = require('fs');

if(!fs.existsSync('applist.json')) {
	var httpParams = {
		host: 'api.steampowered.com',
		path: '/ISteamApps/GetAppList/v0001/',
		accept: 'application/json'
	};

	http.request(httpParams, function(response) {
		var data = '';

		response.on('data', function (chunk) {
			data += chunk;
		});

		response.on('end', function () {
			try {
				fs.writeFile('applist.json', JSON.parse(JSON.stringify(data)), function(err) {
					if(err) {
						throw err;
					}
					else {
						console.log('applist successfully created');
					}
				});
			}
			catch (ex) {
				console.error(ex);
			}

			//process.exitCode = 0;
		});
	}).end();
}