var redis = require('redis').createClient('6379','127.0.0.1');
redis.set('x11','laukik',function  (err, res) {
	if(err){
		console.log('err');
	}else{
		console.log(res);
	}
});
redis.get('x11',function (err, x11){
	if(err){
		console.log('err 2');
	}else{
		console.log(x11);
	}
});