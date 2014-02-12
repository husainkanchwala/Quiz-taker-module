var redis = require('redis').createClient();
var express = require('express'),http = require('http');
var app = express();
var server = http.createServer(app).listen(5002);
var io = require('socket.io').listen(server);
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);
var path = require("path");
var crypto = require('crypto');

/*    DATA HOLDERS        */

var correct = [];
var number = [];

var Quizdetail = [];
var userquizlog = [];
var sockuser = [];
 
/*    middlewares          */

app.set('views', __dirname + '/views');
app.use(express.compress());
app.engine('html', require('ejs').renderFile);
app.use(express.bodyParser({ keepExtensions: true,uploadDir: __dirname + '/public/uploads'}));
app.use(express.cookieParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

/*        encryption functions  */

function encrypt(text,key){
	try{
		var cipher = crypto.createCipher('aes-256-cbc',key)
		var crypted = cipher.update(text,'utf8','hex')
		crypted += cipher.final('hex');
		return crypted;		
	}catch(ex){
		return "?";
	} 
}
 
function decrypt(text,key){
	try{
		var decipher = crypto.createDecipher('aes-256-cbc',key);
		var dec = decipher.update(text,'hex','utf8')
		dec += decipher.final('utf8');
		return dec;
	}catch(ex){
		console.log('exception raised  : ' + ex);
		return "?";
	}
}

/*            here server lies        */

app.get('/',function (req, res){
	console.log("5002");
	res.render('front.ejs',{title2:""});
});

app.post('/add-section',function (req, res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user){
				var Qid = req.cookies.Q;
				var QZ = "Quiz:"+Qid;
				redis.lindex(QZ,9,function (err, sec){
					if(err){}
					else{
						var x = parseInt(sec);
						x++;
						redis.lset(QZ,9,x);
						res.cookie('QTS',x);
						res.cookie('CS',x-1);
						res.clearCookie('Q');
						redis.rpush("Saved:" + user + ":"+ Qid , x-1,0);
						res.cookie('Qid',Qid);
						res.render("sectiondetail.ejs",{ title : user, QID : Qid});
					}
				});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}
		}
	});
});


app.get('/add-question',function (req, res){
	res.render('addquestion.ejs',{ title:req.cookies.uname, QID : req.cookies.Q});
});

app.post('/insert-add-question',function (req, res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user){
				var Qid = req.cookies.Q;
				var Sid = parseInt(req.cookies.Sid);
				var full = [];
				full.push(req.param('questiontt1'));
				if( req.param('paths') == "0" ){
					full.push("????");
				}else{
					var str = req.files.questiontt2.path;
					var qqq = str.replace( __dirname, '');
					full.push(qqq.replace( 'public/', ''));
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
				redis.rpush.apply( redis,["Section:"+ Qid + ":" + Sid].concat(full));
				redis.lindex('Quiz:'+Qid,10+Sid,function (err, Qcount){
					if(err){}
					else{
						var intcount = parseInt(Qcount) + 1;
						redis.lset('Quiz:'+Qid,10+Sid,intcount);		
						redis.lset('Section:'+Qid+":"+Sid,3,intcount);
					}
				});
				res.clearCookie('Q');
				res.clearCookie('S');
				res.render('select.ejs',{title:user});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.clearCookie('S');
				res.send(404);
			}
		}
	});
});



app.get('/cpasswd',function (req,res){
	res.render('cpasswd.ejs', { user : req.param('user')});
});

app.get("/create",function (req,res){
	var name = req.cookies.uname;
	redis.lindex(name,5,function (err, key){
		if(err){}
		else{
			var cook = req.cookies.user;
			var user = decrypt(cook,key);
			if( name == user){
				res.render('predetailofquiz.ejs', {title : user});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}		
		}
	});
});

app.post('/edit-edit',function (req, res){
	var user = req.cookies.uname;
	redis.lindex(user,-1,function(err, key){
		if(err){}
		else{
			if( user == decrypt(req.cookies.user,key)){
				redis.get('QuizValue',function (err, Qc){
					if(err){

					}else{
						var arr = [];
						console.log('QuizValue +++++ '+ Qc);
						for( var i=0; i < Qc ;i++){
							!function syn(i){
								redis.lindex("Quiz:"+i,0,function (err, usr){
									if(err){
									}else{
										if( usr == user){
											arr.push(i);
											console.log(i);
										}
										if( i == Qc - 1 ){
											res.render("userquizlist.ejs",{ title:user, list:arr});	
										}			
									}
								});
							}(i);
						}
					}
				});			
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}
		}
	});
});

