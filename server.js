var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5000);
var io = require('socket.io').listen(server);
var path = require("path");

/*    DATA HOLDERS        */

var correct = [];
var number = [];

/// input data
var quiz = [];
var currQ = [];
var currS = [];
var QTS = [];
var QTQ = [];

//// output data
var Quizdetail = [];
var userquizlog = [];

/*    middlewares          */

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.bodyParser({ keepExtensions: true,uploadDir: __dirname + '/uploads'}))
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

app.get("/create",function (req,res){
	var user = req.param('user');
	res.render('predetailofquiz.ejs', {title : user});
});

app.get('/edit', function (req, res) {
	var creator = req.param('user');
	
	redis.get('QuizValue',function  (err, result) {
		if(err){
			console.log("NO QUIZ EXIST");
			res.send(404);
		}else{
			var arr = [], len = result;		
			for( var i=0; i< len ; i++){
				!function syn(i){
					redis.lindex("Quiz:"+ i, 0, function (err, status){
						if(err){
							console.log("NO QUIZ ID EXIST");
							res.send(404);

						}else{
							console.log("QQQQQQQ :: "+ status );
							if( status === creator ) arr.push(i);
							if( i == len-1){
								console.log(arr);
								console.log("folks");
								res.render("quizList.ejs", { title : creator, list : arr});			
							}
						}
					});
				}(i)
			}
		}
	});
});

app.get('/showincomplete',function (req, res){
	var creator = req.param('creator'), Qid = req.param('choice');
	quiz.push(Qid);
	var idx = quiz.indexOf(Qid);
	console.log(Qid);
	console.log("alpha");
	///////////////////////////

	redis.lrange("Saved:"+ creator + ":" + Qid,0,-1,function (err, result){
		if(err){
			console.log("UNABLE TO RETRIVE SAVED FOR "+ Qid);
			res.send(404);
		}else{
			redis.lindex("Quiz:"+Qid, -1,function (err, section){
				if(err){
					console.log("unable to get Quiz info in showincomplete");
					res.send(404);
				}else{
					if( (result[0] == 0) && (result[1] == 0)){
						redis.exists("Section:"+ Qid + ":" + result[0], function (err, status){
							if(err){
								console.log("showincomplete section exisets part");
								res.send(404);
							}
							else{
								if(status == 0){
									QTS[idx] = section;
									currS[idx] = parseInt(result[0]);
									currQ[idx] = parseInt(result[1]);
									res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
								}else{
									redis.lindex("Section:"+Qid+":0",3,function (err, totalQinS){
										if(err){
											console.log("UNABLE TO RETRIVE SEction FOR "+ Qid);
											res.send(404);
										}else{
											QTQ[idx] = totalQinS;
											QTS[idx] = section;
											currS[idx] = parseInt(result[0]);
											currQ[idx] = parseInt(result[1]);
											res.render("createquiz.ejs", { title : creator, QID : Qid });	
										}
									});
								}
							}
						});
					}else{
						redis.lindex("Section:"+Qid+":"+result[0],3,function (err, totalQinS){
							if(err){
								console.log("UNABLE TO RETRIVE SEction FOR "+ Qid);
								res.send(404);
							}else{
								if(result[1] == 0){
									QTQ[idx] = totalQinS;
									QTS[idx] = section;
									currS[idx] = parseInt(result[0]);
									currQ[idx] = parseInt(result[1]);
									res.render("createquiz.ejs", { title : creator, QID : Qid });
								}else if(result[1] == totalQinS){
									QTS[idx] = section;
									currS[idx] = parseInt(result[0])+1;
									currQ[idx] = 0;								
									res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
								}else{
									QTQ[idx] = totalQinS;
									QTS[idx] = section;
									currS[idx] = parseInt(result[0]);
									currQ[idx] = parseInt(result[1]);
									res.render("createquiz.ejs", { title : creator, QID : Qid });
								}
							}
						});
					}
				}
			});
		}
	});
/////////////////////
});

app.post('/quizdetail',function (req, res){
	redis.get('QuizValue',function  (err, Qid) {
		if(err){
			console.log("UNABLE TO GET QUIZ-ID");
			res.send(404);	
		}else{

			var creator = req.param('creator'),
			Quizpasswd = req.param('password'),
			eventDate = req.param('actdate'),
			eventTime = req.param('acttime'),
			totalDuration = req.param('duration'),
			sectionCount = req.param('section'),
			enddate = req.param('enddate'),
			endtime = req.param('endtime');
			quiz.push(Qid);
			var idx = quiz.indexOf(Qid);
			QTS[idx] = sectionCount;
			currS[idx] = 0;
			redis.rpush('Quiz:'+Qid, creator, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, "RFU", "RFU",sectionCount, function (err, status){
				if(err){
					console.log("UNABLE TO INSERT QUIZ DETAILS");
					res.send(404);
				}else{
					redis.rpush("Saved:" + creator + ":"+ Qid , 0,0);
					redis.incr('QuizValue');
					res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
				}
			});
		}
	});

});

