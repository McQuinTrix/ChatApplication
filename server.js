var express 	= require("express"),
	app 	= express(),
	server	= require('http').createServer(app),
	io	= require('socket.io').listen(server),
	nicknames= [];
	// the socket object listens to http objects

server.listen(3000);

app.get('/',function(req,res){
	res.sendfile(__dirname+'/index.html');
});

io.sockets.on('connection',function(socket){
	socket.on('new user',function(data,callback){
		if(nicknames.indexOf(data) != -1){
			callback(false);
		}else{
			callback(true);
			socket.nickname = data;
			nicknames.push(socket.nickname);
			io.sockets.emit('usernames', nicknames);
			updateNicks();
		}
	});
	function updateNicks(){
		io.sockets.emit('usernames', nicknames);
	}
	socket.on('send message', function(data){
		io.sockets.emit('new message',{msg: data, nick: socket.nickname});
		//socket.broadcast.emit('new message', data);
	});
	socket.on('disconnect',function(data){
		if(!socket.nickname) return;
		nicknames.splice(nicknames.indexOf(socket.nickname),1);
		updateNicks();
		io.sockets.emit('disco',{nick: socket.nickname});
	});
});

