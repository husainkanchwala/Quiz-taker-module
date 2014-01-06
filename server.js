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

app.get('/',function (req, res){
	res.render('signup.ejs');
});

app.get('/login',function (req,res){
	res.render('login.ejs',{ title : "Please sign in" });
});

app.post('/signin', function (req, res){
	var uname = req.param('uid');
	var email = req.param('eid');
	var passwd = req.param('passwd');
	console.log(uname+" : "+ email + " : " + passwd);
	res.redirect('/login');
});

app.post('/validate',function (req,res){
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
	
	socket.on('newuser',function(name,pass){
        redis.hset('user',name,pass,function(err,status){
            if(err) throw err;
        	    socket.emit('forward');
            });
        });

    socket.on('check',function (name){
    	console.log(name);
	    redis.hget('user',name,function (err,status){
    	    if(err) console.log("unable to access DB");
                if(status){
                	console.log(status);
                	console.log("check");
                    socket.emit('tell');
                }
            });
        });

    socket.on('check-email',function (email){
    	console.log(email);
    	redis.hvals('email', function (err, result){
    		if(err) console.log("unable to access DB For mail");
			for(var k=0; k < result.length; k++){
				if( result[k] == email ){
					console.log("check-e");
					socket.emit('tell-email');		
				}
			}
    	});
    });


	socket.on('disconnect',function(){
		
	});

});






