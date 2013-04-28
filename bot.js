// CoinChat bot

var io = require("socket.io-client");
var started = false;
var users = [];
var lastWinner = null;
var socket = io.connect("http://192.155.86.153:8888/");
console.log('Connecting');
socket.on("connect", function() {
    console.log('Connected');
    socket.on("message", function(msg) {
	console.log(msg);
    });
    socket.on("chat", function(data) {
	console.log(data.room + ' | ' + data.user + ' | ' +  data.message);
	setTimeout(function() {
            if (data.message.substring(0, 57) === "<span class='label label-success'>has tipped WhiskDiceBot") {
		if (started === true) {		    
                    var rand = Math.floor(Math.random() * 2); 
		    if (rand === 1) {
			setTimeout(function() {
			    console.log('Won!');
			    setTimeout(function() {
				console.log('Sending');
				var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1) * 1.25);
				socket.emit("chat", {room: 'botgames', message: data.user + ': You win! Sending ' + tip, color: "090"});
				lastWinner = data.user;
			    }, 1500);
			    setTimeout(function() {
				var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1) * 1.25);
				console.log('Emitting');
				socket.emit('tip', {user: data.user, room: 'botgames', tip: tip});
				socket.emit("getbalance", {});
				setTimeout(function() {
                                    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), color: "505"});
				}, 2000);
			    }, 2000);
			}, 2000);
		    }
		    else {
			setTimeout(function() {
			    console.log('Lost');
			    socket.emit("chat", {room: 'botgames', message: data.user + ': Not a winner, sorry! (Rolled: ' + rand + ', required: 1)', color: "505"});
                            socket.emit("getbalance", {});
                            setTimeout(function() {
				socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
				var rand = Math.floor(Math.random() * 4);
				if (rand === 3 && lastWinner) {
				    setTimeout(function() {
                                        socket.emit("chat", {room: 'botgames', message: lastWinner + ': You won this payment!', color: "090"});
					setTimeout(function() {
                                            var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1));
                                            socket.emit('tip', {user: lastWinner, room: 'botgames', tip: tip});
					}, 2000);
				    }, 2000);
				}
                            }, 2000);
			}, 2500);
		    }
                    setTimeout(function() {
                        socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game enabled state: ' + started, color: "000"});
                    }, 3000);
                }
		else {
                    socket.emit("chat", {room: 'botgames', message: '/bold Game not enabled!', color: "505"});
                    var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1));
                    socket.emit('tip', {user: data.user, room: 'botgames', tip: tip});
		}
            }
            if (data.message === "!start" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
		socket.emit("chat", {room: 'botgames', message: '/bold Initializing WhiskDice game (!help for info)', color: "505"});
		socket.emit("getbalance", {});
		setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), color: "505"});
		}, 2000);
		started = true;
		setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game enabled state: ' + started, color: "000"});
		}, 3000);
            }
            if (data.message === "!stop" && data.room === "botgames" && (data.user === "whiskers75" || data.user === "admin")) {
		socket.emit("chat", {room: 'botgames', message: '/bold Stopping WhiskDice game (!help for info)', color: "505"});
		socket.emit("getbalance", {});
		setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), color: "505"});
		}, 2000);
		started = false;
		setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game enabled state: ' + started, color: "000"});
		}, 3000);
            }
            if (data.message === "!fixbugs" && data.room === "botgames") {
		setTimeout(function() {
                    socket.emit('getcolors', {});
		    socket.emit("chat", {room: 'botgames', message: 'Fixed bugs!', color: "090"});
                }, 1000);
            }
            if (data.message === "!users" && data.room === "botgames") {
                setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: users.length + ' online users: ' + users.join(', '), color: "090"});
                }, 1000);
            }
            if (data.message === "!help" && data.room === "botgames") {
                socket.emit("chat", {room: 'botgames', message: data.user + ': Tip this bot to play. 50% chance to win, 1.25x payout if you do win. Do not tip if the balance is not big enough or the game is disabled. Game enabled state: ' + started, color: "505"});
                socket.emit("getbalance", {});
                setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), color: "505"});
                }, 2000);
                setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game enabled state: ' + started, color: "000"});
                }, 3000);
            }
            if (data.message === "!state" && data.room === "botgames") {
                socket.emit("chat", {room: 'botgames', message: data.user + ': Game enabled state: ' + started, color: "505"});
                socket.emit("getbalance", {});
                setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance + ' | Max bet: ' + (balance - 1.5), color: "505"});
                }, 2000);
                setTimeout(function() {
                    socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game enabled state: ' + started, color: "000"});
                }, 3000);
            }
        }, 1000);
    });
    var balance = 0;
    socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + '| Game enabled state: ' + started, color: "000"});
    
    socket.on("balance", function(data) {
        if (data.change) {
            balance = balance + data.change;
        }
        else {
            balance = data.balance;
        }
        console.log('NEW BALANCE: ' + balance);
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
	socket.emit('joinroom', {join: 'botgames'});
        socket.emit("quitroom", {room: "main"});
	setTimeout(function() {
	    socket.on("newuser", function(data) {
		users.push(data.username);
	    });
	    socket.emit("chat", {room: 'botgames', message: '/bold WhiskDiceBot initialized! (!help for info)', color: "090"});
	    socket.emit("getbalance", {});
            socket.emit('getcolors', {});
	    setTimeout(function() {
		socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
                started = true;
	    }, 2000);
	}, 1000);
    });
    
    process.on('SIGTERM', function() {
        setTimeout(function() {
            socket.emit("chat", {room: 'botgames', message: '/bold Stopping WhiskDice game and shutting down. No more bets until another WhiskDice game begins!', color: "505"});
        }, 1000);
        setTimeout(function() {
            socket.emit("chat", {room: 'botgames', message: '/topic Bot Games - !help for help. | Bot balance: ' + balance + ' | Game currently shut down, no more bets please!', color: "000"});
        }, 2000);
        console.log('Shutting down...');
        process.exit(0);
    });
});
socket.on('error', function(err) {
    console.log('Failed to start');
    console.log(err);
    process.exit(1);
});

