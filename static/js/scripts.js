/*
  WhiskChat Network - Client code
  by whiskers75
  
  'Aut viam inveniam aut faciam'
*/
var url = 'http://server.whiskchat.com';
function getCookie(c_name) { // Sorry for putting this here, but I had to :(
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
        c_start = c_value.indexOf(c_name + "=");
    }
    if (c_start == -1) {
        c_value = null;
    } else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
}
if (getCookie('server')) {
    url = getCookie('server');
}
var socket = io.connect(url, {
    resource: 'socket.io',
    reconnect: false
});
var username = "";
var encryptionKey = "";
var usernames = [];
var online = 0;
var lastCheck = new Date("1990");
var hasFocus = true;
var versionString = 'WhiskChat v2 Beta';
var muted = [];
var pmLock = false;
var pmLockUser = '';
var disconnected = false;
var notifyAll = false;
var showOthers = true;
var roomToJoin = "";
var debugMode = false;
var forcedc = false;
var annJoin = false; // Don't spam
var fs = false;
var appended = [];
var friendsonline = [];
var textMode = false;
var whitelisted = 0;
var mention = false;
var pendingMention = false;
var pendingMsgs = 0;
var alreadyAsked = false;

function notificationPermission() {
    if (!window.webkitNotifications || (window.webkitNotifications.checkPermission() == 0) || alreadyAsked) {
        return;
    }
    window.webkitNotifications.requestPermission();
    alreadyAsked = true;
}
setTimeout(function() {
    if (!socket.socket.connected) {
        callMsg({
            message: '<i class="icon-remove"></i> Connection timed out! Please wait, refreshing...'
        });
	setCookie('server', 'http://server.whiskchat.com', 14);
	setTimeout(function() {
	    window.location.reload(true);
	}, 2000);
    }
}, 10000);

function sync() {
    socket.emit('sync', {
        sync: appended
    });
}

function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function stripHTML(html) { // Prevent XSS, Copied and Pasted from whiskchat-server
    return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '');
}
var scrollback = [];
var upto = -1;