app.post('/sectionDetail',function (req, res){
	var Qid = req.param('Qid'),
	rank = req.param('rank'),
	sectionName = req.param('name'),
	rulesBlog = req.param('rules'),
	sectionCutoff = req.param('cutoff'),
	sectionDuration = req.param('duration'),
	creator = req.param('creator'),
	totalQuestions = req.param('Qno');
	var idx = quiz.indexOf(Qid);
	QTQ[idx] = totalQuestions;
	currQ[idx] = 0;
	redis.rpush("Section:"+ Qid + ":" + currS[idx], rank, sectionName, rulesBlog, totalQuestions, sectionCutoff, sectionDuration, "RFU", "RFU",function (err, status){
		if(err){
			console.log("UNABLE TO INSERT SECTION +" + sectionName + "DETAIL FOR USER" + creator);
			res.send(404);
		}else{
			redis.rpush("Quiz:"+Qid,totalQuestions);
			redis.lset("Saved:" + creator + ":"+ Qid , 0, currS[idx]);
			redis.lset("Saved:" + creator + ":"+ Qid , 1, currQ[idx]);
			res.render("createquiz.ejs", { title : creator, QID : Qid });
		}
	});
});

app.post('/insert',function  (req, res) {
	var full = [];
	var creator = req.param('creator'), Qid = req.param('Qid');
	full.push(req.param('questiontt1'));
	if( req.param('paths') == "0" ){
		full.push("????");
	}else{
		var str = req.files.questiontt2.path;
		full.push(str.replace( __dirname , ''));
	}
	full.push(req.param('add'));
	full.push(req.param('sub'));
	var opt = req.param('opt');
	var len =opt[0].length;
	for( var i = 1; i < 5; i++){
		if( i < len ) full.push(opt[0][i]);
		else full.push("????");
	}
	full.push(opt[0][0]);
	full.push("RFU");
	full.push("RFU");
	var idx = quiz.indexOf(Qid);
	redis.rpush.apply( redis,["Section:"+ Qid + ":" + currS[idx]].concat(full));
			//console.log("its here 11");
			currQ[idx]++;
			redis.lset("Saved:" + creator + ":"+ Qid , 0, currS[idx]);
			redis.lset("Saved:" + creator + ":"+ Qid , 1, currQ[idx]);	
			console.log(currQ[idx] + " : " + QTQ[idx] + " : " + currS[idx] + " : " + QTS[idx]);
			if( currQ[idx] == QTQ[idx] ){ //section complete
				console.log("its here 12");
				currS[idx]++;
				if( currS[idx] == QTS[idx]){
					redis.del('Saved:'+creator+":"+Qid);
					res.send("DONE>>>>>>>>>>>>>>>>>");
				}else{
					console.log("its here 13");
					res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
				}
			}else{
				console.log("its here 14");
				res.render("createquiz.ejs", { title : creator, QID : Qid });
			}
			console.log("its here 15");
		console.log("its here 16");
});

app.get('/done',function (req, res){
	console.log("DONE CREATING QUIZ!!!!!!");
	res.send(200);
});

app.post('/quizlogin',function (req, res){
	res.render('quiztakinglogin.ejs',{ title: req.param('user')});
});

app.post('/validatequizid',function (req,res){
	var user = req.param('user');
	var Qid = req.param('Qid');
	var passwd = req.param('passwd');
	redis.lrange("Quiz:"+Qid,0,-1,function (err,qdetail){
		if(err) res.send(404);
		else{
			if(qdetail[1]){
				if( qdetail[1] == passwd ){
					redis.lrange("Section:"+Qid+":0",0,7,function (err, secdetail){
						if(err){
							console.log("UNABLE TO GET SECTION DETAILS");
							res.send(404);
						}else{
							if( Quizdetail.indexOf(Qid) == -1){
								console.log("here");
								Quizdetail.push(Qid);
								Quizdetail.push(qdetail.slice(9,-1));
							}
							userquizlog.push(user);
							userquizlog.push(0);
							userquizlog.push(0);
							var init = [];
							for(var i=0; i < secdetail[3]; i++) init[i] = "NA"; 
							redis.rpush.apply(redis, [user+":"+Qid+":0"].concat(init));
							res.render("info.ejs",{ title:user, Qid:Qid, secdetail : secdetail});			
						}
					} );
				}else{
					res.render('quiztakinglogin.ejs',{ title : "Wrong Password" });
				}
			}else{
				res.render('quiztakinglogin.ejs',{ title : "Wrong Quiz id" });
			}
		}
	});
});


