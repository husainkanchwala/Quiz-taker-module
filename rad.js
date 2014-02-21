var crypto = require('crypto');
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







var x = encrypt('laukik',"laukik");
console.log(x);