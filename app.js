const Koa = require('koa');
var path = require('path');
let koaBody = require('koa-body');
const cors = require('koa2-cors'); // 跨域
const chalk = require('chalk'); // color
const staticServer = require('koa-static');
const views = require('koa-views'); // views
const session = require('koa-session');
const http = require('http');
const LogFile = require('./middlewares/logHelper');
const apiError = require("./middlewares/apiError");
const FormatOutput = require("./middlewares/formatOutput");
const accessToken = require("./middlewares/accessToken");
const Mongodb = require("./middlewares/mongodbHelper");
const trans = require("./middlewares/transactions");
const mongodb = new Mongodb({
	host: 'localhost',
	port: 27017,
	user: 'data',
	pass: 'data@2019',
	db: 'stores',
	max: 100,
	min: 1,
});
const app = new Koa();
app.keys = ['this is my secret'];//我理解为一个加密的钥匙，类似一个token
const formatOutput = new FormatOutput();
const logger = new LogFile({
	appenders: {file: {filename: __dirname + "/logs/api.log", maxLogSize: 2048000}},
	categories: {
		file:{appenders: ['file'], level: 'debug'}
	},
	pm2InstanceVar: 'INSTANCE_ID_API'
});
// function
Date.prototype.format = function (fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};
function time(start,end) {
	const delta = end - start;
	return (delta < 10000
		? delta + 'ms'
		: Math.round(delta / 1000) + 's');
}
// Koa 推荐使用该命名空间挂载数据
app.context.mongodb = mongodb;
trans.mongodb = mongodb;

// middlewares

app.use(session({
	key: 'koa:sess-store', /** cookie的名称，可以不管 */
	maxAge: 7200000, /** 86400000 cookie的过期时间 maxAge in ms (default is 1 days) */
	overwrite: true, /** (boolean) can overwrite or not (default true) */
	httpOnly: true, /** cookie是否只有服务器端可以访问 httpOnly or not (default true) */
	signed: true, /** 签名默认true */
	rolling: true, /** 在每次请求时强行设置cookie，这将重置cookie过期时间（默认：false）**/
	renew: true  //(boolean) renew session when session is nearly expired,
},app));
app.use(cors()); // 跨域
// static file dir
app.use(staticServer(__dirname + '/public'));
app.use(views(__dirname + '/views', {
	map: {html: 'ejs'}
}));
// log
app.use(async (ctx, next) => {
	let start = Date.now();
	try {
		console.log(chalk.green('%s') + chalk.gray(' <--')
			+ chalk.bold(' %s')
			+ chalk.gray(' %s'),
			(new Date(start)).format('yyyy-M-d h:m:s.S'),
			ctx.method,
			ctx.originalUrl);
		ctx.state.ApiError = apiError;
		await next();
		let end = Date.now();
		let ms =time(start,end);
		//记录响应日志
		logger.debug(formatOutput.formatRes(ctx,ms));
		console.log(chalk.green('%s')
			+ chalk.gray(' -->')
			+ chalk.bold(' %s')
			+ chalk.gray(' res:%s')
			+ chalk.green(' %s')
			+ chalk.gray(' %s'),
			(new Date(end)).format('yyyy-M-d h:m:s.S'),
			ctx.method,
			JSON.stringify(ctx.body),
			ctx.response.status,
			ms);
	} catch (error) {
		let end = Date.now();
		let ms =time(start,end);
		// 错误信息开始
		// logger.error(`${ctx.method} ${ctx.url} - ${ms}ms ctx.response.status: ${ctx.response.status}`);
		logger.error(formatOutput.formatError(ctx,error,ms));
		console.log(chalk.red('%s')
			+ chalk.gray(' -->')
			+ chalk.bold(' %s')
			+ chalk.gray(' res:%s')
			+ chalk.yellow(' %s')
			+ chalk.gray(' %s'),
			(new Date(end)).format('yyyy-M-d h:m:s.S'),
			ctx.method,
			JSON.stringify(ctx.body),
			ctx.response.status,
			ms);
	}
});
// Format output
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (error) {
		ctx.body = error.message + ",详情:" + error.details;
		ctx.status = error.status || 503;
		throw error; // ->logs
	}
});
// 登录检查
const allowPage = [/^\/login/,/^\/users\/\S+\/password/];
//拦截
app.use(async (ctx, next) => {
	let url = ctx.originalUrl;
	// let method = ctx.req.method;
	for(let i =0,len = allowPage.length;i<len;i++){
		if(allowPage[i].test(url)){
			await next();
			return;
		}
	}
	let Authorization = ctx.request.get("Authorization");
	if (!ctx.session.user) {
		console.log('login status validate fail')
		console.log(ctx.request.url);
		let isAjaxRequest = ctx.request.get("X-Requested-With");
		ctx.assert(!isAjaxRequest, 401, "客户端登录错误!",{details:" 没有登录或登录过期,请重新登录!"});
		ctx.redirect('/login');
		return;
	}
	await next();
});
app.use(koaBody({
	formLimit:"5mb",
	jsonLimit:"5mb",
	textLimit:"1mb",
	multipart: true,
	formidable:{
		maxFileSize: 200*1024*1024,   // 设置上传文件大小最大限制，默认2M
		uploadDir:"public/images",
		keepExtensions:true,
		onFileBegin: function (name, file) {
			let fileName = parseInt(Math.random() * 100) + Date.parse(new Date()).toString();
			file.name = file.name.replace(/.+(?=\.)/, path.join("images", fileName));
			file.path = path.join("public", file.name);
		}
	}
}));
// routes
var route = require('./middlewares/routesHelper');
route.init(app);

// 404 url error
app.use(async (ctx, next) => {
	ctx.throw(404, ctx.message,{details:{url:ctx.request.originalUrl}});
	// await ctx.render('common/404')
});
// error-handling log catch error
app.on('error', (err, ctx) => {
	console.log('server error:', err, ctx);
});

// http 服务
const port =  3000;
const service = http.createServer(app.callback()).listen(port);
service.on('error', (error)=> {
	if (error.syscall !== 'listen') {
		throw error;
	}
	let bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
});
service.on('listening', ()=>{
	let addr = service.address();
	let bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	console.log('the Service is listening on ' + bind);
});

/*
// https 服务
const https = require('https');
// SSL options
let fs = require('fs');
let options = {
	key: fs.readFileSync(__dirname + '/ssl/privatekey.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/certificate.pem')
};
const services = https.createServer(options, app.callback()).listen(1443);
*/