var spammyness = 0;
var lastMsg = new Date();
var warningLevel = 0;
socket.on('connect_failed', function() {
    callMsg({message: '<img src="http://whiskchat.com/static/img/smileys/sad.png"> Failed to connect!'});
    callMsg({message: 'Check <a href="http://server.whiskchat.com">server status</a> or refresh to retry!'});
});
socket.on('error', function() {
    callMsg({message: '<img src="http://whiskchat.com/static/img/smileys/sad.png"> An error occurred!'});
    callMsg({message: 'Check <a href="http://server.whiskchat.com">server status</a> or refresh to retry!'});
});
function updateTitle() {
    if (pendingMention) {
        changeTitle("[" + pendingMsgs + "!] WhiskChat");
    } else {
        if (pendingMsgs == 0) {
            changeTitle("WhiskChat");
            return;
        }
        changeTitle("[" + pendingMsgs + "] WhiskChat");
    }
}
$(window).focus(function() {
    changeTitle("WhiskChat");
    pendingMsgs = 0;
    pendingMention = false;
    hasFocus = true;
});
$(window).blur(function() {
    hasFocus = false;
});
setInterval(function() {
    //get quality back to 0
    spammyness *= 0.98;
    spammyness -= 0.05;
    spammyness = Math.max(spammyness, 0);
}, 1250);
function expire(id) {
    console.log('Expiring #' + id);
    console.log($('#' + id).attr('class'));
    setTimeout(function() {
        $('#' + id).removeClass('slideOutRight');
        $('#' + id).removeClass('slideInLeft');
        $('#' + id).addClass('slideOutRight');
        setTimeout(function() {
            $('#' + id).remove();
        }, 500);
    }, 7500);    
};
function fexpire(id) {
    console.log('Expiring #' + id);
    console.log($('#' + id).attr('class'));
    setTimeout(function() {
        $('#' + id).removeClass('fadeOutRight');
        $('#' + id).removeClass('fadeInLeft');
        $('#' + id).addClass('fadeOutRight');
        setTimeout(function() {
            $('#' + id).remove();
        }, 500);
    }, 2500);    
};
setTimeout(function() {
    socket.on("connect", function() {
        if (disconnected) {
            disconnected = false;
            callMsg({
                message: '<i class="icon-ok"></i> Connected to WhiskChat Network!'
            });
            $('#username').html('<a id="loginsignup">Authenticate</a>');
            $("#loginsignup").click(function() {
                $('#login').modal('show');
            });
            $('#balance').html('0');
            if (document.URL.split("index.html?j:").length == 2) {
                roomToJoin = document.URL.split("j:")[1].split("&")[0];
            }
            if (getCookie("session")) {
                socket.emit("login", {
                    session: getCookie("session"),
                    quiet: true
                });
            }
            socket.emit('quiet');
        }
    });
}, 2000);
$(document).ready(function() {
    if (document.URL.split("?j:").length == 2) {
        roomToJoin = document.URL.split("j:")[1];
    }
    if (document.URL.split("?e:").length == 2) {
        versionString = 'Embedded: #' + document.URL.split("?e:")[1]
        socket.on('loggedin', function() {
            setTimeout(function() {
                embed(document.URL.split("?e:")[1])
            }, 2000);
        });
    }
    if ($('#userslist').outerWidth(true) == 0) {
        textMode = true; // We must be in a small space!
    }
    if (document.URL.split("?r:").length == 2) {
        referrer = document.URL.split("r:")[1];
    } else {
        referrer = 'whiskers75'
    }
    if (getCookie("session")) {
        socket.emit("login", {
            session: getCookie("session")
        });
    }
    $('#logout').click(function() {
	setCookie('session', 'loggedout', 14);
	callMsg({message: 'Cleared cookies.'});
	forcedc = true;
	socket.disconnect();
    });
    $('.versionstr').html(versionString);
    $(document).click(notificationPermission);
    $('.keep_open').click(function(event) {
        event.stopPropagation();
    });
    $('#webkitn').click(function() {
        if (window.webkitNotifications) {
            callMsg({
                message: 'Asked for permission!'
            });
            window.webkitNotifications.requestPermission();
        } else {
            callMsg({
                message: 'Your browser is incapable of WebKit Notifications.'
            });
        }
    });
    $('#webkitalways').click(function() {
        if (window.webkitNotifications) {
            callMsg({
                message: 'You have enabled notification for all messages for this session.'
            });
        } else {
            callMsg({
                message: 'Your browser is incapable of WebKit Notifications.'
            });
        }
    });
    $('.inputsio-alt').click(function() {
        $('#menubtn').dropdown('toggle');
    });
    $(window).resize(moveWin);
    moveWin();
    
    $(".hide-guest").hide();
    $("#register-button").click(function() {
        socket.emit("accounts", {
            action: "register",
            username: $("#login-username").val(),
            password: $("#login-password").val(),
            password2: $("#login-password").val(),
            email: $("#register-email").val(),
            captcha: $("#register-captcha").val(),
            invite: $("#register-invite").val(),
            refer: referrer
        });
    });
    $("#loginsignup").click(function() {
        $('#login').modal('show');
    });
    $("#quit").click(function() {
        $('#quitmodal').modal('show');
    });
    $("#info").click(function() {
        $('#infomodal').modal('show');
    });
    $("#rightver").html(versionString);
    $("#quit-button").click(function() {
        console.log('Goodbye!');
        socket.emit('chat', {
            room: 'main',
            message: '!; quitchat ' + $('#quitmsg').val(),
            color: '000'
        });
        forcedc = true;
        setTimeout(function() {
            forcedc = true;
            socket.disconnect();
            window.close();
        }, 800);
        $('#chattext').append('<center><h2 class="muted" style="background-color: #eee; margin: 0px 0;">Disconnected</h2></center>');
    });
    $("#mute").click(function() {
        var tmp = prompt('Who do you want to mute? (effective until page is reloaded)');
        if (tmp === '') {
            return;
        }
        muted.push(tmp);
        callMsg({
            type: 'alert-success',
            message: 'Muted ' + tmp + '!'
        });
    });
    $("#joinroombtn").click(function() {
        var tmp = $('#roominput').val();
        if (tmp == '') {
            return;
        }
        srwrap(tmp);
    });
    $("#withdrawlnk").click(function() {
        $('#chatinput').val('/withdraw [amount] [address]');
	$('#chatinput').addClass('animated shake');
	setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
	}, 1000);
    });
    $("#depositlnk").click(function() {
        $('#chatinput').val('/deposit');
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
    });
    $("#botstate").click(function() {
        srwrap('botgames');
        $('#chatinput').val('!state');
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
    });
    $("#bothelp").click(function() {
        srwrap('botgames');
        $('#chatinput').val('!help');
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
    });
    $("#getcolors").click(function() {
        socket.emit('getcolors');
    });
    $("#lastwinner").click(function() {
        srwrap('botgames');
        $('#chatinput').val('!lastwinner');
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
    });
    $("#userlistbot").click(function() {
        srwrap('botgames');
        $('#chatinput').val('!users');
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
    });
    $("#tipmenu").click(function() {
        $('#chatinput').addClass('animated shake');
        setTimeout(function() {
            $('#chatinput').removeClass('animated shake');
        }, 1000);
        $('#chatinput').val('/tip <user> <amount in mBTC> <message (optional)>');
    });
    $("#unmute").click(function() {
        var tmp = prompt('Who do you want to un-clientmute?');
        if (tmp === '') {
            return;
        }
        if (muted.indexOf(tmp) !== -1) {
            muted.splice(tmp, 1);
            callMsg({
                type: 'alert-success',
                message: 'Unmuted ' + tmp + '!'
            });
        } else {
            callMsg({
                type: 'alert-warning',
                message: tmp + ' is not muted..'
            });
        }
    });
    $('#roomsbtn').click(function() {
	$('#roomsinfo').modal();
    });
    $("#reloadbal").click(function() {
        socket.emit('getbalance');
    });
    $('#signuptoggle').click(function() {
	$('#signup').toggle();
    });
    $("#login-button").click(function() {
        socket.emit("accounts", {
            action: "login",
            username: $("#login-username").val(),
            password: $("#login-password").val()
        });
    });
    $("#chatinput").keydown(function(event) {
        var input = $("#chatinput");
        if (event.keyCode == 13) {
            sendMsg();
        } else if (event.keyCode == 38) {
            if (upto == -1) {
                upto = scrollback.length - 1
                $("#chatinput").val(scrollback[upto]);
                input[0].selectionStart = input[0].selectionEnd = input.val().length;
            } else if (upto > 0) {
                upto--;
                $("#chatinput").val(scrollback[upto]);
                input[0].selectionStart = input[0].selectionEnd = input.val().length;
            }
        } else if (event.keyCode == 40) {
            if (upto != -1) {
                upto++;
                if (upto != scrollback.length) {
                    $("#chatinput").val(scrollback[upto]);
                    input[0].selectionStart = input[0].selectionEnd = input.val().length;
                } else {
                    upto = -1;
                    $("#chatinput").val('');
                }
            }
        } else if (event.keyCode == 9) { 
            var theUsername = $("#chatinput").val().split(" ")[$("#chatinput").val().split(" ").length - 1];
            var tmp2 = [];
            for (var i in usernames) {
                if (theUsername.length > 0 && usernames[i].substr(0, theUsername.length).toLowerCase() == theUsername.toLowerCase()) {
                    tmp2.push(usernames[i]);
                }
            }
            if (tmp2.length < 1) {
                event.preventDefault();
                return;
            }
            if (tmp2.length > 1) {
                event.preventDefault();
                $('#chatinput').addClass('animated shake');
                setTimeout(function() {
                    $('#chatinput').removeClass('animated shake');
                }, 1000);
                return callMsg({
                    message: 'Multiple choices: ' + tmp2.join(', ')
                });
            }
            if ($("#chatinput").val().split(" ").length == 1) {
                $("#chatinput").val(tmp2[0] + ": ");
            } else {
                var prev = "";
                var splitty = $("#chatinput").val().split(" ");
                for (var j = 0; j < splitty.length - 1; j++) {
                    prev += splitty[j] + " ";
                }
                $("#chatinput").val(prev + tmp2[0] + " ");
            }
            event.preventDefault();
        }
    });
    $("#send").click(function() {
        sendMsg();
    });
    joinroomhandler('main');
    $("#chattext").append("<div class='chatline'><span class='user' onclick='place()' style='background: rgba(238, 160, 136, 0.64);'><span>Copyright notice</span>&nbsp;&nbsp;</span><span class='message' style='background: #eee'>WhiskChat Client uses code from <a href='http://coinchat.org/'>coinchat.org</a> (c) 2013 admin@glados.cc</span></div>");
    callMsg({
        message: '<i class="icon-upload"></i> Connecting to ' + url.replace('http://', '') + '...'
    });
});
socket.on("whitelist", function(data) {
    whitelisted = data.whitelisted;
    $('#whitelisted').html('<i class="icon-gift"></i>  ' + whitelisted);
});
socket.on("rooms", function(data) {
    $('#roomsdata').html(data.html);
});
function moveWin() {
    var h = $(window).height() - 6;
    var w = $(window).width() - 6;
    var s296 = 0;
    
    window.scrollTo(0, 0);
    $("#roomsbtn").html('<i class="icon-home"></i> ' + currentRoom);
    $('#usercount').html(online);
    $("#chat").css("position", "absolute");
    $("#chat").css("top", 2);
    $("#chat").css("left", 2);
    $("#chat").css("height", h);
    $("#chat").css("width", w);
    $(".message").css("width", w - s296 - 150 - 30);
    $("#chattext").css("width", w - s296);
    $("#chat .content").css("height", h - 35 - $(".header").height());
    $("body").css("overflow", "hidden");
    $("#chatinput").css("width", w - 130 - $('#roomsbtn').outerWidth(true) - $('#userslist').outerWidth(true));
}

