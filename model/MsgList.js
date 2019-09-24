const mongoose =require('mongoose');
const MsgListSchema = new mongoose.Schema({
     time:String,
	 content:String,//发表的内容
	 refUser:String//用于关联用户id，也就是看这条说说是谁发表的
    });
module.exports = mongoose.model('MsgList', MsgListSchema);