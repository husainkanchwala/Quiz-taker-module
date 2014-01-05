var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var io = require('socket.io').listen(server);
var path = require("path");
var x = 0;
var state,solv;
/*    middlewares          */

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


/*            here server lies        */

app.get('/',function(req,res){
	res.render('login.ejs',{ title : "Please sign in" });
});

app.post('/validate',function(req,res){
	var user = req.param('uid');
	var passwd = req.param('passwd');
	redis.hget('user',user,function(err,pass){
		if(err) res.send(404);
		else{
			if(pass){
				if( pass == passwd ){
					res.redirect('/quesz');
				}else{
					res.render('login.ejs',{ title : "Wrong Password" });
				}
			}else{
				res.render('login.ejs',{ title : "No such user name" });
			}
		}
	});
});






app.get('/quesz',function(req,res){
	console.log('/');
	console.log(req.param("opti"));
	if( x >= 3 ){
		res.render("end.ejs");
	}else{
		redis.lindex('Quiz:0',x,function(err,quiz){
			if(err) res.send('quiz not found');
			else{
			//console.log(quiz);
				redis.lindex('Question',quiz,function(err,quest){
					if(err) res.send('unable to get questions ' + x);
					else{
						redis.lrange('Option:'+quiz,0,-1,function(err,opt){
							if(err) res.send('unable to fetch options');
							else{
								
								//console.log(quest);
								//console.log(opt);
								x++;
								res.render('problem.ejs',{ statement : quest, option : opt });	
							}
						});
					}
				});
			}
		});
	}
	//res.render('problem.ejs',{ statement:"WHAT IS 2*2 ?" , option: ["1","2","3","4"] });
});


/*			  socket.io stuff		 */


io.sockets.on('connection',function(socket){
	


	socket.on('disconnect',function(){
		
	});

});