app.get('/edit-pre-quizdetail',function (req,res){
	var Qid = req.cookies.Q;
	redis.lrange('Quiz:'+Qid,0,-1,function (err, Qd){
		if(err){}
		else{
			res.render('edit-prequiz-detail.ejs',{ title:req.cookies.uname, Qid:Qid, Qd:Qd.slice(1,Qd.length) });
		}
	});
});

app.post('/edit-quizdetail',function (req,res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user,key)  == user ){
				var Qid = req.cookies.Q;
				var QZ = 'Quiz:' + Qid;
				redis.lindex(QZ,0,function (err,usr){
					if(err){}
					else{
						if(user == usr){
							var acttime = req.param('acttime');
							var ip = acttime.indexOf(' ');
							var eventDate = acttime.slice(0,ip);
							var eventTime = acttime.slice(ip+1);
							var endtimex = req.param('endtime');
							ip = endtimex.indexOf(' ');
							var enddate = endtimex.slice(0,ip);
							var endtime = endtimex.slice(ip+1);
							redis.lset( QZ , 1, req.param('password'));
							redis.lset( QZ , 2, eventDate);
							redis.lset( QZ , 3, eventTime);
							redis.lset( QZ , 4, enddate);
							redis.lset( QZ , 5, endtime);
							redis.lset( QZ , 6,req.param('duration') );
							redis.lset( QZ , 7, req.param('password2'));
							res.clearCookie('Q');
							res.render("select.ejs",{ title : user, QID : Qid});
						}else{
							res.clearCookie('uname');
							res.clearCookie('user');
							res.clearCookie('Q');
							res.send(404);
						}
					}
				});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}
		}
	});
});

app.get('/edit-section-detail',function (req, res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user){
				var Qid = req.cookies.Q;
				var rmc = req.param('id');
				redis.lrange("Section:"+Qid+":"+rmc,0,5,function (err,Sec){
					if(err){}
					else{
						var timemill = parseInt(Sec[5]);
						var DD = parseInt(timemill/(86400000));
						timemill = timemill%86400000;
						var HH = parseInt(timemill/(3600000));
						timemill = timemill%3600000;
						var MM = parseInt(timemill/(60000));
						res.cookie('S',rmc);
						res.render('edit-sectiondetail.ejs',{title:user,QID:Qid,Sd:Sec,DD:DD,HH:HH,MM:MM});		
					}
				});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}
		}
	}); 
});

app.post('/edit-sectiondetail',function (req,res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user){
				var Qid = req.cookies.Q;
				var rmc = req.cookies.S;
				redis.lset('Section:'+Qid+":"+rmc,0,req.param('rank'));
				redis.lset('Section:'+Qid+":"+rmc,1,req.param('name'));
				redis.lset('Section:'+Qid+":"+rmc,2,req.param('rules'));
				redis.lset('Section:'+Qid+":"+rmc,4,req.param('cutoff'));
				var sectiondd = parseInt(req.param('duration-days'))*86400,
				sectionhh = parseInt(req.param('duration-hours'))*3600,
				sectionmm = parseInt(req.param('duration-minutes'))*60,
				sectionDuration = ( sectiondd + sectionhh + sectionmm )*1000;
				redis.lset('Section:'+Qid+":"+rmc,5,sectionDuration);
				res.clearCookie('S');
				res.clearCookie('Q');
				res.render('select.ejs',{title:user});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.clearCookie('Q');
				res.send(404);
			}
		}
	});
});

app.get('/edit-complete', function (req, res) {
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user){
				redis.keys("Saved:"+user+":*",function (err,result){
					if(err){
						res.send(404);
						console.log("error fetching DB");
					}else{
						var arr = [], len = result.length, gap = user.length + 7;		
						for( var i=0; i < len ; i++){
							arr.push(result[i].slice(gap));
						}
						console.log(arr + "--------------");
						console.log(arr.length + "-----------------len");
						res.render("quizList.ejs", { title : user, list : arr});
					}
				});				
			}else{
				res.clearCookie('user');
				res.clearCookie('uname');
				res.send(404);
			}		
		}
	});
});