function scrollWin() {
    $("#chattext").animate({
        scrollTop: $("#chattext").prop('scrollHeight')
    }, "slow");
}
var color = "000";
socket.on("disconnect", function(data) {
    if (!forcedc) {
        callMsg({
            message: "<i class='icon-remove'></i> Disconnected from WhiskChat. Waiting 5 seconds for the server to reboot.",
            type: 'alert-warning'
        });
	setTimeout(function() {
            callMsg({
                message: "<i class='icon-signal'></i> Attempting to reconnect...",
                type: 'alert-warning'
            });
            socket.socket.connect();
	}, 5000);
        socket.on("connect", function() {
            if (disconnected) {
                disconnected = false;
                callMsg({
                    message: '<i class="icon-ok"></i> Connected to WhiskChat Network!'
                });
                $('#username').html('<a id="loginsignup">Authenticate</a>');
                $("#loginsignup").click(function() {
                    $('#login').modal('show');
                });
                $('#balance').html('0');
                if (document.URL.split("index.html?j:").length == 2) {
                    roomToJoin = document.URL.split("j:")[1].split("&")[0];
                }
                if (getCookie("session")) {
                    socket.emit("login", {
                        session: getCookie("session"),
                        quiet: true
                    });
                }
                socket.emit('quiet');
            }
        });
    } else {
        callMsg({
            message: "Disconnected from WhiskChat - you can reload the page now.",
            type: 'alert-warning'
        });
    }
});
socket.on('captcha', function(data) {
    $('#captcha').html(data.html);
});
socket.on("warn", function(data) {
    callMsg({
        message: "<i class='icon-exclamation-sign'></i> Warning: " + data.message,
        type: 'alert-warning'
    });
});

