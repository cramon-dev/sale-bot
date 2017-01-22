var discord = require('discord.js');
var client = new discord.Client();
var token = 'MjcxODQ1MDI5NTE1ODg2NTkz.C2NFpQ.tCyutpun-zbAlJi2NlmZd8j1v1k';
var http = require('http');
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('applist.json', 'utf8'));
var numTimesFailed = 0;

var reduceNumTimesFailed = setInterval(function() {
	if(numTimesFailed > 0) {
		console.log('calming down.. numTimesFailed now ' + numTimesFailed);
		numTimesFailed--;
	}
}, 15000);

client.on('ready', function() {
	console.log('Sale bot logged in, updating applist');

	// var httpParams = {
	// 	host: 'api.steampowered.com',
	// 	path: '/ISteamApps/GetAppList/v0001/'
	// };

	// http.request(httpParams, function(response) {
	// 	var data = '';

	// 	response.on('data', function (chunk) {
	// 		data += chunk;
	// 	});

	// 	response.on('end', function () {
	// 		try {
	// 			fs.writeFileSync('applist.json', data);
	// 		}
	// 		catch (ex) {
	// 			console.error(ex);
	// 		}
	// 	});
	// }).end();
});

client.on('message', function(msg) {
	var regexp = /^\!sale[^\w](.+)$/i;
	var match = msg.content.match(regexp);
	var applist = obj.applist.apps.app;
	var appid, gameTitle;

	if(match == null) {
		return;
	}
	else {
		gameTitle = match[1];
	}

	for(var i in applist) {
		if(applist[i].name.indexOf(gameTitle) > -1) {
			appid = applist[i].appid;
			break;
		}
	}

	if(appid == null) {
		if(numTimesFailed < 4) {
			msg.reply('Game not found, try again');
		}
		else {
			msg.reply('If you\'re going to keep making garbage requests, I won\'t help you');
		}

		numTimesFailed++;
		return;
	}

	console.log('Attempting to get sale info for app id ' + appid);

	var httpParams = {
		host: 'store.steampowered.com',
		path: '/api/appdetails/?appids=' + appid
	};

	http.request(httpParams, function(response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			var gameDetails = JSON.parse(str);

			if(gameDetails[appid].data != null && gameDetails[appid].data.price_overview != null) {
				var initPrice = (gameDetails[appid].data.price_overview.initial / 100);
				var origPrice = (gameDetails[appid].data.price_overview.final / 100);
				var percentDiscount = gameDetails[appid].data.price_overview.discount_percent;

				var formattedSalePrice = initPrice.toLocaleString("en-US", { style: "currency", currency: "USD" });

				if(percentDiscount > 0) {
					msg.reply('\n\nCurrent sale price of ' + gameTitle + ': \*\*' + 
						formattedSalePrice + '\*\*\nDiscount percent: \*\*-' + percentDiscount + '%\*\*' + 
						'\nhttp://store.steampowered.com/app/' + appid);
				}
				else {
					msg.reply('Sorry, \*' + gameTitle + '\* is not on sale right now');
				}
			}
			else {
				msg.reply('Something went wrong with your request, maybe that game is free or doesn\'t exist?');
			}
		});
	}).end();
});

client.on('error', function(err) {
	console.log(err);
});

client.login(token).then(function(token) {
		console.log('sale bot logged in with token: ' + token);
	})
	.catch(function(err) {
		console.log('something went wrong logging in');
		console.log(err);
	});