app.get('/eval',function (req, res){
	console.log("qwertyuiopasdfghjklzxcvbnm");
	user = req.param('user');
	Qid = req.param('Qid');
	redis.lindex('Quiz:'+Qid,9,function (err,totsec){
		if(err){
			console.log('Quiz not Exists ****');
			res.send(404);
		}else{
			datauser = [];
			var i  = 0;
			for (i = 0; i <totsec; i++){
				!function sync(i){
					redis.lrange("result:"+user+":"+Qid,0 ,-1, function (err, result){
						if(err){
							console.log('result not Exists ****');
							res.send("result not Exists");
						}else{
							
							redis.lrange("Section:"+Qid+":"+i,0,-1,function (err, sectiondata){
								if(err){
									console.log('Section not Exists ****');
									res.send(404);
								}else{
									datauser.push(result[2*i+1]);
									datauser.push(sectiondata[1]);
									var choice = [];
									var corre = [];
									var color = [];
									var solu;
									for( var k = 1 ; k < result[2*i].length; k++){
										solu = sectiondata[ ((k-1)*11) + 16];
										corre.push(sectiondata[ ((k-1)*11) + parseInt(solu) + 12 ]);
										console.log( result[2*i][k] + " !!!!!!!!!!!!! 1");
										console.log( sectiondata[ ((k-1)*11) + parseInt(solu) + 12 ] + " !!!!!!!!!!!!! 2");
										console.log(i + " >>>>> i");
										console.log(k + " >>>>> k");
										if( result[2*i][k] == parseInt(solu)){
											choice.push(sectiondata[ ((k-1)*11) + parseInt(solu) + 12 ]);
											color.push("success");
										}else if( result[2*i][k] != '?'){
											choice.push(sectiondata[ ((k-1)*11) + parseInt(result[2*i][k]) + 12 ]);
											color.push("danger");
										}else{
											choice.push("-");
											color.push("warning");
										}
										console.log("lelelelelelelel");
									}
									datauser.push(choice);
									datauser.push(corre);
									datauser.push(color);
									if( i == parseInt(totsec)-1){
										console.log(datauser);
										res.render('userResult.ejs',{ title:user,Qid:Qid,table:datauser});
									}
								}		
							});

						}
					});
				}(i);
			}
			
		}
	});
});

app.get('/go',function (req, res){
	res.render('signup.ejs');
});

app.get('/login',function (req,res){
	res.render('login.ejs',{ title : "Please sign in",title2 : "" });
});

app.get('/logout',function (req, res){
	res.clearCookie('user');
	res.clearCookie('uname');
	if(req.cookies.Qid) res.clearCookie('Qid');
	if(req.cookies.refresh) res.clearCookie('refresh');
	res.render('front.ejs',{title2:""});	
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
					var key = new Date().getTime() + "43redf3";
					redis.lset(user,5,key);
					var usersalt = encrypt(user,key);
					res.cookie('user',usersalt);
					res.cookie('uname',user);
					res.render('select.ejs',{ title : user });
				}else{
					res.render('login.ejs',{ title: user, title2 : "Wrong Password" });
				}
			}else{
				res.render('login.ejs',{ title: user,title2 : "No such user name" });
			}
		}
	});
});

app.get('/quizedit',function (req,res){
	var user = req.cookies.uname;
	redis.lindex(user,-1,function(err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == user ){
				var Qid = req.param('choice');
				redis.exists("Saved:"+user+":"+Qid,function (err, status){
					if(err){}
					else{
						if(status == 1){
							res.redirect('/showincomplete?choice='+Qid);
						}else{
							redis.lrange('Quiz:'+Qid,0,-1,function (err, Qd){
								if(err){}
								else{
									console.log(Qd[0]);
									if( user == Qd[0]){
										res.cookie('Q',Qid);
										var w = parseInt(Qd[9]);
										for( var r=0; r < w; r++){
											!function syn(r){
												redis.lindex("Section:"+Qid+":"+r,1,function (err, sname){
													if(err){}
													else{
														Qd.push(sname);
														if( r == w-1 ) res.render('edit-what-detail.ejs',{ title:user, Qid:Qid, Qd:Qd.slice(1) });
													}
												});
											}(r);
										}
									}else{
										res.clearCookie('uname');
										res.clearCookie('user');
										res.send(404);				
									}
											
								}
							});
						}	
					}
				});
			}else{
				res.clearCookie('uname');
				res.clearCookie('user');
				res.send(404);
			}
		}
	});
});

app.post('/del-quiz',function (req,res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
			if(err){}
			else{
				if( decrypt(req.cookies.user, key) == user){
					var Qid = req.cookies.Q;
					var QZ = "Quiz:"+Qid;
					redis.lindex(QZ,9,function (err,Sec){
						if(err){}
						else{
							redis.del(QZ);
							var intsec = parseInt(Sec);
							for( var j=0; j < intsec; j++) redis.del('Section:'+Qid+":"+j);
						}
					});
					redis.del('Saved:'+user+":"+Qid);
					res.clearCookie('Q');
					res.render('select.ejs',{title:user});
				}else{
					res.clearCookie('uname');
					res.clearCookie('user');
					res.clearCookie('Q');
					res.send(404);
				}
				
			}
	}); 
});