function place() {
    // shut up.
}
function sendMsg() {
    var msg = $("#chatinput").val();
    $("#chatinput").val("");
    scrollback.push(msg);
    if (scrollback.length > 5) {
        scrollback = scrollback.slice(scrollback.length - 5);
    }
    upto = -1;
    if (msg.substr(0, 4) == "/enc") {
        encryptionKey = msg.split(" ")[1];
        if (encryptionKey == "off") {
            encryptionKey = "";
	} else {
        }
	
        return;
    }
    if (msg.substr(0, 5) == "/nuke") {
        if (msg.split(" ").length < 1) {
            return;
        }
        socket.emit("nuke", {
            target: msg.split(" ")[1],
            reason: msg.split(" ").slice(2).join(" ")
        });
        return;
    }
    if (msg.substr(0, 6) == ".debug") {
        debugMode = !debugMode;
        callMsg({
            message: 'Debug mode state: ' + debugMode
        });
        return;
    }
    
    if (msg.substr(0, 3) == '.pm') {
        pmLock = !pmLock;
        pmLockUser = msg.split(" ")[1];
        if (pmLock) {
            callMsg({
                message: 'PM Lock on. All messages will now go to ' + pmLockUser + '.'
            });
        } else {
            callMsg({
                message: 'PM Lock off.'
            });
        }
        return;
    }
    if (pmLock) {
        socket.emit("chat", {
            room: currentRoom,
            message: '/msg ' + pmLockUser + ' ' + msg,
            color: color
        });
        return;
    }
    if (msg.substr(0, 10) == "/whitelist") {
        if (msg.substr(msg.length - 1) == " ") {
            msg = msg.substr(0, msg.length - 2);
        }
        if (msg.split(" ").length == 2) {
            socket.emit("tip", {
                room: currentRoom,
                user: msg.split(" ")[1],
                tip: 5,
                message: 'Whitelisted!',
                rep: true
            });
            return;
        }
    }
    if (msg.substr(0, 9) == "/withdraw") {
        socket.emit("withdraw", {
            amount: msg.split(" ")[1],
            address: msg.split(" ")[2]
        });
        return;
    }
    if (msg.substr(0, 12) == "/unwhitelist") {
        if (msg.split(" ").length == 2) {
            socket.emit("tip", {
                room: currentRoom,
                user: msg.split(" ")[1],
                tip: 0,
                message: 'Unwhitelisted.',
                rep: true
            });
            return;
        }
    }
    if (msg.substr(0, 7) == "/server") {
        if (msg.split(" ").length == 2) {
            setCookie('server', 'http://' + msg.split(' ')[1], 14);
	    callMsg({message: '<i class="icon-signal"></i> You will connect to http://' + msg.split(' ')[1] + ' from now on.'});
	    return;
        }
    }
    if (msg.substr(0, 3) == "/sr" || msg.substr(0, 5) == "/join") {
        if (msg.split(" ").length == 2) {
            srwrap(msg.split(" ")[1]);
            return;
        }
    }
    if (msg.substr(0, 3) == "/rm" || msg.substr(0, 6) == "/leave") {
        if (msg.split(" ").length == 2) {
            removeRoom(msg.split(" ")[1]);
	    
            return;
        }
    }
    
    if (msg.substr(0, 5) == "/quit") {
        socket.emit("chat", {
            room: 'main',
            message: '!; quitchat ' + msg.substr(6, msg.length),
            color: "000"
        });
        forcedc = true;
        socket.disconnect();
        return;
    }
    if (msg.substr(0, 5) == "/help") {
        callMsg({
            message: 'Commands: /quit, /join (room), /ping, /tip, /sr, /rm, /spt, /sc, /me, /version, /mute, /unmute, /bet',
            type: 'alert-success'
        });
        return;
    }
    if (msg.substr(0, 4) == "/bet" && currentRoom == "botgames") {
        if (msg != "/bet") {
            var tipAmount = msg.split(" ")[1];
            var tipMsg = msg.split(" ")[2];
            if (tipMsg.indexOf('%') == -1) {
                callMsg({
                    message: 'Syntax: /bet amount chance% (chance can be anything from 1% to 75%)',
                    type: 'alert-success'
                });
                return;
            }
            callMsg({
                message: 'Betting ' + tipAmount + ' with a ' + tipMsg + ' chance...',
                type: 'alert-success'
            });
            srwrap('botgames');
            socket.emit("tip", {
                room: 'botgames',
                user: 'WhiskDiceBot',
                tip: tipAmount,
                message: 'BOT ' + tipMsg
            });
            return;
        } else {
            callMsg({
                message: 'Syntax: /bet amount chance% (chance can be anything from 1% to 75%)',
                type: 'alert-success'
            });
            return;
        }
    }
    if (msg.substr(0, 7) == "/reptip") {
        // /tip username 1.25 thank you
        if (msg == '/reptip') {
            callMsg({
                message: 'Syntax: /reptip username amount (message)',
                type: 'alert-success'
            });
            return;
        }
        if (msg.split(" ").length > 2) {
            var tipTo = msg.split(" ")[1];
            var tipAmount = msg.split(" ")[2];
            if (msg.split(" ")[3]) {
                var tipMsg = msg.split(" ").slice(3).join(" ");
            } else {
                var tipMsg = "";
            }
            callMsg({
                message: 'Setting ' + tipTo + '\'s rep to ' + tipAmount + (tipMsg ? ' (message: ' + tipMsg + ')' : ''),
                type: 'alert-success'
            });
            socket.emit("tip", {
                room: currentRoom,
                user: tipTo,
                tip: tipAmount,
                message: tipMsg,
                rep: true
            });
            return;
        }
    }
    if (msg.substr(0, 4) == "/tip") {
        // /tip username 1.25 thank you
        if (msg == '/tip') {
            callMsg({
                message: 'Syntax: /tip username amount (message)',
                type: 'alert-success'
            });
            return;
        }
        if (msg.split(" ").length > 2) {
            var tipTo = msg.split(" ")[1];
            var tipAmount = msg.split(" ")[2];
            if (msg.split(" ")[3]) {
                var tipMsg = msg.split(" ").slice(3).join(" ");
            } else {
                var tipMsg = "";
            }
            if (tipTo == 'donate') {
                tipTo == 'donations'
            }
            callMsg({
                message: 'Tipping ' + tipTo + ' ' + tipAmount + (tipMsg ? ' mBTC (message: ' + tipMsg + ')' : ' mBTC') + '...',
                type: 'alert-success'
            });
            socket.emit("tip", {
                room: currentRoom,
                user: tipTo,
                tip: tipAmount,
                message: tipMsg
            });
            return;
        }
    }
    if (msg.substr(0, 1) == "~") {
        if (msg.split(" ").length >= 2) {
            var tmp9 = msg.split(" ")
            var tmp10 = tmp9.splice(0, 1);
            socket.emit('chat', {
                room: String(tmp10[0].replace('~', '')),
                message: String(tmp9.join(" "))
            });
        }
    }
    if (msg.substr(0, 5) == "/kick" || msg.substr(0, 7) == "/unkick") {
        if (msg.split(" ").length >= 2) {
            if (msg.substr(0, 5) == "/kick") {
                socket.emit("kick", {
                    action: "kick",
                    room: currentRoom,
                    user: msg.split(" ")[1]
                });
                socket.emit('chat', {
                    room: currentRoom,
                    message: 'Kicked ' + msg.split(" ")[1] + '!',
                    color: "000"
                });
            } else {
                socket.emit("kick", {
                    action: "unkick",
                    room: currentRoom,
                    user: msg.split(" ")[1]
                });
                socket.emit('chat', {
                    room: currentRoom,
                    message: 'Unkicked ' + msg.split(" ")[1] + '!',
                    color: "000"
                });
            }
        }
        return;
    }
    if (msg.substr(0, 5) == "/mute") {
        if (msg.split(" ").length >= 3) {
            var reason = (msg.split(" ").length > 3 ? msg.split(" ").slice(3).join(" ") : "");
            socket.emit("mute", {
                mute: msg.split(" ")[2],
                target: msg.split(" ")[1],
                room: currentRoom,
                reason: reason
            });
            return;
        }
    }
    if (msg.substr(0, 7) == "/unmute") {
        if (msg.split(" ").length >= 2) {
            socket.emit("mute", {
                mute: '0',
                target: msg.split(" ")[1],
                room: currentRoom,
                reason: 'Unmuted!'
            });
            return;
        }
    }
    var secs = Math.max(10 - (new Date() - lastMsg) / 1000, 1);
    if (secs > 8) {
        secs *= 1.5;
    }
    if (msg.indexOf(" i ") != -1 || msg.indexOf(" u ") != -1) {
        secs *= 2;
    }
    if (currentRoom != "main") {
        secs *= 0.75;
    }
    lastMsg = new Date();
    spammyness += secs * Math.max(40 - msg.length, 1) / 40;
    
    if (checkSpam()) {
        return;
    }
    if (encryptionKey != "") {
        msg = CryptoJS.AES.encrypt(msg, encryptionKey).toString();
        msg = "EC_" + msg;
        if (msg.length >= 500) {
            alert("Your message is too long!");
            return;
        }
    }
    if (msg[0] == '!') {
        socket.emit("chat", {
            room: currentRoom,
            message: msg,
            color: "000"
        });
    } else {
        socket.emit("chat", {
            room: currentRoom,
            message: msg,
            color: color
        });
    }
    
}

function checkSpam() {
    return false; // LOL
}

