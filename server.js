var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var io = require('socket.io').listen(server);
var k = 1;
/*    middlewares          */

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(__dirname + '/'));

/*            here server lies        */


app.get('/',function(req,res){
	console.log('/');
	//res.render('problem.ejs',{ statement:"WHAT IS 2*2 ?" , option: ["1","2","3","4"] });
	redis.lrange('Quiz:0',0,-1,function(err,quiz){
		if(err) res.send('quiz not found');
		else{
			console.log(quiz);
			for(var i=0; i<quiz.length;i++){
				!function syc(i){
					redis.lindex('Question',quiz[i],function(err,quest){
						if(err) res.send('unable to get questions');
						else{
							redis.lrange('Option:'+quiz[i],0,-1,function(err,opt){
								if(err) res.send('unable to fetch options');
								else{
									console.log(quest);
									console.log(opt);

									
									res.render('problem.ejs',{ statement : quest, option : opt });	
									if(k == 1){
										console.log('asdadadad');
										k++;
									}
								}
							});

						}
					});
				}(i)
			}
		}
	});
	

});


/*			  socket.io stuff		 */


io.sockets.on('connection',function(socket){
	
	socket.on('disconnect',function(){
		
	});

});