app.post('/showquiz',function (req, res){
	var user = req.param('user');
	var Qid = req.param('Qid');
	var idx = userquizlog.indexOf(user);
	var idx1 = Quizdetail.indexOf(Qid);
	var secnum = parseInt(userquizlog[idx+1]);
	var qno = parseInt(userquizlog[idx+2]);
	console.log("point==1");
	console.log(Quizdetail[idx1]);
	if( qno == parseInt(Quizdetail[idx1+1][secnum+1]) ){
		if( secnum == parseInt(Quizdetail[idx1+1][0]) ){
			//quiz end()
			console.log("point==2");
			res.send("DONED");
		}else{
			console.log("point==3");
			//section change
			userquizlog[idx+2] = 0;
			qno = 0;
			userquizlog[idx+1]++;
			secnum++;
			redis.lrange("Section:"+Qid+":0",0,7,function (err, secdetail){
				if(err){
					console.log("UNABLE TO GET SECTION DETAILS");
					res.send(404);
				}else{
					var init = [];
					for(var i=0; i < secdetail[3]; i++) init[i] = "NA"; 
					redis.rpush.apply(redis, [user+":"+Qid+":0"].concat(init));
					res.render("info.ejs",{ title:user, Qid:Qid, secdetail : secdetail});			
				}
			} );
		}
	}else{
		if(qno != 0){
			//something to save
			console.log("point==4");
		}
		qno = qno*10+8;
		console.log(qno);
		console.log(secnum);
		console.log("point==5");
		redis.lrange("Section:"+Qid+":"+secnum,qno,qno+10,function (err, question){
			if(err){
				
			}else{
				console.log(question);
				userquizlog[idx+2]++;
				console.log(userquizlog[idx+2]);
				var i = 4;
				while(question[i] != "????") i++;
				if(question[1] == "????"){
					res.render('problem.ejs',{ title:user,Qid:Qid,text:question[0],pos:question[2],neg:question[3],option:question.slice(4,i+1)});
				}else if(question[1][0] == '/'){
					res.render('problem-img.ejs',{ title:user,Qid:Qid,text:question[0],image:question[1],pos:question[2],neg:question[3],option:question.slice(4,i+1)});
				}else{
					//reserved for equations
				}
			}
		});	
	}
	
});


// app.post("/quizinfo", function (req, res){
// 	var Qid = req.param("Qid"), user = req.param('user');
// 	redis.lrange('Quiz:'+ Qid, 0,-1, function (err, result){
// 		if(err){

// 		}else{
// 			Quizdetail.push(Qid);
// 			Quizdetail.push(result);
			
// 		}
// 	});

// });



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
    	console.log(name + "aaaaaaaaaa");
	    redis.exists(name,function (err,status){
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
    	redis.hkeys("email-user",function (err, result){
    		if(err) console.log("unable to access DB For mail");
			for(var k=0; k < result.length; k++){
				if( result[k] == email ){
					console.log("check-e");
					socket.emit('tell-email');		
				}
			}
    	});
    });
    socket.on('type',function  (data) {
    	console.log("laukik           "+ data);
    	switch(data){
    		case "1":{
    			socket.emit("mcq");
    			break;
    		}case "2":
    			socket.emit("mcq-img");
    			break;
    		case "3":
    			socket.emit("subjctive");
    			break;
    		case "4":
    			socket.emit("equation");
    			break;
    	}
    })
	socket.on('disconnect',function(){
		
	});
});


// setInterval(function(){
// 	for(var i=0; i<number.length; i+=2){
// 		redis.lset(number[i],2,number[i+1],function (err ,result){
// 			if(err) console.log("UNABLE TO Dump current Question ID");
// 		});
// 	}
// 	for(var i=0; i<correct.length; i+=2){
// 		redis.lset(correct[i],3,correct[i+1],function (err ,result){
// 			if(err) console.log("UNABLE TO Dump correct Questions");
// 		});
// 	}
// 	console.log("Dump in progress");
// },(1000*60*3));




