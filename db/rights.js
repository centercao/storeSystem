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
    url: "sale"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e22e21ae3d2914e9abf3"),
    id: NumberInt("3"),
    name: "销售审核",
    pId: NumberInt("1"),
    url: "sale/review"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e54a21ae3d2914e9abf9"),
    id: NumberInt("4"),
    name: "系统管理",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e5e821ae3d2914e9abfc"),
    id: NumberInt("5"),
    name: "用户管理",
    pId: NumberInt("4"),
    url: "users"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e65721ae3d2914e9abff"),
    id: NumberInt("6"),
    name: "商品种类",
    pId: NumberInt("4"),
    url: "goods"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e6d821ae3d2914e9ac02"),
    id: NumberInt("7"),
    name: "库存管理",
    pId: NumberInt("0"),
    url: null
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e71e21ae3d2914e9ac05"),
    id: NumberInt("8"),
    name: "入库管理",
    pId: NumberInt("7"),
    url: "stock"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e7a921ae3d2914e9ac08"),
    id: NumberInt("9"),
    name: "库存异动",
    pId: NumberInt("7"),
    url: "stock/unusual"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c60e89721ae3d2914e9ac0b"),
    id: NumberInt("10"),
    name: "店铺管理",
    pId: NumberInt("4"),
    url: "shops"
} );
db.getCollection("rights").insert( {
    _id: ObjectId("5c6166dd21ae3d2914e9ac11"),
    id: NumberInt("11"),
    name: "客户管理",
    pId: NumberInt("4"),
    url: "customers"
} );
