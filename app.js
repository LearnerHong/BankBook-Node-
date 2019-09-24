var https = require('https'); //这个模块在这里是用于向腾讯服务端发起请求。
var qs = require('querystring');
var sd = require('silly-datetime');//引入此模块，在后台获取时间
const express = require('express') //引入express框架；
const cors = require('cors') //引入允许跨域请求模块
const bodyParser = require('body-parser'); //这个模块用于解析请求，比如json格式。
const mongoose = require('mongoose'); //mogodb数据库操作工具
const User = require('./model/User.js'); //引入model实例操作数据库
const MsgList = require('./model/MsgList.js'); //(说说列表数据库)
const app = express();
app.use(cors()) //全局使用
app.use(bodyParser.json())
// 解析 application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(function (req, res, next) {
	responseData = {
	  code: 0,
	  message: ''
	}
	next();
  });
  
// 用户登录的时候，把获取到的code 发送到自己服务器
app.post('/getopenid', function(req, res, next) {
	const APPID = 'wx0279e49bc6504436'; //这里填你的APPID，要和微信开发者工具里项目的appid一致
	const secret = '50168bf12931a57ef30e4b91915640d3';
	const JSCODE = req.body.code; //这个是微信登录成功够获取到code。
	console.log(JSCODE)
	
	//自己服务器再请求腾讯服务器获取openid，这个openid是用户的唯一标识，因为用户名，这些都会更改，
	https.get("https://api.weixin.qq.com/sns/jscode2session?appid=" + APPID + "&secret=" + secret + "&js_code=" + JSCODE +
		"&grant_type=authorization_code",
		function(data) {
			var str = "";
			data.on("data", function(chunk) {
				str += chunk; //监听数据响应，拼接数据片段
			})
			data.on("end", function() {
				let openId = JSON.parse(str).openid; //JSON.parse将字符串转为对象
				console.log("用户得openID是：", openId);
				
				let user = new User({
					openId: openId
				}); //实例modle
				user.save(); //将这个用户存入数据库
				
				res.json(openId); //将这个数据返回给客户端。

			})
		}
	);
})
/**
 * 存储或者更新用户头像和昵称，前端获取到用户头像和昵称就可以发送这个请求
 */
app.post('/updateUser',function(req,res){ 
	//存储和更新头像这个是为了展示说说的时候看别人的有头像和昵称。
	let openId = req.body.openId; //获取客户端发来的openid;用来从数据库里定位用户
	let icon = req.body.userInfo.avatarUrl;
	let nickName = req.body.userInfo.nickName;
	console.log(openId)
	console.log(icon)
	console.log(nickName)
	
	User.findOneAndUpdate({openId:openId}, {icon:icon,nickName:nickName},function(err,doc){
		if(doc){
			console.log("将昵称和头像信息存入数据库....")
			res.send();//不返回任何东西
		}
		else{
			console.log(err)
		}
	})
})
app.post('/saveMsg', function (req, res) {

	let refUser = req.body.openId; //获取客户端发来的openid;用来从数据库里查找用户
	console.log("获取到的信息" + req.body);
	const content = req.body.content;
	const time = sd.format(new Date(), 'YYYY-MM-DD HH:mm');
	console.log(time);
	console.log(content)
	console.log(refUser)

	/**
	 * 将用户的openId关联（内嵌）到MgsList表中
	 */
	let msg = new MsgList({
		time: time,
		content: content,
		refUser: refUser
	}); //实例modle

	msg.save(function (err, doc) {
		if (err) {
			res.json('网络错误')
			return;
		}
		else {
			res.json('发表成功')//返回给客户端的信息
		}

	})
	//将这个消息存入数据库
})

//获取说说列表
app.get('/msgList', function (req, res) {
	console.log("收到请求，正在处理中...")
	/*
	根据openid关联查询用户信息——是查询所有的说说。
	*/
	MsgList.aggregate([  //关联查询
		{
			$lookup:
			{
				from: "User",//MsgList和User表相关联
				/**
				 * 代表了MsgList表的一个字段：refUser
				 * 代表了User表的一个字段：openId关联条件 refUser = openId
				 */
				localField: "refUser",
				foreignField: "openId",//openId 是说说里面的，发表说说的时候 就把这个id和说说内容放在一个表里。
				as: "userInfo"
			}
		}
	], function (err, docs) {
		if (err) {
			console.log(err);
			responseData.message = '获取错误';
			res.json(responseData)
			return
		}
		else {
			res.json(docs)
		}
	})
})
// 设置默认 mongoose 连接
//监听http请求
mongoose.connect('mongodb://localhost:27017/test', {
	useNewUrlParser: true
}, function (err) {
	if (err) 
	{
		console.log('数据库连接失败');
	} else
	 {
		console.log('数据库连接成功');
		app.listen(8081); //启动服务器。将这个放在这里是防止数据库连接失败但是服务器启动了然后导致报错。
	}
});
//设置更新相关驱动
mongoose.set('useFindAndModify', false);