app.get('/remove-section',function (req,res){
	var user = req.cookies.uname;
	redis.lindex(user,5,function (err, key){
			if(err){}
			else{
				if( decrypt(req.cookies.user, key) == user){
					var Qid = req.cookies.Q;
					var rmc = parseInt(req.param('id'));
					var QZ = "Quiz:"+Qid;
					redis.lrange(QZ,9,-1,function (err,Sec){
						if(err){}
						else{
							redis.del('Section:'+Qid+":"+rmc);
							var intsec = parseInt(Sec[0]);

							redis.lset(QZ,9,intsec-1);
							for( var j=rmc,k=rmc+1; k < intsec; j++,k++){
								!function syn(k){
									redis.lset(QZ,j+10,Sec[k+1]);
									if( k == intsec-1) redis.rpop(QZ);
								}(k);
							}
							for( var j=rmc,k=rmc+1; k < intsec; j++,k++){
								!function syn(k){
									redis.rename('Section:'+Qid+":"+k,'Section:'+Qid+":"+j);
								}(k);
							}
						}
					});
					res.clearCookie('Q');
					res.render('select.ejs',{title:user});
				}else{
					res.clearCookie('uname');
					res.clearCookie('user');
					res.clearCookie('Q');
					res.send(404);
				}
				
			}
	}); 
});

app.get('/showincomplete',function (req, res){
	var creator = req.cookies.uname;
	redis.lindex(creator,5,function (err, key){
		if(err){}
		else{
			if( decrypt(req.cookies.user, key) == creator){
				var Qid = req.param('choice');
				res.cookie('Qid',Qid);
				redis.lrange("Saved:"+ creator + ":" + Qid,0,-1,function (err, result){
					if(err){
						console.log("UNABLE TO RETRIVE SAVED FOR "+ Qid);
						res.send(404);
					}else{
						redis.lindex("Quiz:"+Qid, 9,function (err, section){
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
												res.cookie('QTS',section);
												res.cookie('CS',parseInt(result[0]));
												res.cookie('CQ',parseInt(result[1]));
												res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
											}else{
												redis.lindex("Section:"+Qid+":0",3,function (err, totalQinS){
													if(err){
														console.log("UNABLE TO RETRIVE SEction FOR "+ Qid);
														res.send(404);
													}else{
														res.cookie('QTQ',totalQinS);
														res.cookie('QTS',section);
														res.cookie('CS',parseInt(result[0]));
														res.cookie('CQ',parseInt(result[1]));
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
												res.cookie('QTQ',totalQinS);
												res.cookie('QTS',section);
												res.cookie('CS',parseInt(result[0]));
												res.cookie('CQ',parseInt(result[1]));
												res.render("createquiz.ejs", { title : creator, QID : Qid });
											}else if(result[1] == totalQinS){
												res.cookie('QTS', section);
												res.cookie('CS', parseInt(result[0]) + 1);
												res.cookie('CQ', 0);
												res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
											}else{
												res.cookie('QTQ',totalQinS);
												res.cookie('QTS',section);
												res.cookie('CS',parseInt(result[0]));
												res.cookie('CQ',parseInt(result[1]));
												res.render("createquiz.ejs", { title : creator, QID : Qid });
											}
										}
									});
								}
							}
						});
					}
				});							
			}else{
				res.clearCookie('user');
				res.clearCookie('uname');
				res.send(404);
			}		
		}
	});	
});

app.post('/quizdetail',function (req, res){
	if(!req.cookies.Qid){
		redis.get('QuizValue',function  (err, Qid) {
			if(err){
				console.log("UNABLE TO GET QUIZ-ID");
				res.send(404);	
			}else{
				var name = req.cookies.uname;
				redis.lindex(name,5,function (err, key){
					if(err){}
					else{
						var cook = req.cookies.user;
						var user = decrypt(cook,key);
						if( name == user){
							var Quizpasswd = req.param('password'),
							Quizpasswdforstud = req.param('password2');
							totalDuration = req.param('duration'),
							sectionCount = req.param('section');
							////
							//quiz.push(Qid);
							/////
							var acttime = req.param('acttime');
							var ip = acttime.indexOf(' ');
							var eventDate = acttime.slice(0,ip);
							var eventTime = acttime.slice(ip+1,-1);
							var endtimex = req.param('endtime');
							ip = endtimex.indexOf(' ');
							var enddate = endtimex.slice(0,ip);
							var endtime = endtimex.slice(ip+1,-1);
							var idx = quiz.indexOf(Qid);
							//QTS[idx] = sectionCount;
							res.cookie('QTS',sectionCount);
							//currS[idx] = 0;
							res.cookie('CS',0);
							redis.rpush('Quiz:'+Qid, user, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, Quizpasswdforstud, "RFU",sectionCount, function (err, status){
								if(err){
									console.log("UNABLE TO INSERT QUIZ DETAILS");
									res.send(404);
								}else{
									redis.rpush("Saved:" + user + ":"+ Qid , 0,0);
									redis.incr('QuizValue');
									res.cookie('Qid',Qid);
									res.render("sectiondetail.ejs",{ title : user, QID : Qid});
								}
							});
						}else{
							res.send(404);
						}
					}
				});

				
			}
		});	
	}else{
		var name = req.cookies.uname;
		var Qid = req.cookies.Qid;
		redis.lindex(name,5,function (err, key){
			if(err){}
			else{
				var user = decrypt(req.cookies.user,key);
				if( user == name){
					res.render("sectiondetail.ejs",{ title : user, QID : Qid});
				}else{
					res.send(404);
				}
			}
		});
	}
});

