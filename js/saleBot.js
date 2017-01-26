var http = require('http');
var fs = require('fs');
var discord = require('discord.js');
var client = new discord.Client();
var token = fs.readFileSync('saleBotToken.txt', 'utf8'); // not ../saleBotToken.txt because cwd is one directory up already due to npm start command
var masterAppList = JSON.parse(fs.readFileSync('applist.json', 'utf8'));

function handleClientMessage(msg) {
	if(msg.author.username == 'sale-bot') return; // not yet sure why there's an additional message by this bot when a user says something

	var appid, gameTitle;
	var match = msg.content.match(/^\!sale[^\w](.+)$/i);
	var list = masterAppList.applist.apps.app; // i wish valve could update their naming conventions so this isn't so clunky
	var inputtedTitle, gameDetailsPromise;

	if(match == null) {
		return;
	}
	else {
		inputtedTitle = match[1].toLowerCase();
	}

	for(var i in list) {
		var moddedGameTitle = (' ' + list[i].name).slice(1).toLowerCase();
		if(moddedGameTitle === inputtedTitle) {
			appid = list[i].appid;
			gameTitle = list[i].name;
			break;
		}
	}

	console.log('Attempting to get sale info for app id ' + appid);

	if(appid == null) {
		msg.reply('Game not found, try again');
		return;
	}

	gameDetailsPromise = new Promise(function promiseCallback(resolve, reject) {
		requestGameDetails(appid, function requestCallback(err, data) {
			if(err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		});
	});

	gameDetailsPromise
		.then(constructReplyMessage)
		.then(function replyToUser(message) {
			msg.reply(message);
		})
		.catch(
			function promiseRejected(err) {
				console.error(err);
				msg.reply('error getting price data for your request');
				reject(err);
			});
}

function constructReplyMessage(gameDetails) {
	var message, error, gameTitle;
	var appid = Object.keys(gameDetails)[0];

	try {
		gameTitle = gameDetails[appid].data.name;

		if(gameDetails[appid].data.price_overview != null) {
			var origPrice = (gameDetails[appid].data.price_overview.initial / 100);
			var finalPrice = (gameDetails[appid].data.price_overview.final / 100);
			var percentDiscount = gameDetails[appid].data.price_overview.discount_percent;

			var salePrice = finalPrice.toLocaleString("en-US", { style: "currency", currency: "USD" });

			if(percentDiscount > 0) {
				message = '\n\nCurrent sale price of ' + gameTitle + ': \*\*' + 
					salePrice + '\*\*\nDiscount percent: \*\*-' + percentDiscount + '%\*\*' + 
					'\nhttp://store.steampowered.com/app/' + appid;
			}
			else {
				message = 'Sorry, \*' + gameTitle + '\* is not on sale right now';
			}
		}
		else {
			if(gameDetails[appid].data.is_free && gameDetails[appid].data.type == 'game') {
				message = '' + gameTitle + ' is \*\*FREE\*\*\n' +
					'\nDiscount percent: -:100:%' +
					'\nhttp://store.steampowered.com/app/' + appid;
			}
			else {
				message = 'Unable to get price data for what you requested';
			}
		}
	}
	catch(err) {
		error = err;
	}

	return new Promise(function(resolve, reject) {
		if(error) {
			reject(error);
		}
		else {
			resolve(message);
		}
	});
}

function requestGameDetails(appid, callback) {
	var httpParams = {
		host: 'store.steampowered.com',
		path: '/api/appdetails/?appids=' + appid
	};

	http.request(httpParams, function handleGameDetails(response) {
		var str = '';

		response.on('data', function onDataReceived(chunk) {
			str += chunk;
		});

		response.on('end', function onResponseEnd() {
			try {
				var gameData = JSON.parse(str);
				return callback(null, gameData);
			}
			catch(err) {
				return callback(err, null);
			}
		});
	}).end();
}

client.on('message', handleClientMessage);

client.on('ready', function() {
	console.log('Sale bot logged in');
});

client.on('error', function(err) {
	console.error(err);
});

client.login(token).then(function(token) {
		console.log('sale bot logged in with token: ' + token);
	})
	.catch(function(err) {
		console.log('error logging in');
		console.error(err);
	});