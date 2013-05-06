// CoinChat bot

var io = require("socket.io-client");
var started = false;
var random = require("secure_random");
var users = [];
var chatBuffer = [];
var chance = 60;
var edge = 0.85; // EV
var payout = 1.4;
var shutdown = false;
var lastWinner = null;
var socket = io.connect("http://192.155.86.153:8888/");
console.log('Connecting');
socket.on("connect", function() {
    console.log('Connected');
    socket.on("message", function(msg) {
	console.log('SERVER MESSAGE: ' + msg.message);
	if (msg === "You have been banned.") {
	    console.log('Error: Banned!');
	    process.exit(1);
	}
    });
    function chat(room, msg, color) {
	chatBuffer.push({room: room, message: msg, color: color});
    }
    function pm(user, msg, color) {
        chatBuffer.push({room: 'WhiskDiceBot:' + user.toLowerCase(), message: msg, color: color});
    }
    function tip(obj) {
	chatBuffer.push({tipobj: obj});
    }
    setInterval(function() {	
	if (chatBuffer[0]) {
	    if (chatBuffer[0].tipobj) {
		socket.emit("tip", chatBuffer[0].tipobj);
	    }
	    else {
		socket.emit("chat", chatBuffer[0]);
	    }
	    chatBuffer.splice(0, 1);
	}
	else {
	    if (shutdown) {
		console.log('Shutting down...');
	    }
	}
    }, 800);
    var oldchance = chance;
    var oldpayout = payout;
    setTimeout(function() {
	socket.on("chat", function(data) {
	    console.log(data.room + ' | ' + data.user + ' | ' +  data.message + ' (' + data.winbtc + ' mBTC)');
            if (data.message.substring(0, 57) === "<span class='label label-success'>has tipped WhiskDiceBot" && data.room === 'botgames') {
                var message = Number(data.message.substring(data.message.indexOf('message: BOT ') + 12, data.message.indexOf('%) !')));
		if (message > 0 && message < 76) {
		    // yay
		    chance = message;
		    payout = Number((edge / (message / 100)).toFixed(2));
                    chat('botgames', data.user + ': You selected a ' + chance + '% chance, with a ' + payout + 'x payout.', "090");
		}
                if (started === true && (balance > (data.message.substring(58, data.message.indexOf('mBTC') - 1)) * payout)) {
		    random.getRandomInt(1, 100, function(err, rand) {
			if (rand < (chance + 1)) {
			    console.log('Won!');
			    console.log('Sending');
			    var totip = String(Number(data.message.substring(58, data.message.indexOf('mBTC') - 1) * payout).toFixed(2));
			    chat('botgames', data.user + ': You win! Sending ' + totip + '! (' + rand + '/' + chance +')', "090");
			    lastWinner = data.user;
                            tip({user: data.user, room: 'botgames', tip: totip, message: 'You win! Sending ' + totip + '! (' + rand + '/' + chance + ')'});
			}
			else {
			    console.log('Lost');
			    chat('botgames', data.user + ': Not a winner, sorry! (' + chance + '% chance, ' + rand + '/' + chance + ')', "505");
			    /* if ((rand < Math.floor(chance * 1.5)) && lastWinner && (data.message.substring(58, data.message.indexOf('mBTC') - 1) > 0.25)) {
			       chat('botgames', lastWinner + ': You won this payment!', "090");
			       totip = String(data.message.substring(58, data.message.indexOf('mBTC') - 1));
			       tip({user: lastWinner, room: 'botgames', tip: totip});
			       
			       
			       } */
			}
                        chance = oldchance;
                        payout = oldpayout;
		    });
		    
                    socket.emit("getbalance", {});
		    
		}
		else {
                    if ((balance < (data.message.substring(58, data.message.indexOf('mBTC') - 1)) * payout)) {
                        chat('botgames', '/bold Bet exceeds what the bot can pay!', "505");
                        tip({user: data.user, room: 'botgames', tip: String(data.message.substring(58, data.message.indexOf('mBTC') - 1)), message: 'Exceeds balance!'});
		    }
                    else {
			chat('botgames', '/bold Game not enabled!', "505");
		    }
		}
            }
            if (data.message === "!start" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
		chat('botgames', '/bold Initializing WhiskDice game (!help for info)', "505");
		socket.emit("getbalance", {});
		started = true;
		
            }
            if (data.message === "!stop" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
		chat('botgames', '/bold Stopping WhiskDice game (!help for info)', "505");
		socket.emit("getbalance", {});
		started = false;
		
            }
            if (data.message === "!topic" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
                chat('botgames', '/topic The official SatoshiDice for CoinChat! | Admin approved | ' + ((1 - edge) * 100).toFixed(2) + '% house edge! | YOU decide your chances of winning! | !help for info', "000");
            }
            if (data.message === "!shutdown" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
                chat('botgames', '/bold Shutting down bot, no more bets please!', "505");
		shutdown = true;
            }
            if (data.message.substring(0, 4) === "!set" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
		var newOpts = data.message.split(' ');
		if (newOpts[1] > 0 && newOpts[2] > 0) {
		    oldchance = newOpts[1];
		    oldpayout = newOpts[2];
		    chance = newOpts[1];
		    payout = newOpts[2];
                    chat('botgames', '/bold CHANGING PAYOUT/CHANCE! New chance: ' + chance + '% | New payout: ' + payout + 'x' , "505");
		}
	    }
            if (data.message.substring(0, 5) === "!kick" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
                var newOpts = data.message.split(' ');
		if (newOpts[1]) {
                    socket.emit("kick", {action: "kick", room: 'botgames', user: newOpts[1]});
		    chat('botgames', '/bold Kicked ' + newOpts[1], "505");
		}
            }
            if (data.message.substring(0, 7) === "!unkick" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
                var newOpts = data.message.split(' ');
                if (newOpts[1]) {
                    socket.emit("kick", {action: "unkick", room: 'botgames', user: newOpts[1]});
                    chat('botgames', '/bold Unkicked ' + newOpts[1], "090");
                }
            }
            if (data.message.substring(0, 4) === "!get" && data.room === "botgames" && (data.user === "whiskers75")) {
		tip({user: data.user, room: 'botgames', tip: data.message.split(' ')[1]});
            }
            if ((data.message === "!fixbugs" || data.message === "!getcolors") && data.room === "botgames") {
		socket.emit('getcolors', {});
		chat('botgames', 'Called \'getcolors\'.', "090");
            }
            if (data.message === "!lastwinner" && data.room === "botgames") {
		chat('botgames', 'Last winner: ' + lastWinner, "090");
            }
            if (data.message === "!users" && data.room === "botgames") {
		socket.emit('toprooms', {});
            }
            if (data.message === "!bots" && data.room === "botgames") {
		chat('botgames', 'Bots: | WhiskDiceBot (#botgames): A clone of SatoshiDice, with more advanced bet options. !help for info.', "090");
            }
            if (data.message === "!help" && data.room === "botgames") {
		chat('botgames', data.user + ': This is a SatoshiDice clone, for CoinChat! Check !state for chance and payout. Tip this bot to play, with a message "BOT (win percentage)" like "BOT 25%".', "090");
		chat('botgames', data.user + ': Commands: !state to check bot info, !users to list online users, !bots to list bots and how to use them, !lastwinner to see last winner', "090");
                chat('botgames', data.user + ': To use: /tip WhiskDiceBot (amount) BOT (win percentage). Percentage can be anything from 1% to 75%', "090");
		socket.emit("getbalance", {});
		
            }
            if (data.message === "!state" && data.room === "botgames") {
                socket.emit("getbalance", {});
		if (started) {
		    setTimeout(function() {
                        chat('botgames', data.user + ': Game enabled! Balance: ' + balance.toFixed(2) + ' | House edge: ' + ((1 - edge) * 100).toFixed(2) + '%', "090");
		    }, 2000); // Wait for getbalance
		}
		else {
                    chat('botgames', data.user + ': Game disabled. Don\'t bet!', "505");
		}
		
            }
	    
	});
    }, 3000); // Make sure we don't answer any previous stuff!
    var balance = 0;
    
    
    socket.on("balance", function(data) {
        if (data.change) {
            balance = balance + data.change;
        }
        else {
            balance = data.balance;
        }
        console.log('NEW BALANCE: ' + balance);
        //chat('botgames', '/topic Bot Games - !help for help. | Bot balance: ' + balance + '| Game enabled state: ' + started, "000");
        //chat('botgames', 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), "505");
	if (balance >= 15.25) {
	    setTimeout(function() {
		socket.emit('tip', {user: 'whiskers75', room: 'botgames', tip: balance - 15});
	    }, 30000);
	}
    });
    socket.emit("accounts", {action: "login", username: 'WhiskDiceBot', password: process.env.whiskbotpass});
    socket.on("loggedin", function(data) {
	var username = data.username;
	socket.on("joinroom", function(data) {
	    if (data.room === "botgames") {
		users = data.users;
	    }
	});
	// socket.emit('joinroom', {join: 'botgames'});	
        socket.emit("quitroom", {room: "main"});
	socket.on("newuser", function(data) {
	    users.push(data.username);
	});
	setTimeout(function() {
	    chat('botgames', '/bold WhiskDiceBot initialized! (!help for info)', "090");
	    chat('botgames', 'Betting is now enabled! Tip this bot to play.', "090");
            chat('botgames', '/topic The official SatoshiDice for CoinChat! | Admin approved | ' + ((1 - edge) * 100).toFixed(2) + '% house edge (live) | YOU decide your chances of winning! | New and improved bet engine! | !help for info', "000");
	    socket.emit("getbalance", {});
            socket.emit('getcolors', {});
            started = true;
	}, 3000); // Match the setTimeout for the chat engine
	
	
    });
    socket.on('toprooms', function(data) {
	var foundOwnRoom = false;
	data.list.forEach(function(room) {
	    if (room.room === 'botgames') {
                chat('botgames', '/bold #botgames: ' + room.users + ' people online!', '090');
		foundOwnRoom = true;
	    }
	});
	if (!foundOwnRoom) {
            chat('botgames', 'Not on the top rooms list! :(', '505');
	}
    });
    
    process.on('SIGTERM', function() {
        chat('botgames', '/bold Shutting down/rebooting. No more bets please.', "505");
	shutdown = true;
    });
});
socket.on('error', function(err) {
    console.log('Failed to start');
    console.log(err);
    process.exit(1);
});

