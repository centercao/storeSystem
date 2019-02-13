/**
 * Created by center ON 17-11-27
 */
/*********************属性**********************
 * account
 * name
 * password
 * img
 * login/logout：{token，reToken}
 **********************属性*********************/
const router = require('koa-router')();
const crypto = require('crypto');
router.prefix('/goods');
function cryptoPassFunc (password) {
	const md5 = crypto.createHash('md5'); //'sha1', 'md5', 'sha256', 'sha512'等
	return md5.update(password).digest('hex');
}
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('goods', {
		title:"商品种类管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.account};
	let projection={pass:0,right:0};
	let res = await ctx.mongodb.db.collection('goods').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(ctx.session.user.account, 400, "参数错误!",{details:{ pId: "undefined"}});
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	// if(ctx.session.user.right.indexOf(0)==-1){
	// 	ctx.assert(body.shop, 400, "参数错误!",{details:{ shop: "undefined"}});
	// }
	let res = await ctx.mongodb.db.collection('goods').insertOne({remarks:body.remarks,name:body.name,
		pId: ctx.session.user.pId});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.insertedId.toString()};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "未定义"}});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('goods').updateOne({_id:ctx.mongodb.ObjectID(id)},
		{$set:{name:body.name,remarks:body.remarks}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('goods').deleteOne({_id:ctx.mongodb.ObjectID(id)});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
module.exports = router;