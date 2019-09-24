const mongoose =require('mongoose');
const userSchema = new mongoose.Schema({
    //openId
    openId: String,//唯一标识
	icon:{
		type:String,
		default:''
	},//用户头像
	nickName:{
		type:String,
		default:''
	}//用户昵称
    });
module.exports = mongoose.model('User', userSchema);