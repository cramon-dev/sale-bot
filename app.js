var discord = require('discord.js');
var client = new discord.Client();
var token = 'MjcxODQ1MDI5NTE1ODg2NTkz.C2NFpQ.tCyutpun-zbAlJi2NlmZd8j1v1k';
var http = require('http');
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('applist.json', 'utf8'));
var numTimesFailed = 0;

var reduceNumTimesFailed = setInterval(function() {
	if(numTimesFailed > 0) {
		console.log('calming down..');
		numTimesFailed--;
	}
}, 15000);

client.on('ready', function() {
	console.log('Logged in as ' + client.user.username);
});

client.on('message', function(msg) {
	var regexp = /^\!sale[^\w](.+)$/;
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
			msg.reply('Game not found. Try again.');
		}
		else if(numTimesFailed == 4) {
			msg.reply('If you\'re going to keep making garbage requests, I won\'t help you.');
		}
		else if(numTimesFailed == 5) {
			msg.reply('I\'m warning you, shitbird');
		}
		else {
			msg.reply('FUCC OFF');
		}
		numTimesFailed++;
		return;
	}

	var httpParams = {
		host: 'store.steampowered.com',
		path: '/api/appdetails/?appids=' + appid
	};

	callback = function(response) {
		var str = '';

		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
			str += chunk;
		});

		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {
			var gameDetails = JSON.parse(str);
			var initPrice = (gameDetails[appid].data.price_overview.initial / 100);
			var origPrice = (gameDetails[appid].data.price_overview.final / 100);
			var percentDiscount = gameDetails[appid].data.price_overview.discount_percent;

			var formattedSalePrice = initPrice.toLocaleString("en-US", { style: "currency", currency: "USD" });
			//var formattedOrigPrice = origPrice.toLocaleString("en-US", { style: "currency", currency: "USD" });

			if(percentDiscount > 0) {
				msg.reply('\n\nCurrent sale price of ' + gameTitle + ': \*\*' + 
					formattedSalePrice + '\*\*\nDiscount percent: \*\*-' + percentDiscount + '%\*\*' + 
					'\nhttp://store.steampowered.com/app/' + appid);
			}
			else {
				msg.reply('Sorry, \*' + gameTitle + '\* is not on sale right now');
			}
		});
	}

	http.request(httpParams, callback).end();
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