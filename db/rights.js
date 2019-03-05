db.getCollection("rights").insert( {
    _id: ObjectId("5c60e13a21ae3d2914e9abed"),
    id: NumberInt("1"),
    name: "销售管理",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e17a21ae3d2914e9abef"),
    id: NumberInt("2"),
    name: "销售开单",
    pId: NumberInt("1"),
    url: "sales"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e22e21ae3d2914e9abf3"),
    id: NumberInt("3"),
    name: "销售审核",
    pId: NumberInt("1"),
    url: "salesReview"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e54a21ae3d2914e9abf9"),
    id: NumberInt("4"),
    name: "库存管理",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e5e821ae3d2914e9abfc"),
    id: NumberInt("5"),
    name: "用户管理",
    pId: NumberInt("7"),
    url: "users"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e65721ae3d2914e9abff"),
    id: NumberInt("6"),
    name: "商品种类",
    pId: NumberInt("7"),
    url: "goods"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e6d821ae3d2914e9ac02"),
    id: NumberInt("7"),
    name: "系统管理",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e71e21ae3d2914e9ac05"),
    id: NumberInt("8"),
    name: "入库管理",
    pId: NumberInt("4"),
    url: "stocks"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e7a921ae3d2914e9ac08"),
    id: NumberInt("9"),
    name: "库存异动",
    pId: NumberInt("4"),
    url: "stocksUnusual"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e89721ae3d2914e9ac0b"),
    id: NumberInt("10"),
    name: "店铺管理",
    pId: NumberInt("7"),
    url: "shops"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c6166dd21ae3d2914e9ac11"),
    id: NumberInt("11"),
    name: "客户管理",
    pId: NumberInt("7"),
    url: "customers"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c64b9f5caebbb2bd80059e2"),
    id: NumberInt("12"),
    name: "定价查询",
    pId: NumberInt("1"),
    url: "prices"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c64ba98caebbb2bd80059e3"),
    id: NumberInt("13"),
    name: "统计分析",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c64baf5caebbb2bd80059e4"),
    id: NumberInt("14"),
    name: "销售统计",
    pId: NumberInt("13"),
    url: "salesStatistics"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c64bbe1caebbb2bd80059e5"),
    id: NumberInt("15"),
    name: "库存统计",
    pId: NumberInt("13"),
    url: "stocksStatistics"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c692fe821ae3d21807eb29b"),
    id: NumberInt("16"),
    name: "销售查询",
    pId: NumberInt("13"),
    url: "salesSearch"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c6d0e741b2c7414a4332d6b"),
    id: NumberInt("17"),
    name: "供应商管理",
    pId: NumberInt("7"),
    url: "suppliers"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c721fa021ae3d17c07a23ba"),
    id: NumberInt("18"),
    name: "库存警报",
    pId: NumberInt("4"),
    url: "stocksWarn"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c7e7b0021ae3d2b9850e344"),
    id: NumberInt("19"),
    name: "退换货",
    pId: NumberInt("1"),
    url: "afterSales"
} );