function checknew(room, message) {
    if (localStorage) {
        if (localStorage.getItem("room-" + room)) {
            if (localStorage.getItem("room-" + room) == message) {
                return false;
            }
        }
    }
    return true;
}
socket.on("joinroom", function(data) {
    if (data.room == "--connectedmsg") {
        $('#chattext').append('<center><h2 class="muted" style="background-color: #eee; margin: 0px 0;">Connected</h2></center>');
        return;
    }
    joinroomhandler(data.room);
    scrollWin();
});
socket.on("message", callMsg);

function addToRoomHTML(html) {
    Object.keys(roomHTML).forEach(function(key) {
        roomHTML[key] += html;
    });
}

function callMsg(data) {
    var newId = "m" + Math.round(Math.random() * 10000);
    //$("#chattext").append("<div class='chatline animated slideInLeft'><span class='user' onclick='place()' style='background: rgba(238, 160, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message' style='background: #eee'><strong>" + data.message + "</strong></span></div>");
    moveWin();
    if (textMode) {
        $("#chattext").append("[" + new Date().getHours() + ":" + (String(new Date().getMinutes()).length == 1 ? "0" + new Date().getMinutes() : new Date().getMinutes()) + "] <span class='color: #e00;'>==</span> <strong>" + data.message + "</strong></br>");
    } else {
	var rnd = (Math.random() * 1000).toFixed(0);
        $("#chattext").append("<div class='chatline animated slideInLeft' id='" + rnd + "' style='background-color: #D0F098;'><center><strong>" + data.message + "</strong></center></div>");
	expire(rnd);
    }
    if ((!fs && $("#chattext").scrollTop() + 650 >= $("#chattext").prop('scrollHeight')) || (fs && $("#chattext").scrollTop() + $(window).height() >= $("#chattext").prop('scrollHeight'))) {
        $("#chattext").animate({
            scrollTop: $("#chattext").prop('scrollHeight')
        }, "slow");
    }
    /*$("#notifications").html("<a class='pull-right btn btn-link' id='" + newId + "'>" + data.message + "</a>");
      $("#" + newId).fadeIn();
      setTimeout(function(){
      $("#" + newId).fadeOut(500);
      }, 5000);*/
}

socket.on("online", function(data) {
    if (data.people != online) {
	$('#userslist').addClass('animated flash');
	moveWin();
	setTimeout(function() {
            $('#userslist').removeClass('animated flash');
	    moveWin();
	}, 1000);
    }
    online = data.people;
    if (data.array) {
        usernames = data.array;
    }
    updateSidebar();
    console.log(data.people, JSON.stringify(data.array));
});
var roomHTML = [];
var users = [];
var currentRoom = "main";

function updateSidebar() {
    if (!username) {
        $('#chatinput').attr('placeholder', 'Please log in! ' + online + ' people online.');
    } else {
        $('#chatinput').attr('placeholder', 'Send to #' + currentRoom + ' as ' + username + '... (' + online + ' people online)');
    }
    var userslistHTML = '<li class="dropdown-item-muted"><a>Users</a></li>\n'
    usernames.forEach(function(user) {
        userslistHTML += '<li><a>' + user + '</a></li>'
    })
    $('#userslistm').html(userslistHTML);
    $('#usercount').html(online);
    moveWin();
}
socket.on('tip', function(data) {
    var rnd2 = (Math.random() * 1000).toFixed(0);
    console.log('TIP: ' + JSON.stringify(data));
    if (textMode) {
        if (data.rep) {
            $('#chattext').append("<span style='color: #090;'><strong>" + data.user + "</strong> has set " + Number(data.amount) + "'s rep to <strong>" + data.target + "</strong>! " + (data.message ? '(' + data.message + ')' : '') + "</span>");
            moveWin()
            scrollWin();
        } else {
            $('#chattext').append("<span style='color: #090;'><strong>" + data.user + "</strong> has tipped " + Number(data.amount) + " mBTC to <strong>" + data.target + "</strong>! " + (data.message ? '(' + data.message + ')' : '') + "</span>");
            moveWin()
            scrollWin();
        }
    } else {
        if (data.rep) {
            if (currentRoom == data.room) {
                $('#chattext').append("<div class='chatline animated slideInLeft' id='"+ rnd2 + "'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span>Tip</span>&nbsp;&nbsp;</span><span class='message' style='background: #eee; color: #090;'><strong>" + data.user + "</strong> has set " + data.target + "'s rep to " + Number(data.amount) + "! " + (data.message ? '(' + data.message + ')' : '') + "</span></div>");
                scrollWin();
            } else {
                roomHTML[data.room] += "<div class='chatline animated slideInLeft' id='"+ rnd2 + "'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span>Tip</span>&nbsp;&nbsp;</span><span class='message' style='background: #eee; color: #090;'><strong>" + data.user + "</strong> has set " + data.target + "'s rep to " + Number(data.amount) + "! " + (data.message ? '(' + data.message + ')' : '') + "</span></div>";
                scrollWin();
            }
            moveWin();
            scrollWin();
            return;
        }
        if (currentRoom == data.room) {
            $('#chattext').append("<div class='chatline animated slideInLeft' id='"+ rnd2 + "'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span>Tip</span>&nbsp;&nbsp;</span><span class='message' style='background: #eee; color: #090;'><strong>" + data.user + "</strong> has tipped " + Number(data.amount) + " mBTC to <strong>" + data.target + "</strong>! " + (data.message ? '(' + data.message + ')' : '') + "</span></div>");
            moveWin();
        } else {
            roomHTML[data.room] += "<div class='chatline animated slideInLeft' id='"+ rnd2 + "'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span>Tip</span>&nbsp;&nbsp;</span><span class='message' style='background: #eee; color: #090;'><strong>" + data.user + "</strong> has tipped " + Number(data.amount) + " mBTC to <strong>" + data.target + "</strong>! " + (data.message ? '(' + data.message + ')' : '') + "</span></div>";
            moveWin();
        }
        if (debugMode && currentRoom != data.room) {
            callMsg({
                message: 'DBG Tip: ' + JSON.stringify(data)
            });
        }
        moveWin();
        scrollWin();
	expire(rnd2);
    }
    return;
});

function newRoom(room) {
    
    updateSidebar();
};
socket.on("quitroom", function(data) {
    $(".roombtn[data-room='" + data.room + "']").remove();
    if (currentRoom == data.room) {
        switchRoom('main');
    }
    delete roomHTML[data.room];
    delete users[data.room];
    
});

