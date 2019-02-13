db.getCollection("users").insert( {
    _id: ObjectId("5c3517db80e2d10d3c9a9077"),
    account: "15052221631",
    name: "曹中心",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: "admin",
    right: [
        NumberInt("2"),
        NumberInt("3"),
        NumberInt("10"),
        NumberInt("11"),
        NumberInt("9"),
        NumberInt("8"),
        NumberInt("6"),
        NumberInt("5")
    ],
    role: null,
    shop: null
} );
db.getCollection("users").insert( {
    _id: ObjectId("5c3a0fb5d99aa52b6cd27a54"),
    account: "15052221632",
    name: "刘洋",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: "15052221631",
    right: [
        NumberInt("2"),
        NumberInt("3")
    ],
    role: null,
    shop: "5c616a3e21ae3d2914e9ac19"
} );
db.getCollection("users").insert( {
    _id: ObjectId("5c35175880e2d10d3c9a9076"),
    account: "admin",
    name: "超级管理员",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: null,
    right: [
        NumberInt("0")
    ],
    role: "5c35e56621ae3d18d81bc838",
    shop: null
} );
db.getCollection("users").insert( {
    _id: ObjectId("5c6181dba10e482944d31ecc"),
    account: "15052221633",
    name: "老刘2",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: "15052221631",
    right: [
        NumberInt("2"),
        NumberInt("3")
    ],
    role: null,
    shop: "5c61780300623526c8dc92ec"
} );
