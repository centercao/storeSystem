let trans = {
    mongodb: null
};
module.exports = trans;

setTimeout(function () {
    // 执行事务
    setInterval(async function () {
        try {
            let ts = await trans.mongodb.db.collection('transactions').find({state: 0}).toArray();
            for (let i = 0, l = ts.length; i < l; i++) {
                switch (ts[i].type) {
                    case 0:{ // 相关插入
                        let res = await trans.mongodb.db.collection('transactions').updateOne({
                            _id: ts[i]._id,
                            state: 0
                        }, {
                            $set: {state: 1}, $currentDate: {lastModified: true}
                        }); // pending
                        if (res.modifiedCount != 1)
                            return;
                        for (let j = 0, l = ts[i].items.length; j < l; j++) {
                            try {
                                await trans.mongodb.db.collection('transactions').insertOne(ts[i].items[j]);
                            } catch (e) {

                            }
                        }
                        for (let j = 0, l = ts[i].items.length; j < l; j++) {
                            res = await trans.mongodb.db.collection('transactions').updateOne({
                                _id: ts[i].items[j]._id,
                                state: -1
                            }, {
                                $set: {state: 0}, $currentDate: {lastModified: true}
                            });
                            if (res.modifiedCount != 1)
                                break;
                        }
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 1}, {
                            $set: {state: 3}, $currentDate: {lastModified: true}
                        }); // done
                        if (res.modifiedCount != 1)
                            return;
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id}); // done
                    }
                    break;
                    case 1 : { // 分库
                        try{
                            let res = await trans.mongodb.db.collection(ts[i].d_c).insertOne(ts[i].args);
                            res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 0}, {
                                $set: {state: 1}, $currentDate: {lastModified: true}
                            });// pending
                        }catch (e) {

                        }
                        let res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                _id: ts[i].d_id,
                                trans: {$ne: ts[i]._id}
                            },
                            {$push: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                _id: ts[i].s_id,
                                trans: {$ne: ts[i]._id}
                            },
                            {$push: {trans: ts[i]._id}, $inc: {num: -ts[i].args.num}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 1}, {
                            $set: {state: 2}, $currentDate: {lastModified: true} // applied
                        });
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                _id: ts[i].d_id,
                                trans: ts[i]._id
                            },
                            {$pull: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({_id: ts[i].s_id, trans: ts[i]._id},
                            {$pull: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 2}, {
                            $set: {state: 3}, $currentDate: {lastModified: true}
                        }); // done
                        if (res.modifiedCount != 1)
                            return;
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id}); // done
                    }
                        break;
                    case 2 : { // 编辑分库
                        let res = await trans.mongodb.db.collection('transactions').updateOne({
                            _id: ts[i]._id,
                            state: 0
                        }, {
                            $set: {state: 1}, $currentDate: {lastModified: true}
                        }); // pending
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                _id: ts[i].d_id,
                                trans: {$ne: ts[i]._id}, oNum: {$exists: false}
                            },
                            {$rename: {num: "oNum"}}); // 改为oNum
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).findOneAndUpdate({
                                _id: ts[i].d_id,
                                trans: {$ne: ts[i]._id}, "oNum": {$exists: true}
                            },
                            {$push: {trans: ts[i]._id}, $set: ts[i].args}); // 修改
                        if (res.lastErrorObject.n != 1)
                            return;
                        let oldNum = res.value.oNum;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                _id: ts[i].s_id,
                                trans: {$ne: ts[i]._id}
                            },
                            {$push: {trans: ts[i]._id}, $inc: {num:  oldNum - ts[i].args.num}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                            _id: ts[i].d_id,
                            trans: ts[i]._id, oNum: {$exists: true}
                        }, {$unset: {"oNum": true}}); // 移除oNum
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 1}, {
                            $set: {state: 2}, $currentDate: {lastModified: true} // applied
                        });
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                _id: ts[i].d_id,
                                trans: ts[i]._id
                            },
                            {$pull: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({_id: ts[i].s_id, trans: ts[i]._id},
                            {$pull: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 2}, {
                            $set: {state: 3}, $currentDate: {lastModified: true}
                        }); // done
                        if (res.modifiedCount != 1)
                            return;
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id}); // done
                    }
                        break;
                    case 3 : { // 删除分库
                        let res = await trans.mongodb.db.collection('transactions').updateOne({
                            _id: ts[i]._id,
                            state: 0
                        }, {
                            $set: {state: 1}, $currentDate: {lastModified: true}
                        }); // pending
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).findOne({
                            _id: ts[i].d_id,
                            trans: {$ne: ts[i]._id}
                        });
                        let oldNum = res ? res.num : 0;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                _id: ts[i].s_id,
                                trans: {$ne: ts[i]._id}
                            },
                            {$push: {trans: ts[i]._id}, $inc: {num: oldNum}}); // 更新主库
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                _id: ts[i].d_id,
                                trans: {$ne: ts[i]._id}
                            },
                            {$push: {trans: ts[i]._id}}); // 更新sub库
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].d_c).deleteOne({
                            _id: ts[i].d_id,
                            trans: ts[i]._id
                        });
                        if (res.deletedCount != 1) // 删除分库
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 1}, {
                            $set: {state: 2}, $currentDate: {lastModified: true} // applied
                        });
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({_id: ts[i].s_id, trans: ts[i]._id},
                            {$pull: {trans: ts[i]._id}});
                        if (res.modifiedCount != 1)
                            return;
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 2}, {
                            $set: {state: 3}, $currentDate: {lastModified: true}
                        }); // done
                        if (res.modifiedCount != 1)
                            return;
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id}); // done
                    }
                        break;
                    default:
                        break;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, 2000);