app.post('/sectionDetail',function (req, res){
	if(!req.cookies.refresh){
		var name = req.cookies.uname;
		redis.lindex(name,5,function (err, key){
			if(err){}
			else{
				var creator = decrypt(req.cookies.user,key);
				if( creator == name ){
					var Qid = req.cookies.Qid,
					rank = req.param('rank'),
					sectionName = req.param('name'),
					rulesBlog = req.param('rules'),
					sectionCutoff = req.param('cutoff'),
					sectiondd = parseInt(req.param('duration-days'))*86400,
					sectionhh = parseInt(req.param('duration-hours'))*3600,
					sectionmm = parseInt(req.param('duration-minutes'))*60,
					sectionDuration = ( sectiondd + sectionhh + sectionmm   )*1000,
					totalQuestions = req.param('Qno');
					//var idx = quiz.indexOf(Qid);
					res.cookie('QTQ',totalQuestions);
					//QTQ[idx] = totalQuestions;
					res.cookie('CQ',0);
					//currQ[idx] = 0;
					redis.rpush("Section:"+ Qid + ":" + req.cookies.CS, rank, sectionName, rulesBlog, totalQuestions, sectionCutoff, sectionDuration, "RFU", "RFU",function (err, status){
						if(err){
							console.log("UNABLE TO INSERT SECTION +" + sectionName + "DETAIL FOR USER" + creator);
							res.send(404);
						}else{
							redis.rpush("Quiz:"+Qid,totalQuestions);
							redis.lset("Saved:" + creator + ":"+ Qid , 0, req.cookies.CS);
							redis.lset("Saved:" + creator + ":"+ Qid , 1, 0);
							res.render("createquiz.ejs", { title : creator, QID : Qid });
						}
					});
				}else{
					res.send(404);
				}
			}
		});
	}else{
		var name = req.cookies.uname;
		var Qid = req.cookies.Qid;
		redis.lindex(name,5,function (err, key){
			if(err){}
			else{
				var creator = decrypt(req.cookies.user,key);
				if( creator == name){
					res.clearCookie('refresh');
					res.render("createquiz.ejs", { title : creator, QID : Qid });
				}else{
					res.send(404);
				}
			}
		});	
	}
});

