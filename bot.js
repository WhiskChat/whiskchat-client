// CoinChat bot

var io = require("socket.io-client");
var started = false;
var socket = io.connect("http://192.155.86.153:8888/");
console.log('Connecting');
socket.on("connect", function() {
    console.log('Connected');
socket.on("message", function(msg) {
    console.log(msg);
});
    socket.on("chat", function(data) {
	console.log(data.user + '| ' +  data.message);
	setTimeout(function() {
        if (data.message.substring(0, 57) === "<span class='label label-success'>has tipped WhiskDiceBot") {
            // socket.emit("chat", {room: 'botgames', message: 'Thanks, ' + data.user + ' for the tip amounting to ' + data.message.substring(58, data.message.indexOf('mBTC!') - 1), color: "090"});
	    if (started === true) {
		setTimeout(function() {
		}, 1000);
                var rand = Math.floor(Math.random() * 3); 
		if (rand === 2) {
		    setTimeout(function() {
		    console.log('Won!');
		    setTimeout(function() {
			console.log('Sending');
                        var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1) * 1.1);
                        socket.emit("chat", {room: 'botgames', message: data.user + ': You win! Sending ' + tip, color: "090"});
		    }, 1500);
			setTimeout(function() {
                            var tip = String(data.message.substring(58, data.message.indexOf('mBTC!') - 1) * 1.1);
			    console.log('Emitting');
                            socket.emit('tip', {user: data.user, room: 'botgames', tip: tip});
                            socket.emit("getbalance", {});
                            setTimeout(function() {
                                socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
                            }, 2000);
			}, 2000);
		    }, 2000);
		}
		else {
		    setTimeout(function() {
			console.log('Lost');
			socket.emit("chat", {room: 'botgames', message: data.user + ': Not a winner, sorry! (Rolled: ' + rand + ', required: 2)', color: "505"});
                        socket.emit("getbalance", {});
                        setTimeout(function() {
                            socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
                        }, 2000);
		    }, 2500);
		}
	    }
	}
	if (data.message === "!start" && (data.user === "whiskers75" || data.user === "admin")) {
            socket.emit("chat", {room: 'botgames', message: data.user + ': Initializing WhiskDice game', color: "505"});
            socket.emit("getbalance", {});
            setTimeout(function() {
                socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
            }, 2000);
	    started = true;
	}
        if (data.message === "!stop" && (data.user === "whiskers75" || data.user === "admin")) {
            socket.emit("chat", {room: 'botgames', message: data.user + ': Stopping WhiskDice game', color: "505"});
            socket.emit("getbalance", {});
            setTimeout(function() {
                socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
            }, 2000);
            started = false;
        }
	    }, 1000);
    });
    var balance = 0;
    socket.on("balance", function(data) {
        if (data.change) {
            balance = balance + data.change;
        }
        else {
            balance = data.balance;
        }
        console.log('NEW BALANCE: ' + balance);
	if (balance >= 16) {
            socket.emit('tip', {user: 'whiskers75', room: 'botgames', tip: "1"});
	}
    });
    socket.emit("accounts", {action: "login", username: 'WhiskDiceBot', password: 'WhiskbotMaster'});
    socket.on("loggedin", function(data) {
	var username = data.username;
	socket.emit('getcolors', function(data) {
	    console.log(data);
	});
	socket.emit('joinroom', {join: 'botgames'});
        
    setTimeout(function() {
	socket.emit("chat", {room: 'botgames', message: 'WhiskDiceBot initialized!', color: "090"});
	socket.emit("getbalance", {});
	setTimeout(function() {
	    socket.emit("chat", {room: 'botgames', message: 'Current balance: ' + balance, color: "505"});
	    }, 2000);
    }, 1000);
    });

});
socket.on('error', function(err) {
    console.log('Failed to start');
    console.log(err);
    process.exit(1);
});
    
