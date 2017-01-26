var http = require('http');
var fs = require('fs');

if(!fs.existsSync('applist.json')) {
	var httpParams = {
		host: 'api.steampowered.com',
		path: '/ISteamApps/GetAppList/v0001/',
		accept: 'application/json'
	};
	
	http.request(httpParams, writeToAppList).end();
}
else {
	console.log('applist already exists');
}

function writeToAppList(response) {
	var data = '';

	response.on('data', function dataReceived(chunk) {
		data += chunk;
	});

	response.on('end', function handleResponse() {
		try {
			fs.writeFile('applist.json', JSON.parse(JSON.stringify(data)), function(err) {
				if(err) {
					console.error(err);
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
	});
}