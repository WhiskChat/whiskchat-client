// WhiskChat v0.1beta

var socket = io.connect('http://192.155.86.153:8888',{resource: 'socket.io', reconnect: false});
var username = "";
var usernames = [];
var lastCheck = new Date("1990");
var hasFocus = true;
var roomToJoin = "";
var forcedc = false;
var annJoin = false; // Don't spam
var fs = false;

var scrollback = [];
var upto = -1;

var spammyness = 0;
var lastMsg = new Date();
var warningLevel = 0;

$(window).focus(function(){
    changeTitle("WhiskChat");
    hasFocus = true;
});
$(window).blur(function(){
    hasFocus = false;
});
setInterval(function(){
    //get quality back to 0
    spammyness *= 0.98;
    spammyness -= 0.05;
    spammyness = Math.max(spammyness, 0);
}, 1250);
$(document).ready(function(){
    if(document.URL.split("j:").length == 2){
	roomToJoin = document.URL.split("j:")[1].split("&")[0];
    }
    if(getCookie("session")){
	socket.emit("login", {session: getCookie("session")});
    } else {
	if(roomToJoin){
	    socket.emit("joinroom", {join: roomToJoin});
	    roomToJoin = "";
	}
    }
    $("#fullscreen").click(function(){
	fs = !fs;
	if(fs){
	    $("#fullscreen").html("-");
	    $("#fullscreen").addClass("btn-primary");
	} else {
	    $("#fullscreen").html("+");
	    $("#fullscreen").removeClass("btn-primary");
	}
	$("#chattext").scrollTop($("#chattext").prop("scrollHeight"));
	moveWin();
    });
    $(window).resize(moveWin);
    $(".hide-guest").hide();
    $("#register-button").click(function(){
	socket.emit("reqbotcheck");
    });
    $("#login-button").click(function(){
	socket.emit("accounts", {action: "login", username: $("#login-username").val(), password: $("#login-password").val()});
    });
    $("#chatinput").keydown(function(event){
	var input = $("#chatinput");
	if(event.keyCode == 13){
	    sendMsg();
	} else if(event.keyCode == 38){
	    if(upto == -1){
		upto = scrollback.length-1
		$("#chatinput").val(scrollback[upto]);
		input[0].selectionStart = input[0].selectionEnd = input.val().length;
	    } else if(upto > 0){
		upto--;
		$("#chatinput").val(scrollback[upto]);
		input[0].selectionStart = input[0].selectionEnd = input.val().length;
	    }
	} else if(event.keyCode == 40){
	    if(upto != -1){
		upto++;
		if(upto != scrollback.length){
		    $("#chatinput").val(scrollback[upto]);
		    input[0].selectionStart = input[0].selectionEnd = input.val().length;
		} else {
		    upto = -1;
		    $("#chatinput").val('');
		}
	    }
	} else if(event.keyCode == 9){
	    var theUsername = $("#chatinput").val().split(" ")[$("#chatinput").val().split(" ").length-1];
	    for(var i in usernames){
		if(theUsername.length > 0 && usernames[i].substr(0, theUsername.length).toLowerCase() == theUsername.toLowerCase()){
		    if($("#chatinput").val().split(" ").length == 1){
			$("#chatinput").val(usernames[i] + ": ");
		    } else {
			var prev = "";
			var splitty = $("#chatinput").val().split(" ");
			for(var j = 0; j < splitty.length-1; j++){
			    prev += splitty[j] + " ";
			}
			$("#chatinput").val(prev + usernames[i] + " ");
		    }
		    break;
		}
	    }
	    event.preventDefault();
	}
    });
    $("#send").click(function(){
	sendMsg();
    });
    
    $("#withdraw").click(function(){
	if($("#withdrawbox").is(":visible")){
	    $("#withdrawbox").hide();
	} else {
	    $("#withdrawbox").show();
	}
    });
    $("#donate").click(function() {
	socket.emit("tip", {room: 'main', user: 'whiskers75', tip: '0.1', message: 'WhiskChat client donation. Thanks!'});
    });
    $("#withdrawbtc").change(function(){
	var btc = $(this).val();
	var get = 0;
	if(btc > 100){get += (btc - 100) * 0.95;btc = 100;}
	if(btc > 75){get += (btc - 75) * 0.9; btc = 75;}
	if(btc > 50){get += (btc - 50) * 0.85; btc = 50;}
	if(btc > 30){get += (btc - 30) * 0.8; btc = 30;}
	if(btc > 20){get += (btc - 20) * 0.75; btc = 20;}
	if(btc >= 13){get += btc * 0.77; btc = 0;}
	$("#withdrawnet").val(Math.floor(get) / 1000 + " BTC (unfair rate)");
    });
    $("#withdrawbtn").click(function(){
	socket.emit("withdraw", {amount: $("#withdrawbtc").val(), address: $("#withdrawaddress").val()});;
    });
    $("#joinroombtn").click(function(){
	$("#joinroombtn").popover('hide');
	$("#joinmodal").modal('show');
	socket.emit("toprooms", {});
	lastCheck = new Date();
    });
    $("#joinroom-join").click(function(){
	if($("#joinroom-room").val().length > 0){
	    socket.emit("joinroom", {join: $("#joinroom-room").val()});
	} else if($("#joinroom-user").val().length > 0){
	    var usrA = [$("#joinroom-user").val().toLowerCase(), username];
	    usrA.sort();
	    socket.emit("joinroom", {join: usrA[0] + ":" + usrA[1]});
	}
	$("#joinmodal").modal('hide');
    });
    $("#style").click(function(){
	$("#stylemodal").modal('show');
	socket.emit("getcolors", {});
    });
    $("#colorhex").keyup(function(){
	if($(this).val().length > 3){
	    $(this).val($(this).val().substr(0,3));
	}
	$("#colordemo").css("color", "#" + $("#colorhex").val());
    });
    $("#buycolor").click(function(){
	socket.emit("buycolor", {color: $("#colorhex").val()});
    });
    var dcTimeout;
    //afk timeout
});
function moveWin(){
    var h = $(window).height() - 6;
    var w = $(window).width() - 6;
    var s296 = 296;
    if(w < 800){
        var noSidebar = true;
        s296 = 0;
    }
    if(fs){
        window.scrollTo(0,0);
        $("#chat").css("position", "absolute");
        $("#chat").css("top", 5);
        $("#chat").css("left", 5);
        $("#chat").css("height", h);
        $("#chat").css("width", w);
        $(".message").css("width", w - s296 - 121 - 30);
        $("#chattext").css("width", w - s296);
        $("#chat .content").css("height", h - 35 - $(".header").height());
        $("body").css("overflow", "hidden");
        $("#chatinput").css("width", w - 250);
        if(noSidebar){
            $("#chatsidebar").css("display", "none");
        } else {
            $("#chatsidebar").css("display", "inline-block");
        }
    } else {
        $("#chat").css("position", "static");
        $("#chat").height(502);
        $("#chat").width(960);
        $(".message").width(525);
        $("#chattext").width(675);
        $("#chat .content").height(430);
        $("body").css("overflow", "auto");
        $("#chatinput").width(686);
        $("#chatsidebar").css("display", "inline-block");
    }
}
var color = "000";
socket.on("getcolors", function(data){
    var newHTML = "";
    for(var i in data){
	newHTML += "<span class='color' data-color='" + data[i] + "' style='color: #" + data[i] + "'>" + data[i] + "</span><br />";
    }
    $("#mycolors").html(newHTML);
    $(".color").click(function(){
	color = $(this).attr('data-color');
	$("#stylemodal").modal('hide');
    });
});
socket.on("disconnect", function(data){
    ///alert("Disconnected from server. Refreshing..");
    callMsg({message: "Disconnected. Refreshing...", type: 'alert-warning'});
    
    setTimeout(function(){document.location.reload(true)}, 1000 + Math.random()*3750);
    
});
socket.on("addcolor", function(data){
    $("#mycolors").append("<span class='color data-color='" + data.color + "' style='color: #" + data.color + "'>" + data.color + "</span><br />");
    $(".color").click(function(){
	color = $(this).attr('data-color');
	$("#stylemodal").modal('hide');
    });
});
socket.on("warn", function(data){
    callMsg({message: "Mod note: \n" + data.message, type: 'alert-warning'});
});
socket.on("chatad", function(data) {
    $("#chattext").append("<div class='chatline' title='Advertisement'><span class='user muted'>Ad</span><span class='message'>" + data.ad + "</span></div>");
    moveWin();
});
socket.on("toprooms", function(data){
    console.log(data);
    var theHTML = "";
    for(var i in data.list){
	theHTML += "<a href='#' class='joinroom' data-room='" + data.list[i].room + "'>" + data.list[i].room + "</a> - " + data.list[i].users + " people online. Topic: <small>" + data.list[i].topic + "</small> <br />";
    }
    $(".joindiv").html(theHTML);
    
    $(".joinroom").click(function(){
	annJoin = true;
	socket.emit("joinroom", {join: $(this).attr("data-room")});
	$("#joinmodal").modal('hide');
    });
});
function sendMsg(){
    if(username != ""){
	var msg = $("#chatinput").val();
	$("#chatinput").val("");
	scrollback.push(msg);
	if(scrollback.length > 5){
	    scrollback = scrollback.slice(scrollback.length-5);
	}
	upto = -1;
	if(msg.substr(0,6) == "/query" || msg.substr(0,3) == "/pm"){
	    var usr = msg.split(" ")[1];
	    var usrStr = [usr.toLowerCase(), username].sort();
	    if(msg.split(" ").length < 3){
		socket.emit("joinroom", {join: usrStr[0] + ":" + usrStr[1]});
	    } 
	    //also send the message
	    var theMsg = msg.split(" ").slice(2).join(" ");
	    socket.emit("chat", {room: usrStr[0] + ":" + usrStr[1], message: theMsg, color: color});
	    
	    return;
	}
	if(msg.substr(0,5) == "/join"){
	    if(msg.split(" ").length==2){
		annJoin = true;
		socket.emit("joinroom", {join: msg.split(" ")[1]});
		return;
	    }		
	}
	if(msg.substr(0,4) == "/bet" && currentRoom == "botgames") {
            if(msg.split(" ").length == 2){
                var tipAmount = msg.split(" ")[0];
                var tipMsg = msg.split(" ")[1];
                callMsg({message: 'System: Betting ' + tipAmount + ' with a ' + tipMsg + 'chance...', type: 'alert-success'});
                socket.emit("tip", {room: 'botgames', user: 'WhiskDiceBot', tip: tipAmount, message: 'BOT ' + tipMsg});
                
            }
	    else {
                callMsg({message: 'Syntax: /bet amount chance%', type: 'alert-success'});
	    }
	}
	    if(msg.substr(0,4) == "/tip"){
		// /tip username 1.25 thank you
		if (msg == '/tip') {
		    callMsg({message: 'Syntax: /tip username amount (message)', type: 'alert-success'});
		    return;
		}
		if(msg.split(" ").length > 2){
		    var tipTo = msg.split(" ")[1];
		    var tipAmount = msg.split(" ")[2];
		    if(msg.split(" ")[3]){
			var tipMsg = msg.split(" ").slice(3).join(" ");
		    } else {
			var tipMsg = "";
		    }
		    callMsg({message: 'System: Tipping ' + tipTo + ' ' + tipAmount + (tipMsg ? '(message: ' + tipMsg + ')' : ''), type: 'alert-success'});
		    socket.emit("tip", {room: currentRoom, user: tipTo, tip: tipAmount, message: tipMsg});
		    return;
		}
	    }
	    if(msg.substr(0,5) == "/kick" || msg.substr(0,7) == "/unkick"){
		if(msg.split(" ").length >= 2){
		    if(msg.substr(0,5) == "/kick"){
			socket.emit("kick", {action: "kick", room: currentRoom, user: msg.split(" ")[1]});
			socket.emit('chat', {room: currentRoom, message: 'Kicked ' + msg.split(" ")[1] + '!', color: "000"});
		    } else {
			socket.emit("kick", {action: "unkick", room: currentRoom, user: msg.split(" ")[1]});
			socket.emit('chat', {room: currentRoom, message: 'Unkicked ' + msg.split(" ")[1] + '!', color: "000"});
		    }
		}
		return;
	    }
	    if(msg.substr(0,5) == "/warn"){
		if(msg.split(" ").length != 2){
		    return;
		}
		var warnMsg = msg.split(" ")[2];
		warnMsg = (warnMsg == "spam" ? "Please do not spam the chat by repeatedly saying short messages, or nonsense. Thanks!" : warnMsg);
		warnMsg = (warnMsg == "quality" ? "Please check your spelling and don't excessively use text speak. The channel main is for English. Thanks!" : warnMsg);
		socket.emit("warn", {target: msg.split(" ")[1], message: warnMsg});
		return;
	    }
	    if(msg.substr(0,5) == "/mute"){
		if(msg.split(" ").length >= 3){
		    var reason = (msg.split(" ").length > 3 ? msg.split(" ").slice(2).join(" ") : "");
		    socket.emit("mute", {mute: msg.split(" ")[2], target: msg.split(" ")[1], room: currentRoom, reason: reason});
		    return;
		}
	    }
	    var secs = Math.max(10-(new Date() - lastMsg) / 1000, 1);
	    if(secs > 8){
		secs *= 1.5;
	    }
	    if(msg.indexOf(" i ") != -1 || msg.indexOf(" u ") != -1){
		secs *= 2;
	    }
	    if(currentRoom != "main"){
		secs *= 0.75;
	    }
	    lastMsg = new Date();
	    spammyness += secs * Math.max(40-msg.length, 1)/40;
	
	    if(checkSpam()){
		return;
	    }
	    
	    socket.emit("chat", {room: currentRoom, message: msg, color: color});
	} else {
	    alert("Please register or log in to chat!");
	}
    }
    function checkSpam(){
	if(warningLevel < 1 && spammyness > 30){
	    alert("Hi!\nWe are a chat network with rewards, not a faucet with chat. Please keep this in mind, it is not about saying as many lines as you can.\n\nOur reward algorithm takes in many things into account, and your chances of getting a reward may drop as low as 0%.\n\nThanks.");
	    spammyness = 15;
	    warningLevel++;
	    return true;
	} else if(warningLevel < 2 && spammyness > 25){
	    alert("Please do not spam. Say everything you want to say in one line, not multiple lines.");
	    spammyness = 15;
	    warningLevel++;
	    return true;
	} else if(spammyness > 35){
	    spammyness = 20;
	    alert("Seriously, don't spam. Cut down on the amount of lines you're saying.");
	    return true;
	}
	return false;
    }
    function checknew(room, message){
	if(localStorage){
	    if(localStorage.getItem("room-" + room)){
		if(localStorage.getItem("room-" + room) == message){
		    return false;
		}
	    }
	}
	return true;
    }
    socket.on("jointhisroom", function(data){
	if($(".header").children().length > 15){
	    callMsg({type: 'alert-warning', message: 'Someone is trying to PM you, however you\'re in too many rooms!'});
	}
	socket.emit("joinroom", {join: data.room});
    });
    socket.on("message", callMsg);

    function callMsg(data){
	var newId = "m" + Math.round(Math.random() * 10000);
	$("#messages").append("<div class='alert " + data.type + "' id='" + newId + "'>" + data.message + "</div>");
	$("#" + newId).fadeIn();
	setTimeout(function(){
	    $("#" + newId).fadeOut(500);
	}, 5000);
    }
    socket.on("botcheck", function(data){
	var response = prompt(data.prompt);
	socket.emit("botcheck", {id: data.id, response: response});
	var splitted =document.URL.split("r:");
	if(splitted.length == 2){
	    referral = splitted[1].split("&")[0];
	} else {
	    referral = "";
	}
	socket.emit("accounts", {action: "register", username: $("#register-username").val(), password: $("#register-password").val(), password2: $("#register-password2").val(), email: $("#register-email").val(), referredby: referral});
    });
    socket.on("online", function(data){
	$("#online").html(data.people + " people online");
    });
    var roomHTML = [];
    var users = [];
    var currentRoom = "";
    function updateSidebar(){
	if(currentRoom == "main"){
            $("#chatsidebar").html("<div class='alert alert-success' style='width: 210px; margin-left: 0px; margin-right: 10px; margin-top: 10px'><strong>WhiskChat Client enabled!</strong></div>");
	} else if(users[currentRoom]){
            $("#chatsidebar").html("");
            for(var i in users[currentRoom]){
		$("#chatsidebar").prepend("<div class='sideuser'>" + users[currentRoom][i] + "</div>");
            }
            $("#chatsidebar").prepend("<div class='alert alert-warning' style='width: 210px; margin-left: 0px; margin-right: 10px; margin-top:7px; margin-bottom: 4px'>Link to this room:<br /><input type='text' readonly style='font-size:75%; margin-bottom:0; padding-bottom:0; padding-top: 0' value='http://coinchat.org/j:" + currentRoom + "' /></div>");
            $(".sideuser").click(function(){
		if($(this).html().split(" ")[0] != username){
                    var sA = [$(this).html().split(" ")[0].toLowerCase(), username].sort();
                    socket.emit("joinroom", {join: sA[0] + ":" + sA[1]});
		}
            });
	} else {	
	}
    }
    socket.on("newuser", function(data){
	if(users[data.room] && users[data.room].indexOf(data.username) == -1){
	    users[data.room].push(data.username);
	}
	updateSidebar();
    });
    socket.on("joinroom", function(data){
	if(data.room != "main"){
	    clearTimeout(myTimeout);
	}
	if(!roomHTML[data.room]){
	    roomHTML[data.room] = "";
	    //switch to room maybe
	    if(data.room.indexOf(":") == -1){
		users[data.room] = [];
		for(var i in data.users){
		    users[data.room].push(data.users[i]);
		}
		if(data.room != "main" && data.room != "botgames"){
		    $(".header").append(" <span class='roombtn btn' data-room='" + data.room + "' onclick='switchRoom(this)'>" + data.room + " <span class='quit close muted' data-room='" + data.room + "'>&times;</span></span>");
		} else {
		    $(".header").append(" <span class='roombtn btn btn-success' data-room='" + data.room + "' onclick='switchRoom(this)'>" + data.room + "</span>");
		}
	    } else {
		var otherUser = (data.room.split(":")[0].toLowerCase() == username.toLowerCase() ? data.room.split(":")[1] : data.room.split(":")[0]); 
		$(".header").append(" <span class='roombtn btn' data-room='" + data.room + "' onclick='switchRoom(this)'>" + otherUser + " <span class='quit close muted' data-room='" + data.room + "'>&times;</span></span>");
	    }
	    $(".quit[data-room='" + data.room + "']").click(function(event){
                socket.emit("chat", {room: $(this).attr("data-room"), message: '!; quitroom', color: '000'});
		socket.emit("quitroom", {room: $(this).attr("data-room")});
		event.stopPropagation();
	    });
	    if(currentRoom == ""){
		//let's switch to this room
		currentRoom = data.room;
		$("#chattext").html(roomHTML[data.room]);
		$(".roombtn[data-room='" + data.room + "']").addClass('btn-primary');
	    } else if(typeof data.switch == "undefined"){
		switchRoom(".roombtn[data-room='" + data.room + "']");
	    }
	}
	console.log("joinroom: " + data.room);
	if (annJoin) {
            socket.emit("chat", {room: data.room, message: '!; joinroom', color: '000'})
	}
	updateSidebar();
    });
