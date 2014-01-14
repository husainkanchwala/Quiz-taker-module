var redis = require('redis').createClient();

redis.lindex("Quiz:1222",1,function  (err, result) {
	if(err) console.log("aaaaa");
	else{
		if(result) console.log("bbbbb");
		else console.log("ccccccc");
	}
});