function removeRoom(room) {
    if (room == "main") {
        callMsg({
            message: 'You cannot leave main.'
        });
        return;
    }
    if (appended.indexOf(room) == -1) {
        callMsg({
            message: 'You are not subscribed to that room!'
        });
        return;
    }
    appended.splice(appended.indexOf(room), 1);
    $("#chattext").append("<div class='chatline' style='background-color: #F09898;'><center>Left " + room + "</center></div>");
    sync();
    $('#room-' + room).remove();
    return;
    
}

function joinroomhandler(obj) {
    if (appended.indexOf(obj) == -1) {
        $("#chattext").append(roomHTML[currentRoom]);
        appended.push(obj);
        $("#roomenu").append("<li id=\"room-" + obj + "\"> <a onmouseover='$(\"#quitcon-" + obj + "\").show()' onmouseout='$(\"#quitcon-" + obj + "\").hide()' onclick='srwrap(\"" + obj + "\")'>" + obj + "<button onclick='removeRoom(\"" + obj + "\")' id='quitcon-" + obj + "' class=\"notif btn btn-mini btn-link\" style=\"display: none;\"><i class=\"icon-off\"></i></button></a></li>");
        $("#quitcon-" + obj).click(function(e) {
            e.stopPropagation();
        })
        scrollWin();
    }
    $("#chattext").scrollTop($("#chattext")[0].scrollHeight);
    updateSidebar();
    moveWin();
}