socket.on("quitroom", function(data){
	$(".roombtn[data-room='" + data.room + "']").remove();
	if(currentRoom == data.room){
	    switchRoom($(".roombtn[data-room=main]"));
	}
	delete roomHTML[data.room];
	delete users[data.room];
	
    });
    function switchRoom(obj){
	$(".roombtn.btn-primary").removeClass("btn-primary");
	$(obj).addClass('btn-primary');
	$(obj).removeClass('btn-warning');
	roomHTML[currentRoom] = $("#chattext").html();
	currentRoom = $(obj).attr("data-room");
	$("#chattext").html(roomHTML[currentRoom]);
	if(roomHTML[currentRoom].length == 0){
	    $("#chattext").html("<div class='silent'><h2 class='muted' style='text-align: center'>It's quiet here</h2><div class='muted' style='text-align: center'>Break the ice!</div></div>");
	}
	$("#chattext").scrollTop($("#chattext")[0].scrollHeight);
	try {
	    log($(".chatline").last().find('.message').html().split("<span class=\"foo\"></span>")[0], currentRoom);
	} catch (err) {
	    
	}
	$(".tipbutton").unbind().click(function(){
	    if($(this).attr("data-user") != username){
		var tipHowMuch = prompt("How much mBTC to tip to " + $(this).attr("data-user") + "?");
		socket.emit("tip", {user: $(this).attr("data-user"), room: currentRoom, tip: tipHowMuch});
	    }
	});
	updateSidebar();
	moveWin();
    }
    socket.on("chat", function(data){
	if (data.user == '!Topic') {
	    data.user == '';
	}
	if (data.message == '!; connect') {
	    data.message = "<span class='label label-success'>connected to CoinChat.</span>"
	}
        if (data.message == '!; joinroom') {
            data.message = "<span class='label label-success'>joined the room.</span>"
        }
        if (data.message == '!; quitroom') {
            data.message = "<span class='label label-important'>left the room.</span>"
        }
        if(data.user != "" && !checkLog(data.room, data.message)){
	    if(currentRoom != data.room && data.room != "botgames" && data.room != "main"){
		$(".roombtn[data-room='" + data.room + "']").addClass("btn-warning");
	    }
	    if(data.room.indexOf(":") != -1 && data.user != username && !hasFocus) {
		startFlashing("Chat from " + data.user);
            } else if(data.room.indexOf(":") == -1 && !hasFocus){
	    }
	} else if(data.user != "!Topic"){
	    $(".roombtn[data-room='" + data.room + "']").removeClass("btn-warning");
	    changeTitle("CoinChat");
	}
	if(data.message.toLowerCase().indexOf(username.toLowerCase()) != -1 && username.length > 0){ 
	    if(!focus){
		startFlashing("Mentioned by " + data.user);
	    }
	}
	if(usernames.indexOf(data.user) == -1){
	    usernames.push(data.user);
	}
	if(data.winbtc > 0){
	    if(data.winbtc == 0.01){
		var label = "label-warning";
	    } else if(data.winbtc == 0.02){
		var label = "label-success";
		data.winbtc = data.winbtc + " (nice) ";
	    } else {
		var label = "label-important";
		data.winbtc = data.winbtc + " (wow, congrats!) ";
	    }
	    var winBTCtext = " <span class='label " + label + "'>+" + data.winbtc + " mBTC!</span>";
	} else {
	    var label = "label-important";
            var winBTCtext = ""
	}
	if (data.user == "moobot") {
            var label = "label-important";
            var winBTCtext = " <span class='label " + label + "'>(evil)</span>";
	}
	if(data.message.toLowerCase().indexOf(username.toLowerCase()) != -1 && username.length > 0){
            winBTCtext += " <span class='label label-success'>Mentioned!</span> ";
            if(!focus){
		startFlashing("Mentioned by " + data.user);
            }
	}
	
	if(data.user == username){
	    var m = "";
	} else {
	    var m = "";
	}
	//Yes, I know we already have a lot of code here, but I need to plug it here
	if(data.message.indexOf("#") != -1){
	    var newDm = "";
	    var msgHash = data.message.split(" ");
	    for(var i = 0; i < msgHash.length; i++){
		if(msgHash[i].indexOf("#") == 0 && msgHash[i].indexOf("'") == -1 && msgHash[i].indexOf('"') == -1){
		    newDm += "<a href='#' onclick='srwrap(\"" + msgHash[i].substr(1) + "\")'>" + msgHash[i] + "</a> ";
		} else {
		    newDm += msgHash[i] + " ";
		}
	    }
	    data.message = newDm;
	}
	var dateFormat = " <span class='time muted'>time " + new Date(data.timestamp).getHours() + ":" + (String(new Date(data.timestamp).getMinutes()).length == 1 ? "0" + new Date(data.timestamp).getMinutes() : new Date(data.timestamp).getMinutes()) + "</span> <button class='btn hide btn-mini tipbutton pull-right' data-user='" + data.user + "'>Tip mBTC</button>";
	if(currentRoom == data.room){
	    $(".silent").remove();
	    $("#chattext").append("<div class='chatline' title='" + data.timestamp + "'><span class='user' data-user='" + data.user + "'><span>" + data.user + "</span>&nbsp;&nbsp;</span><span class='message'>" + data.message + winBTCtext + dateFormat + "</span></div>");
	    while($("#chattext").children().length > 200){
		$("#chattext .chatline:first-child").remove();
	    }
	    log(data.message.split("<span class=\"foo\"></span>")[0], currentRoom);
	    
	    if((!fs && $("#chattext").scrollTop() + 520 >= $("#chattext").prop('scrollHeight')) || (fs && $("#chattext").scrollTop() + $(window).height() >= $("#chattext").prop('scrollHeight'))){
		$("#chattext").animate({ scrollTop:$("#chattext").prop('scrollHeight') }, "slow");
	    }
	    $(".chatline").hover(function(){
		$(this).find(".tipbutton").show();
	    }, function(){
		$(this).find(".tipbutton").hide();
	    });
	    $(".tipbutton").unbind().click(function(){
		if($(this).attr("data-user") != username){
		    callMsg({message: "System: Use the /tip command.", type: 'alert-warning'});
		    moveWin();
		}
		
	    });
	} else if(roomHTML[data.room] != undefined || data.room.indexOf(":") == -1){
	    if(!roomHTML[data.room]){
		roomHTML[data.room] = "";
	    }
	    roomHTML[data.room] += "<div class='chatline' title='" + data.timestamp + "'><span class='user' onclick='clickUser($(this).attr(\"data-user\"))' data-user='" + data.user + "'><span>" + data.user + "</span></span><span class='message" + m + "'>" + data.message + "<span class='foo'></span>" + winBTCtext + dateFormat + "</span></div>";
	} else {
	    console.log("Alert: Chat message for room that I am not in! " + data.room);
	}
	moveWin();
	
    });
    function log(message, room){
	if(!localStorage){
	    return false;
	}
	localStorage.setItem("room-" + room, message);
    }
    function checkLog(room, message){
	if(!localStorage){
	    return false;
	}
	message = message.replace(/'/g, '\"');
	if(localStorage.getItem("room-" + room) && localStorage.getItem("room-" + room).replace(/'/g, '\"') == message){
	    return true;
	} else if(message.indexOf("best route") != -1){
	    console.log(localStorage.getItem("room-" + room) + " EXPECTED: " + message);
	}
	return false;
    }
    function clickUser(clickUsername){
	if(clickUsername != username){
	    var sA = [clickUsername.toLowerCase(), username].sort();
	    if(!$(".roombtn[data-room='" + sA[0] + ":" + sA[1] + "']").length){
		socket.emit("joinroom", {join: sA[0] + ":" + sA[1]});
	    } else {
		switchRoom($(".roombtn[data-room='" + sA[0] + ":" + sA[1] + "']"));
	    }
	}
    }
    var myTimeout;
    socket.on("loggedin", function(data){
	setCookie("session", data.session, 14);
	$("#login").hide();
	$("#user").show();
	$("#username").html(data.username);
	$("#referrallink").append("r:" + data.username);
	$(".hide-guest").show();
	if(roomToJoin){
    	    if(!roomHTML[roomToJoin]){
		console.log(roomToJoin);
		socket.emit("joinroom", {join: roomToJoin});
		roomToJoin = "";
    	    }
	    
	}
	username = data.username;
	srwrap('botgames');
	setTimeout(function() {
	    socket.emit('chat', {room: 'main', message: '!; connect', color: "000"});
	}, 2000);
    });
    socket.on("balance", function(data){
	if(typeof data.balance != 'undefined'){
	    $("#balance").html(Math.round(data.balance*1000)/1000);
	} else {
	    $("#balance").html( Math.round((parseFloat($("#balance").html()) + data.change)*1000)/1000 );
	    if(data.change > 0){
		$("#update").html("+" + data.change + " mBTC!");
		$("#update").fadeIn(500);
		setTimeout(function(){
		    $("#update").fadeOut(500);
		}, 1500);
	    }
	}
    });

    function srwrap(roomName){
	if($(".roombtn[data-room='" + roomName + "']").length){
	    switchRoom($(".roombtn[data-room='" + roomName + "']"));
	    updateSidebar();
	} else {
	    socket.emit("joinroom", {join: roomName});
	}
    }

    // stuff
    function setCookie(c_name,value,exdays)
    {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
    }
    function getCookie(c_name)
    {
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1)
	{
	    c_start = c_value.indexOf(c_name + "=");
	}
	if (c_start == -1)
	{
	    c_value = null;
	}
	else
	{
	    c_start = c_value.indexOf("=", c_start) + 1;
	    var c_end = c_value.indexOf(";", c_start);
	    if (c_end == -1)
	    {
		c_end = c_value.length;
	    }
	    c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
    }
    var flashInterval;
    function startFlashing(title){
	clearInterval(flashInterval);
	flashInterval = setInterval(function(){
	    if(window.document.title == title){
		window.document.title = "!! " + title;
	    } else {
		window.document.title = title;
	    }
	}, 550);
    }
    function startLightFlashing(title){
	clearInterval(flashInterval);
	flashInterval = setInterval(function(){
	    if(window.document.title == title){
		window.document.title = "> " + title;
	    } else {
		window.document.title = title;
	    }
	}, 1250);
    }
    function changeTitle(title){
	clearInterval(flashInterval);
	window.document.title = title;
    }    