// 恢复操作
    setInterval(async function () {
        try {
            let dateThreshold = new Date();
            dateThreshold.setSeconds(dateThreshold.getSeconds() - 30);
            let ts = await trans.mongodb.db.collection('transactions').find({state: {$gt: 0, $lt: 4}, lastModified: {$lt: dateThreshold}
            }).toArray();
            for (let i = 0, l = ts.length; i < l; i++) {
                switch (ts[i].state) {
                    case 1: { // pending
                        switch (ts[i].type) {
                            case 0:{ // 单纯的插入,不涉及第二个的那种
                            }
                                break;
                            case 1 : { // 分库
                                let result =0;
                                let res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                        _id: ts[i].d_id,
                                        trans: {$ne: ts[i]._id}
                                    },
                                    {$push: {trans: ts[i]._id}});
                                result += res.modifiedCount;
                                res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                        _id: ts[i].s_id,
                                        trans: {$ne: ts[i]._id}
                                    },
                                    {$push: {trans: ts[i]._id}, $inc: {num: -ts[i].args.num}});
                                result += res.modifiedCount;
                                if(result == 0){
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].s_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].d_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                }
                                res = await trans.mongodb.db.collection('transactions').updateOne({
                                    _id: ts[i]._id,
                                    state: 1
                                }, {
                                    $set: {state: 2}, $currentDate: {lastModified: true} // applied
                                });
                            }
                                break;
                            case 2 : { // 编辑分库
                                let result =0;
                                let res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                        _id: ts[i].d_id,
                                        trans: {$ne: ts[i]._id}, oNum: {$exists: false}
                                    },
                                    {$rename: {num: "oNum"}}); // 改为oNum
                                result += res.modifiedCount;
                                res = await trans.mongodb.db.collection(ts[i].d_c).findOneAndUpdate({
                                        _id: ts[i].d_id,
                                        trans: {$ne: ts[i]._id}, "oNum": {$exists: true}
                                    },
                                    {$push: {trans: ts[i]._id}, $set: ts[i].args}); // 修改
                                let oldNum = 0;
                                if (res.lastErrorObject.n == 1) {
                                    oldNum = res.value.oNum;
                                } else {
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({
                                        _id: ts[i].d_id,
                                        trans: ts[i]._id, "oNum": {$exists: true}
                                    });
                                    oldNum = res ? res.oNum : 0;
                                }
                                res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                        _id: ts[i].s_id,
                                        trans: {$ne: ts[i]._id}
                                    },
                                    {$push: {trans: ts[i]._id}, $inc: {num:oldNum-ts[i].args.num}});
                                result += res.modifiedCount;
                                res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                    _id: ts[i].d_id,
                                    trans: ts[i]._id, oNum: {$exists: true}
                                }, {$unset: {"oNum": true}}); // 移除oNum
                                result += res.modifiedCount;
                                if(result == 0){
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].s_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].d_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                }
                                res = await trans.mongodb.db.collection('transactions').updateOne({
                                    _id: ts[i]._id,
                                    state: 1
                                }, {
                                    $set: {state: 2}, $currentDate: {lastModified: true} // applied
                                });
                            }
                                break;
                            case 3 : { // 删除分库
                                let result =0;
                                let res = await trans.mongodb.db.collection(ts[i].d_c).findOneAndUpdate({
                                    _id: ts[i].d_id,
                                    trans: {$ne: ts[i]._id}
                                }, {$push: {trans: ts[i]._id}});
                                let oldNum = 0;
                                if (res.lastErrorObject.n == 1) {
                                    oldNum = res.value.num;
                                } else {
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({
                                        _id: ts[i].d_id,
                                        trans: ts[i]._id
                                    });
                                    oldNum = res ? res.num : 0;
                                }
                                res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({
                                        _id: ts[i].s_id,
                                        trans: {$ne: ts[i]._id}
                                    },
                                    {$push: {trans: ts[i]._id}, $inc: {num: oldNum}}); // 更新主库
                                result += res.modifiedCount;
                                res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({
                                        _id: ts[i].d_id,
                                        trans: {$ne: ts[i]._id}
                                    },
                                    {$push: {trans: ts[i]._id}}); // 更新sub库
                                result += res.modifiedCount;
                                if(result == 0){
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].s_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                    res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].d_id});
                                    if(!res){
                                        res = await trans.mongodb.db.collection('transactions').updateOne({
                                            _id: ts[i]._id,
                                            state: 1
                                        }, {
                                            $set: {state: 4}, $currentDate: {lastModified: true} // canceling
                                        });
                                        return;
                                    }
                                }
                                res = await trans.mongodb.db.collection(ts[i].d_c).deleteOne({
                                    _id: ts[i].d_id,
                                    trans: ts[i]._id
                                });
                                res = await trans.mongodb.db.collection('transactions').updateOne({
                                    _id: ts[i]._id,
                                    state: 1
                                }, {
                                    $set: {state: 2}, $currentDate: {lastModified: true} // applied
                                });
                            }  // 删除分库
                                break;
                            default:
                                break;
                        }
                    }
                        break;
                    case 2: { // applied
                        let res = await trans.mongodb.db.collection(ts[i].d_c).updateOne({_id: ts[i].d_id, trans: ts[i]._id},
                            {$pull: {trans: ts[i]._id}});
                        res = await trans.mongodb.db.collection(ts[i].s_c).updateOne({_id: ts[i].s_id, trans: ts[i]._id},
                            {$pull: {trans: ts[i]._id}});
                        res = await trans.mongodb.db.collection('transactions').updateOne({_id: ts[i]._id, state: 2}, {
                            $set: {state: 3}, $currentDate: {lastModified: true}
                        }); // done
                        res = await trans.mongodb.db.collection('transactions').deleteOne({
                            _id: ts[i]._id,
                            state: 3
                        }); // done
                    }
                        break;
                    case 3: { // done
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id, state: 3}); // done
                    }
                        break;
                    default:
                        break;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, 50000);

// 回滚操作
    setInterval(async function () {
        try {
            let dateThreshold = new Date();
            dateThreshold.setSeconds(dateThreshold.getSeconds() - 50);
            let ts = await trans.mongodb.db.collection('transactions').find({state: {$gt: 3}, lastModified: {$lt: dateThreshold}
            }).toArray();
            for (let i = 0, l = ts.length; i < l; i++) {
                switch (ts[i].state) {
                    case 4: { // pending
                        let res = await trans.mongodb.db.collection(ts[i].d_c).findOne({_id: ts[i].s_id});
                        if(!res){
                            await trans.mongodb.db.collection(ts[i].d_c).deleteMany({pId: ts[i].s_id});
                        }
                        await trans.mongodb.db.collection('transactions').updateOne({
                            _id: ts[i]._id,
                            state: 4
                        }, {
                            $set: {state: 5}, $currentDate: {lastModified: true} // canceling
                        });
                    }
                        break;
                    case 5: { // done
                        await trans.mongodb.db.collection('transactions').deleteOne({_id: ts[i]._id, state: 5}); // done
                    }
                        break;
                    default:
                        break;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, 80000);
}, 3000);