function switchRoom(obj) {
    if (obj.indexOf('#') !== -1) {
        callMsg({
            message: 'Rooms do not contain the # character.'
        })
        return;
    }
    roomHTML[currentRoom] = $("#chattext").html();
    currentRoom = obj;
    if (appended.indexOf(obj) == -1) {
        appended.push(obj);
        $("#chattext").append(roomHTML[currentRoom]);
        $("#chattext").append("<div class='chatline' style='background-color: #F09898;'><center>Joined " + obj + "</center></div>");
        $("#roomenu").append("<li id=\"room-" + obj + "\"> <a onmouseover='$(\"#quitcon-" + obj + "\").show()' onmouseout='$(\"#quitcon-" + obj + "\").hide()' onclick='srwrap(\"" + obj + "\")'>" + obj + "<button onclick='removeRoom(\"" + obj + "\")' id='quitcon-" + obj + "' class=\"notif btn btn-mini btn-link\" style=\"display: none;\"><i class=\"icon-off\"></i></button></a></li>");
        $("#quitcon-" + obj).click(function(e) {
            e.stopPropagation();
        })
        sync();
        scrollWin();
    }
    $("#chattext").scrollTop($("#chattext")[0].scrollHeight);
    updateSidebar();
    moveWin();
}
socket.on("chat", function(data) {
    var args = data.message.split(" ");
    if (usernames.indexOf(data.user) == -1 && data.user != "!Topic") {
        usernames.push(data.user);
    }
    if (muted.indexOf(data.user) !== -1) {
        console.log('Muted message from ' + data.user + ': ' + data.message);
        return;
    }
    if (data.message.substr(0, 10) == '!; connect') {
        genJoinNotice("<strong>" + data.user + "</strong> connected to WhiskChat Server (" + data.message.substr(11, data.message.length) + ")");
        moveWin();
        scrollWin();
        return;
    }
    if (data.message.substr(0, 3) == "EC_") {
        if (encryptionKey == "") {
            return;
        }
	
        decryptedMessage = CryptoJS.AES.decrypt(data.message.substr(3), encryptionKey).toString();
	
        if (decryptedMessage == "") {
            return;
        }
        data.encrypted = true;
        data.message = stripHTML(hex2a(decryptedMessage));
	
    } else {
        data.encrypted = false;
    }
    
    /*if (data.message.indexOf('<i>') !== -1) {
      if (currentRoom == data.room) {
      $('#chattext').append("<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message' style='background: #eee'>* <strong>" + data.user + "</strong> " + data.message + "</span></div>");
      moveWin();
      } else {
      roomHTML[data.room] += "<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message muted' style='background: #eee'><i>* <strong>" + data.user + "</strong> </i>" + data.message + "</span></div>";
      moveWin();
      }
      moveWin();
      scrollWin();
      return;
      }*/
    if (data.message == '!; joinroom') {
        if (currentRoom == data.room) {
            $("#chattext").append("<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message muted' style='background: #eee'><strong>" + data.user + "</strong> joined #" + data.room + "<span></div>");
        } else {
            roomHTML[data.room] += "<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message muted' style='background: #eee'><strong>" + data.user + "</strong> joined #" + data.room + "<span></div>"
	    
        }
        moveWin();
        scrollWin();
        return;
    }
    if (data.message.substr(0, 11) == '!; quitroom') {
        if (currentRoom == data.room) {
            $("#chattext").append("<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message muted' style='background: #eee'><strong>" + data.user + "</strong> left #" + data.room + " (" + data.message.substr(12, data.message.length) + ")</span></div>");
        } else {
            roomHTML[data.room] += "<div class='chatline'><span class='user' onclick='place()' style='background: rgba(136, 238, 136, 0.64);'><span></span>&nbsp;&nbsp;</span><span class='message muted' style='background: #eee'><strong>" + data.user + "</strong> left #" + data.room + " (" + data.message.substr(12, data.message.length) + ")</span></div>"
        }
        moveWin();
        scrollWin();
        return;
    }
    if (data.message.substr(0, 11) == '!; quitchat') {
        genQuitNotice("<strong>" + data.user + "</strong> has disconnected (" + data.message.substr(12, data.message.length) + ")");
        moveWin();
        scrollWin();
        return;
    }
    if (data.message == '!info') {
	return;
    }
    if ((args[0] == "!hint" || args[0] == "!ahint") && data.room == "20questions") {
        return;
    }
    if (args[1] == "win" && args[0] == "!;" && data.user === "WhiskDiceBot") {
        return;
    }
    if (args[1] == "loss" && args[0] == "!;" && data.user === "WhiskDiceBot") {
        return;
    }
    if (data.message.substr(0, 6) == "!; kl ") {
        data.message = "<span class='label label-inverse'>" + data.message.substr(6, data.message.length); + "</span>"
    }
    if (data.user != "" && !checkLog(data.room, data.message)) {
        if (currentRoom != data.room) {
            if (data.message.toLowerCase().indexOf(username.toLowerCase()) != -1 && username.length > 0 && mention && appended.indexOf(data.room) == -1) {
                $("#chattext").append("<div class='chatline' title='Notification'><span class='user muted'>" + data.user + "</span><span class='message'><strong>" + data.message + "  <span class='muted'>#" + data.room + "</span></strong></span></div>");
                moveWin();
                scrollWin();
            }
        }
        if (data.room.indexOf(":") != -1 && data.user != username && !hasFocus) {
            chatNotify(data.user, data.message, data.room);
        }
    } else if (data.user != "!Topic") {
        changeTitle("WhiskChat v4");
    }
    if (data.message.toLowerCase().indexOf(username.toLowerCase()) != -1 && username.length > 0) {
        if (!hasFocus) {
            chatNotify(data.user, data.message, data.room);
            pendingMention = true;
            pendingMsgs += 1;
        }
    } else {
        if (!hasFocus && notifyAll) {
            chatQuickNotify(data.user, data.message, data.room);
        }
        if (!hasFocus) {
            pendingMsgs += 1;
        }
    }
    updateTitle();

    var pmClass = "";
    if (data.room.indexOf(":") == -1) {
        pmClass = " userpm";
        var otherUser = (data.user.split(":")[0].toLowerCase() == username.toLowerCase() ? data.user.split(":")[1] : data.user.split(":")[0]);
    }
    if (!data.whitelisted && typeof data.whitelisted != "undefined") {
        pmClass += " notwhitelisted";
    }
    if (data.winbtc > 0) {
        if (data.winbtc <= 0.05) {
            var label = "badge-warning";
        } else if (data.winbtc <= 0.10) {
            var label = "badge-success";
            data.winbtc = data.winbtc;
        } else if (data.winbtc <= 0.15) {
            var label = "badge-info";
            data.winbtc = data.winbtc;
        } else {
            var label = "badge-important";
            data.winbtc = '<strong>' + data.winbtc + '</strong>';
        }
        var winBTCtext = " <span class='notif badge " + label + "'>" + data.winbtc + "</span>";
    } else {
        var label = "badge-important";
        var winBTCtext = ""
    }
    if (data.message.toLowerCase().indexOf(username.toLowerCase()) != -1 && username.length > 0 && data.user != "WhiskDiceBot") {
        data.message = '<strong>' + data.message + '</strong>'
    }
    
    if (data.user == username) {
        var m = "";
        /*if (spammyness > 25) {
          winBTCtext += " <span class='label label-important notif'>high chat frequency</span> ";
	  }
          if(data.message.indexOf(" u " ) != -1 || data.message.indexOf("youre") != -1 || data.message.indexOf(" im ") != -1){
          winBTCtext += " <span class='label label-important notif'>texting speak</span>";
          }*/
    } else {
        var m = "";
    }
    if (!data.rep) {
        data.rep = '0';
    }
    /*Old dateformat: */
    var dateFormat = "<span class='time muted notif'> " + new Date(data.timestamp).getHours() + ":" + (String(new Date(data.timestamp).getMinutes()).length == 1 ? "0" + new Date(data.timestamp).getMinutes() : new Date(data.timestamp).getMinutes()) + "</span> <button class='btn hide btn-mini tipbutton pull-right' data-user='" + data.user + "'><i class='icon-gift'></i> " + data.rep + " (tip)</button><span class='time notif'></span>";
    if ((appended.indexOf(data.room) !== -1 && showOthers) || data.room == currentRoom || (data.room == 'main' && showOthers)) {
        $(".silent").remove();
        if (data.user == 'WhiskDiceBot' && currentRoom != data.room) {
            return;
        }
        if (data.user == 'ArenaBot' && currentRoom != data.room) {
            return;
        }
        if (textMode) {
            $("#chattext").append("[" + new Date(data.timestamp).getHours() + ":" + (String(new Date(data.timestamp).getMinutes()).length == 1 ? "0" + new Date(data.timestamp).getMinutes() : new Date(data.timestamp).getMinutes()) + "] <strong>&lt;" + (data.userShow ? data.userShow : data.user) + '&gt;</strong> ' + data.message + '</br>');
        } else {
            if (data.encrypted) {
                $("#chattext").append("<div class='chatline' style='background-color: #6F6F6F; color: #BBBBBB;' title='" + data.timestamp + "'><span class='user" + pmClass + "' onclick='place()' data-user='" + data.user + "'><span>" + (data.userShow ? data.userShow : data.user) + "</span>&nbsp;&nbsp;</span><span class='message'>" + data.message + winBTCtext + dateFormat + "   <strong class='muted notif'>Encrypted with /enc " + encryptionKey + ". /enc off to stop.</strong></span></div>");
            } else {
                if (data.room != currentRoom) {
                    var fid = (Math.random() * 1000).toFixed(0);
                    $("#chattext").append("<div style='background-color:#CFACAC;' class='chatline animated fadeInLeft' id='" + fid + "' title='" + data.timestamp + "'><span class='user" + pmClass + "' style='background-color: #CCC2C2;' onclick='place()' data-user='" + data.user + "'><span>" + (data.userShow ? data.userShow : data.user) + "</span>&nbsp;&nbsp;</span><span class='message'>" + data.message + winBTCtext + dateFormat + "   <strong class='muted notif'>" + data.room + "</strong></span></div>");
		    fexpire(fid);
                } else {
                    $("#chattext").append("<div class='chatline' title='" + data.timestamp + "'><span class='user" + pmClass + "' onclick='place()' data-user='" + data.user + "'><span>" + (data.userShow ? data.userShow : data.user) + "</span>&nbsp;&nbsp;</span><span class='message'>" + data.message + winBTCtext + dateFormat + "</span></div>");
                }
            }
        }
        log(data.message.split("<span class=\"foo\"></span>")[0], currentRoom);
	
        if (($("#chattext").scrollTop() + 1000 >= $("#chattext").prop('scrollHeight')) || (fs && $("#chattext").scrollTop() + $(window).height() >= $("#chattext").prop('scrollHeight'))) {
            $("#chattext").animate({
                scrollTop: $("#chattext").prop('scrollHeight')
            }, "slow");
        }
	if (getCookie('theme') == 'dark') {
	    $('#chattext').css('background-color', '#000');
            $('.chatline').css('background-color', '#000');
            $('.chatline').css('color', '#c09853');
            $('.chatline .user').css('background-color', '#222222');
            $('.chatline .user').css('color', '#c09853');
            $('.input').css('background-color', '#000');
            $('.input').css('color', '#fff');
            $('.header').css('background-color', '#000');
            $('.header').css('color', '#fff');
        }
        $(".chatline").hover(function() {
            $(this).find(".tipbutton").show();
        }, function() {
            $(this).find(".tipbutton").hide();
        });
        $(".tipbutton").unbind().click(function() {
            if ($(this).attr("data-user") != username) {
                var tipHowMuch = prompt("Tip " + $(this).attr("data-user") + " how much?", "0.25");
                if (tipHowMuch) {
                    socket.emit("tip", {
                        user: $(this).attr("data-user"),
                        room: currentRoom,
                        tip: tipHowMuch,
                        message: 'Tipped using button'
                    });
                }
            }
        });
    } else {
        if (!roomHTML[data.room]) {
            roomHTML[data.room] = "";
        }
        roomHTML[data.room] += "<div class='chatline' title='" + data.timestamp + "'><span class='user" + pmClass + "' onclick='place()' data-user='" + data.user + "'><span>" + (data.userShow ? data.userShow : data.user) + "</span>&nbsp;&nbsp;</span><span class='message'>" + data.message + winBTCtext + dateFormat + "</span></div>";
	
    }
    moveWin();
    
});

