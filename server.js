var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var io = require('socket.io').listen(server);

/*    middlewares          */

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(__dirname + '/'));

/*            here server lies        */


app.get('/',function(req,res){
	//res.render('problem.ejs',{statement : "aaaaaaaaa"});
	res.render('problem.ejs',{ statement:"WHAT IS 2*2 ?" , option: ["1","2","3","4"] });
	
	console.log("/");

});


/*			  socket.io stuff		 */


io.sockets.on('connection',function(socket){
	
	socket.on('disconnect',function(){
		
	});

});






