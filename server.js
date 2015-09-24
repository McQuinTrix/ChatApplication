var express 	= require("express"),
	app 	= express(),
	server	= require('http').createServer(app),
	io	= require('socket.io').listen(server),
	users = {};
	// the socket object listens to http objects

server.listen(3015);

app.get('/',function(req,res){
	res.sendfile(__dirname+'/index.html');
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat',function(err){
	if(err){console.log(err);}else{console.log("Connected!");}
});

var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {type: Date, default:Date.now}
});

var Chat = mongoose.model('Message',chatSchema);

io.sockets.on('connection',function(socket){
	//This model for full chats
	var query = Chat.find({});
        query.sort('-created').limit(8).exec(function(err,data){
		if(err) throw err;
		socket.emit('loadold', data);
	});
	socket.on('new user',function(data,callback){
		if(data in users){
			callback(false);
		}else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicks();
		}
	});
	function updateNicks(){
		io.sockets.emit('usernames', Object.keys(users));
	}
	socket.on('send message', function(data,callback){
		var msg = data.trim();
		/***This part has to do with Private messaging between two users***/
		if(msg.substr(0,3) == '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(" ");
			if(ind !== -1){
				var name = msg.substring(0,ind);
				var msg = msg.substring(ind+1);
				console.log();
				if(name in users){
					users[name].emit('whisper',{msg: msg, nick: socket.nickname});console.log("Whisper");
				}else{callback('Enter valid name!');}
			}else{
				callback('Please put a message in correct format!');
			}
		/*******************Private Messaging Part Ends**********************/
		}else{
			var newMsg = new Chat({msg: msg, nick: socket.nickname});
			newMsg.save(function(err){
				if(err) throw err;
				io.sockets.emit('new message',{msg: msg, nick: socket.nickname});
			});
		}
	});
	socket.on('disconnect',function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicks();
		io.sockets.emit('disco',{nick: socket.nickname});
	});
});