function log(message, room) {
    if (!localStorage) {
        return false;
    }
    localStorage.setItem("room-" + room, message);
}

function checkLog(room, message) {
    if (!localStorage) {
        return false;
    }
    message = message.replace(/'/g, '\"');
    if (localStorage.getItem("room-" + room) && localStorage.getItem("room-" + room).replace(/'/g, '\"') == message) {
        return true;
    } else if (message.indexOf("best route") != -1) {
        console.log(localStorage.getItem("room-" + room) + " EXPECTED: " + message);
    }
    return false;
}

function clickUser(clickUsername) {
    return false;
}
var myTimeout;
socket.once("loggedin", function(data) {
    console.log('Got loggedin');
    $('#chattext').html('');
    setCookie("session", data.session, 14);
    $("#login").modal('hide');
    $("#user").show();
    $("#username").html('<i class="icon-user"></i>  ' + data.username);
    $(".hide-guest").show();
    $('#chat').show();
    //$('.header').append('Encryption: <span class="label" id="encstatus">Off</span>');
    if (roomToJoin) {
        srwrap(roomToJoin)

    }
    $('#user').css('display', 'none');
    fs = !fs;
    $("#chattext").scrollTop($("#chattext").prop("scrollHeight"));
    setTimeout(function() {
        moveWin();
    }, 800);
    /*    $(".COINWIDGET_BUTTON").children()[0].style.display = "none";
	  setTimeout(function() {
	  $(".COINWIDGET_BUTTON").children()[1].style["margin-left"] = "2px";
	  $(".COINWIDGET_BUTTON").children()[1].style["padding"] = "2px"
	  }, 2);
	  Cool coinwidget code! (unused)
    */
    username = data.username;
    setTimeout(function() {
        socket.emit('chat', {
            room: 'main',
            message: '!; connect ' + versionString,
            color: "000"
        });
        mention = true;
    }, 800);
    $(".user").click(function() {
        console.log('Placing user ' + $(this).attr('data-user'));
        $("#chatinput").val($(this).attr('data-user') + ': ');
    });
    srwrap('main', true);
    jQuery(window).bind("beforeunload", function() {
        socket.emit('chat', {
            room: 'main',
            message: '!; quitchat Quit: Window closed!',
            color: '000'
        });
    });
});
socket.on("balance", function(data) {
    if (typeof data.balance != 'undefined') {
        $("#balance").html(Math.round(data.balance * 1000) / 1000);
    } else {
        $("#balance").html(Math.round((parseFloat($("#balance").html()) + data.change) * 1000) / 1000);
        if (data.change > 0) {
            // I detest that update span :P
        }
    }
});

function srwrap(roomName, noticeFalse) {
    if (!roomHTML[roomName]) {
        roomHTML[roomName] = "";
    }
    if (roomName == currentRoom) {
        return;
    }
    if (!noticeFalse) {
        $("#chattext").append("<div class='chatline' style='background-color: #F09898;'><center><strong>Switched to " + roomName + "</strong></center></div>");
    }
    switchRoom(roomName)
    moveWin();
    scrollWin();
}

function embed(roomName) {
    $('#chattext').html('<center><h2 class="muted" style="background-color: #eee; margin: 0px 0;">Welcome to ' + roomName + '</h2></center>');
    showOthers = false;
    srwrap(roomName);
}
// stuff

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}


var flashInterval;

function startFlashing(title) {
    /*clearInterval(flashInterval);
      flashInterval = setInterval(function(){
      if(window.document.title == title){
      window.document.title = "!! " + title;
      } else {
      window.document.title = title;
      }
      }, 550);
    */
    // Obsolete.
}

function chatNotify(user, message, room) {
    if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
        var notif = webkitNotifications.createNotification('http://whiskers75.com/whiskchat_logo.png', stripHTML(user), stripHTML(message));
        notif.show();
        setTimeout(function() {
            notif.cancel()
        }, 5000);
    }
}

function chatQuickNotify(user, message, room) {
    if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
        var notif = webkitNotifications.createNotification('http://whiskers75.com/whiskchat_logo.png', stripHTML(user), stripHTML(message));
        notif.show();
        setTimeout(function() {
            notif.cancel()
        }, 900);
    }
}

function startLightFlashing(title) {
    return;
}

function changeTitle(title) {
    clearInterval(flashInterval);
    window.document.title = title;
}

function genJoinNotice(message) {
    var rnd3 = (Math.random() * 1000).toFixed(0);
    $('#chattext').append("<div class='chatline animated slideInLeft' style='background-color: #95E79E;' id='" + rnd3 + "'><center>" + message + "</center></div>");
    addToRoomHTML("<div class='chatline' style='background-color: #95E79E;'><center>" + message + "</center></div>")
    expire(rnd3);
}

function genQuitNotice(message) {
    var rnd4 = (Math.random() * 1000).toFixed(0);
    $('#chattext').append("<div class='chatline animated slideInLeft' style='background-color: #F56868;' id='" + rnd4 + "'><center>" + message + "</center></div>");
    addToRoomHTML("<div class='chatline' style='background-color: #F56868;'><center>" + message + "</center></div>")
    expire(rnd4);
}
