

/* garbage */








// redis.lrange("Section:"+Qid+":"+i,0,-1,function (err, sectiondata){
// 	if(err){
// 		console.log('Section not Exists ****');
// 		res.send(404);
// 	}else{
// 		datauser.push(sectiondata[1]);
// 		redis.lrange("result:"+user+":"+Qid,function (err,result){
// 			if(err){
// 				console.log('result not Exists ****');
// 				res.send("result not Exists");
// 			}else{
				
// 				for( var k = 1 ; k < result.length; k++){
// 					var choice = [];
// 					var corre = [];
// 					var color = [];
// 					var solu = sectiondata[ ((k-1)*10) + 8];
// 					corre.push(sectiondata[ ((k-1)*10) + solu + 4 ]);
// 					if( result[2*(k-1)][k] == solu){
// 						choice.push(sectiondata[ ((k-1)*10) + solu + 4 ]);
// 						color.push("success");
// 					}else if( result[2*(k-1)][i] != '?'){
// 						choice.push(sectiondata[ ((k-1)*10) + result[k] + 4 ]);
// 						color.push("danger");
// 					}else{
// 						choice.push("-");
// 						color.push("warning");
// 					}
// 					datauser.push(choice);
// 					datauser.push(corre);
// 					datauser.push(color);
// 					datauser.push()
// 				}
// 			}
// 		});
// 	}
// });



