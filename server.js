var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var io = require('socket.io').listen(server);
var path = require("path");
var number = [];
var correct = [];
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
	redis.lindex(user,0,function(err,pass){
		if(err) res.send(404);
		else{
			if(pass){
				if( pass == passwd ){
					number.push(user);
					number.push(0);
					correct.push(user);
					correct.push(0);
					res.render('select.ejs',{ title : user })
					//res.redirect(307, '/quesz?user='+user);
				}else{
					res.render('login.ejs',{ title : "Wrong Password" });
				}
			}else{
				res.render('login.ejs',{ title : "No such user name" });
			}
		}
	});
});

app.post("/create",function (req,res){
	
});

app.post('/quesz',function(req,res){
	var taker = req.param('user');
	console.log("asdasdasd " + taker);
	var curr;
	for(var i = 0; i<number.length; i+=2){
		if(number[i] === taker){
			x = number[i+1];
			break;
		}
	}
	console.log('/');
	if ( req.param("opti") == req.param("ans") ){
		correct[correct.indexOf(taker)+1]++;
	}
	if( x >= 3 ){
		res.render("end.ejs",{ score : correct[correct.indexOf(taker)+1]-1 });
	}else{
		console.log("aaaaaaa " + x);
		redis.lindex('Quiz:0',x,function(err,quiz){
			if(err) res.send('quiz not found');
			else{
				redis.lindex('Question',quiz,function(err,quest){
					if(err) res.send('unable to get questions ' + x);
					else{
						redis.lrange('Option:'+quiz,0,-1,function(err,opt){
							if(err) res.send('unable to fetch options');
							else{
								number[number.indexOf(taker)+1]++;
								res.render('problem.ejs',{ statement : quest, option : opt , title : taker});	
							}
						});
					}
				});
			}
		});
	}
});


/*			  socket.io stuff		 */ 


io.sockets.on('connection',function(socket){
	
	socket.on('newuser',function(name,pass,email){
        redis.rpush(name,pass,email,0,0,"0:0:0", function (err, status){
        	if(err) console.log("RPUSH FOR USER DOSEN'T WORK");
        	redis.hset("email-user",email,name,function (err, result){
        		if(err) console.log("reverse mapping FOR USER DOSEN'T WORK");
        		socket.emit('forward');
        	});
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


setInterval(function(){
	for(var i=0; i<number.length; i+=2){
		redis.lset(number[i],2,number[i+1],function (err ,result){
			if(err) console.log("UNABLE TO Dump current Question ID");
		});
	}
	for(var i=0; i<correct.length; i+=2){
		redis.lset(correct[i],3,correct[i+1],function (err ,result){
			if(err) console.log("UNABLE TO Dump correct Questions");
		});
	}
	console.log("Dump in progress");
},(1000*60*3));