app.post('/insert',function  (req, res) {
	res.clearCookie('refresh');
	if(req.cookies.a){
		var name = req.cookies.uname;
		var Qid = req.cookies.Qid;
		redis.lindex(name,5,function (err, key){
			if(err){}
			else{
				var creator = decrypt(req.cookies.user,key);
				if( creator == name){
					var full = [];
					full.push(req.param('questiontt1'));
					if( req.param('paths') == "0" ){
						full.push("????");
					}else{
						var str = req.files.questiontt2.path;
						var qqq = str.replace( __dirname, '');
						full.push(qqq.replace( 'public/', ''));
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
					//var idx = quiz.indexOf(Qid);
					redis.rpush.apply( redis,["Section:"+ Qid + ":" + req.cookies.CS].concat(full));
							var btx = parseInt(req.cookies.CQ) + 1;
							res.cookie('CQ',btx);
							redis.lset("Saved:" + creator + ":"+ Qid , 0, req.cookies.CS);
							redis.lset("Saved:" + creator + ":"+ Qid , 1, btx);	
							console.log(btx + " : " + req.cookies.QTQ + " : " + req.cookies.CS + " : " + req.cookies.QTS);
							if( btx == req.cookies.QTQ ){ //section complete
								var atx = parseInt(req.cookies.CS) + 1;
								res.cookie('CS',atx );
								if( atx == req.cookies.QTS){
									redis.del('Saved:'+creator+":"+Qid);
									res.clearCookie('a');
									res.clearCookie('QTS');
									res.clearCookie('QTQ');
									res.clearCookie('CS');
									res.clearCookie('CQ');
									res.clearCookie('Qid');
									res.render('select.ejs',{ title : creator });
								}else{
									res.clearCookie('a');
									res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
								}
							}else{
								res.clearCookie('a');
								res.render("createquiz.ejs", { title : creator, QID : Qid });
							}
				}else{
					res.send(404);
				}
			}
		});
	}else{
		var name = req.cookies.uname;
		var Qid = req.cookies.Qid;
		redis.lindex(name,5,function (err, key){
			if(err){}
			else{
				var creator = decrypt(req.cookies.user,key);
				if( creator == name){
					//var idx = quiz.indexOf(Qid);
					if( req.cookies.CQ == req.cookies.QTQ ){
						if(req.cookies.CS == req.cookies.QTS) res.render('select.ejs',{ title : creator });
						else res.render("sectiondetail.ejs",{ title : creator, QID : Qid});
					}else res.render("createquiz.ejs", { title : creator, QID : Qid });
				}else{
					res.send(404);
				}
			}
		});
	}
});

app.get('/done',function (req, res){
	console.log("DONE CREATING QUIZ!!!!!!");
	res.send(200);
});

app.post('/quizlogin',function (req, res){
	res.render('quiztakinglogin.ejs',{ title: req.param('user')});
});

app.post('/validatequizid',function (req,res){
	var name = req.cookies.uname;
	redis.lindex(name,5,function (err, key){
		if(err){}
		else{
			var user = decrypt(req.cookies.user,key);
			if( user == name){
				var Qid = req.param('Qid');
				var passwd = req.param('passwd');
				redis.lrange("Quiz:"+Qid,0,-1,function (err,qdetail){
					if(err) res.send(404);
					else{
						if(qdetail[7]){
							if( qdetail[7] == passwd ){
								res.cookie('Q',Qid);
								redis.exists("complete:"+user+":"+Qid,function (err, stat){
									if(err){}
									else{
										if(stat == 0){
											redis.lrange("Section:"+Qid+":0",0,7,function (err, secdetail){
												if(err){
													console.log("UNABLE TO GET SECTION DETAILS");
													res.send(404);
												}else{
													var pool = Quizdetail.indexOf(Qid); 
													if( pool == -1){
														console.log("here");
														Quizdetail.push(Qid);
														Quizdetail.push(qdetail.slice(9,qdetail.length));
														Quizdetail.push(1);
														console.log(Quizdetail);
													}else{
														//reference count of Quizdetail
														Quizdetail[pool+2]++;
													}
													if( userquizlog.indexOf(user) == -1){
														redis.exists("log:"+user+":"+Qid,function (err, stat){
															if(err){}
															else{
																if(stat == 1){
																	redis.lrange("log:"+user+":"+Qid, 0, -1,function (err, log){
																		console.log("yep");
																		var qno = parseInt(log[1])-1;
																		if(qno < 0) qno = 0;
																		userquizlog.push(user);
																		userquizlog.push(log[0]);
																		userquizlog.push(qno);
																		userquizlog.push(Qid);
																		userquizlog.push(log[2]);
																		userquizlog.push(log[2]);
																		userquizlog.push(log[2]);
																		console.log("dart");
																		res.redirect(307,'/showquiz?user='+ user + '&Qid=' + Qid + '&opti=###&' + '&time='+log[2]);
																		console.log("dart clurse");
																	});
																}else{
																	userquizlog.push(user);
																	userquizlog.push(0);
																	userquizlog.push(0);
																	userquizlog.push(Qid);
																	userquizlog.push(secdetail[5]);
																	userquizlog.push(secdetail[5]);
																	userquizlog.push(secdetail[5]);
																	redis.rpush("log:"+user+":"+Qid,0,0,secdetail[5]);	
																	redis.rpush( user+":"+Qid, "^");
																	res.render("info.ejs",{ title:user, Qid:Qid, secdetail : secdetail});
																}
															}
														});
													}else{
														redis.lrange("log:"+user+":"+Qid,0,-1,function (err, log){
															console.log("yep");
															var id = userquizlog.indexOf(user);
															var qno = parseInt(log[1]) - 1;
															if(qno < 0) qno = 0;
															userquizlog[id + 1] = log[0];
															userquizlog[id + 2] = qno;
															userquizlog[id + 4] = log[2];
															userquizlog[id + 5] = log[2];
															userquizlog[id + 6] = log[2];
															console.log("dart");
															res.redirect(307,'/showquiz?user='+ user + '&Qid=' + Qid + '&opti=###&' + '&time='+userquizlog[id+6]);
															console.log("dart clurse");
														});
													}	
												}
											} );
										}else{
											res.redirect('/eval?user='+user+'&Qid='+Qid);
										}
									}
								});
							}else{
								res.render('quiztakinglogin.ejs',{ title : "Wrong Password" });
							}
						}else{
							res.render('quiztakinglogin.ejs',{ title : "Wrong Quiz id" });
						}
					}
				});			
			}else{
				res.send(404);
			}
		}
	});
});

app.post('/showquiz',function (req, res){
	var user = req.param('user');
	console.log(user + " zzzzzzzzzzzzzzzzzzzzzzzooooooooooo");
	var Qid = req.param('Qid');
	var idx = userquizlog.indexOf(user);
	console.log(idx + " zzzzzzzzzzzzzzzzzzzzzzzooooooooooo");
	var idx1 = Quizdetail.indexOf(Qid);
	var secnum = parseInt(userquizlog[idx+1]);
	var qno = userquizlog[idx+2];
	console.log(qno + " zzzzzzzzzzzzzzzzzzzzzzzooooooooooo");
	console.log(Quizdetail);
	if( qno != parseInt(Quizdetail[idx1+1][secnum+1]) ){
		var time = userquizlog[idx+5];
		if(qno != 0){
			var ans = req.param('opti');
			if(!ans) ans = '?';
			console.log(ans);
			if(ans != "###"){
				redis.lindex(user + ":" + Qid , 0, function (err, data){
					if(err){
						console.log("ssssss=ssss");
					}else{
						data += ans;
						console.log(data);
						redis.lset(user+ ":" + Qid,0,data);
					}
				});	
			}
			//something to save
			time = parseInt(req.param('time'));
			var pass = parseInt(userquizlog[idx+5]) - parseInt(time);
			console.log(pass + " pass");
			console.log(time + " time");
			var hit = parseInt(new Date().getTime());
			var diff = hit - parseInt(userquizlog[idx+4]);
			console.log(parseInt(userquizlog[idx+4]));
			console.log(hit + " hit");
			console.log(diff + " diff");
			if( diff < pass-1111){
				console.log( user + " cheated");
				res.send("you cheated");
			}else{
				userquizlog[idx+5] = time;
			}
			console.log("point==4");
		}
		userquizlog[idx+6] = time;
		qno = qno*11+8;
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
				while(question[i] != "????" && i < 8 ) i++;
				console.log("what");
				if(question[1] == "????"){
					userquizlog[idx+4] = new Date().getTime();
					res.render('problem.ejs',{ title:user, timer:time ,Qid:Qid,text:question[0],pos:question[2],neg:question[3],option:question.slice(4,i+1)});
				}else if(question[1][0] == '/'){
					userquizlog[idx+4] = new Date().getTime();
					res.render('problem-img.ejs',{ title:user,timer:time,Qid:Qid,text:question[0],image:question[1],pos:question[2],neg:question[3],option:question.slice(4,i+1)});
				}else{
					//reserved for equations
				}
			}
		});	
	}else{
		if( secnum != parseInt(Quizdetail[idx1+1][0])-1 ){
			console.log("point==3");
			//section change
			var ans = req.param('opti');
			if(!ans) ans='?';
			var time = req.param('time');
			console.log(ans + "--------alpha");
			redis.lindex(user + ":" + Qid , secnum, function (err, data){
				if(err){
					console.log("ssssss=ssss");
				}else{
					data += ans;
					console.log(data);
					redis.lrange("Section:"+Qid+":"+secnum,8,-1,function (err, sectiondata){
						if(err){

						}else{
							var point = 0;
							for( var i = 1 ; i < data.length; i++){
								if( data[i] == sectiondata[ ((i-1)*10) + 8 ]){
									point += parseInt( sectiondata[ ((i-1)*10) + 2]);
								}else if( data[i] != '?'){
									point -= parseInt( sectiondata[ ((i-1)*10) + 3]);
								}
							}
							redis.rpush("result:"+user+":"+Qid,data,point,function (err, stack){
								if(err){

								}else{
									redis.lset(user+":"+Qid,0,"^");
								}
							});
						}
					});
				}
			});

			userquizlog[idx+2] = 0;
			userquizlog[idx+1]++;
			redis.lrange("Section:"+Qid+":"+ userquizlog[idx+1],0,7,function (err, secdetail){
				if(err){
					console.log("UNABLE TO GET SECTION DETAILS");
					res.send(404);
				}else{
					userquizlog[idx + 4] = secdetail[5];
					userquizlog[idx + 5] = secdetail[5];
					userquizlog[idx + 6] = secdetail[5];
					redis.lset("log:"+user+":"+Qid,0,userquizlog[idx + 1],function (err, rest){
						if(err){

						}else{
							console.log(rest);
							redis.lset("log:"+user+":"+Qid,1,userquizlog[idx + 2],function (err, rz){
								if(err){

								}else{
									console.log(rz);
									redis.lset("log:"+user+":"+Qid,2,secdetail[5], function (err, rx){
										if(err){

										}else{
											console.log(rx);
											console.log(secdetail[5] + " %%%%%%%%%%%%%%%%%%%%%%");
											console.log(userquizlog[idx+6] + " &&&&&&&&&&&&&&&&&&&&&&");
											res.render("info.ejs",{ title:user, Qid:Qid, secdetail : secdetail});						
										}
									});				
								}

							});		
						}
					});
					
					
								
				}
			} );
		}else{
			//quiz end()
			var ans = req.param('opti');
			if(!ans) ans='?';
			console.log(ans + "--------alpha");
			redis.lindex(user + ":" + Qid ,0, function (err, data){
				if(err){
					console.log("ssssss=ssss");
				}else{
					data += ans;
					console.log(data);
					redis.lrange("Section:"+Qid+":"+secnum,8,-1,function (err, sectiondata){
						if(err){

						}else{
							var point = 0;
							for( var i = 1 ; i < data.length; i++){
								if( data[i] == sectiondata[ ((i-1)*10) + 8 ]){
									point = point + parseInt( sectiondata[ ((i-1)*10) + 2]);
								}else if( data[i] != '?'){
									point = point -  parseInt( sectiondata[ ((i-1)*10) + 3]);
								}
							}
							redis.rpush("result:"+user+":"+Qid,data,point,function  (err,ty) {
								if(err){}
								else{
									userquizlog.splice(idx,7);
									Quizdetail[idx1 + 2]--;
									redis.del("log:"+user+":"+Qid);
									redis.rpush("complete:"+user+":"+Qid,1);
									if(Quizdetail[idx1 + 2] == 0){
										console.log("refrence count of quiz deleted");
										Quizdetail.splice(idx1,3);
									}

									res.redirect('/eval?user='+user+'&Qid='+Qid);
								}
							});
							
						}

					});
				}
			});
			console.log("point==2");
			//res.send("DONED");
		}
	}
});

