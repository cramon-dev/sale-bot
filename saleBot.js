var discord = require('discord.js');
var client = new discord.Client();
var http = require('http');
var fs = require('fs');
var token = fs.readFileSync('saleBotToken.txt', 'utf8');
var masterAppList = JSON.parse(fs.readFileSync('applist.json', 'utf8'));
var numTimesFailed = 0;

var reduceNumTimesFailed = setInterval(function() {
	if(numTimesFailed > 0) {
		console.log('calming down.. numTimesFailed now ' + numTimesFailed);
		numTimesFailed--;
	}
}, 15000);

client.on('ready', function() {
	console.log('Sale bot logged in');
});

client.on('message', function(msg) {
	var regexp = /^\!sale[^\w](.+)$/i;
	var match = msg.content.match(regexp);
	var list = masterAppList.applist.apps.app; // i wish valve could update their naming conventions so this isn't so clunky
	var appid, gameTitle;

	if(match == null) {
		return;
	}
	else {
		gameTitle = match[1];
	}

	for(var i in list) {
		if(list[i].name.indexOf(gameTitle) > -1) {
			appid = list[i].appid;
			break;
		}
	}

	if(appid == null) {
		if(numTimesFailed < 4) {
			msg.reply('Game not found, I am currently unable to ignore case; keep that in mind and try again');
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
		var gameData = '';

		response.on('data', function (chunk) {
			gameData += chunk;
		});

		response.on('end', function () {
			var gameDetails = JSON.parse(gameData);

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
				msg.reply('\n\nCurrent price of ' + gameTitle + ': \*\*FREE\*\*\n' +
						'\nDiscount percent: -:100:%' +
						'\nhttp://store.steampowered.com/app/' + appid);
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
		console.error(err);
	});

process.on('SIGINT', function() {
	if(fs.existsSync('applist.json')) {
		fs.unlink('applist.json', function(err) {
			if(err) {
				throw err;
			}
			else {
				console.log('applist removed successfully');
			}
		});
	}

	process.exitCode = 0; // calling process.exit(0) will attempt to exit the process asap, even if there are pending async ops
});