/*			  socket.io stuff		 */ 

io.sockets.on('connection',function (socket){

	socket.on('storeme',function (user){
		console.log(user + "###############################################");
		sockuser.push(socket);
		sockuser.push(user);
	});
	
	socket.on('newuser',function(name,pass,email){
        redis.rpush(name,pass,email,0,0,"0:0:0",0, function (err, status){
        	if(err) console.log("RPUSH FOR USER DOSEN'T WORK");
        	redis.hset("email-user",email,name,function (err, result){
        		if(err) console.log("reverse mapping FOR USER DOSEN'T WORK");
        		console.log("uuuuuuuuu");
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
    
    // socket.on('updateTime',function (taker,time){
    // 	console.log( taker + ": left : " + time);
    // 	console.log('Time Left: ' + time );
    // 	userquizlog[userquizlog.indexOf(taker) + 4] = time;
    // });
	socket.on('nofault',function(user){
		sockuser.splice(sockuser.indexOf(socket),2);
	});

    socket.on('did',function( user, Qid){
    	console.log("heywire");
    	var idx = userquizlog.indexOf(user);
    	var id = Quizdetail.indexOf(Qid);
    	userquizlog[idx+2] = Quizdetail[1+id][parseInt(userquizlog[idx+1])+1];
    	socket.emit('end');
    });
    	socket.on('verify-pass',function (user,pass,newpass){
		redis.lindex(user,0,function (err, passwd){
			if(err) console.log("bush")
			else{
				if(pass == passwd){
					redis.lset(user,0,newpass);
					socket.emit("change");
				}
				else socket.emit("err");
			}
		});
	});


	socket.on('disconnect',function(){
		var z = sockuser.indexOf(socket);
		if( z != -1){
			var user =sockuser[sockuser.indexOf(socket)+1];
			var id = userquizlog.indexOf(user);
			if(id != -1){
				var t = parseInt(new Date().getTime()) - parseInt(userquizlog[id + 4]);
				console.log("disconnected >>>>>>>> "+ user);
				console.log("dddddddddddddd tttttttttttttttttt is : " + t );
				userquizlog[id+6] = parseInt(userquizlog[id+6]) - t;
				//userquizlog[id+6] = parseInt(userquizlog[id+6]) + parseInt(t) - parseInt(userquizlog[id+4]);
				var y = userquizlog[id+3];
				redis.lset("log:"+user+":"+y,0,userquizlog[id+1]);
				redis.lset("log:"+user+":"+y,1,userquizlog[id+2]);
				redis.lset("log:"+user+":"+y,2,userquizlog[id+6]);
				sockuser.splice(sockuser.indexOf(socket),2);	
			}	
		}
		
		

		/* do storing work*/
	});
});

//52d6c6aa500446bc2d00000b@quizzer-laukik.rhcloud.com
