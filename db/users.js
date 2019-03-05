db.getCollection("users").insert( {
    _id: "admin",
    account: "admin",
    name: "超级管理员",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: null,
    right: [
        NumberInt("0")
    ],
    role: "5c35e56621ae3d18d81bc838",
    shop: null,
    theme: null
} );
db.getCollection("users").insert( {
    _id: "15052221631",
    account: null,
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
        NumberInt("5"),
        NumberInt("16"),
        NumberInt("18"),
        NumberInt("19")
    ],
    role: null,
    shop: null,
    theme: "ui-darkness"
} );
db.getCollection("users").insert( {
    _id: "15052221632",
    account: null,
    name: "刘洋",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: "15052221631",
    right: [
        NumberInt("2"),
        NumberInt("3"),
        NumberInt("16")
    ],
    role: null,
    shop: "5c616a3e21ae3d2914e9ac19",
    theme: null
} );
db.getCollection("users").insert( {
    _id: "15052221633",
    account: null,
    name: "老刘",
    pass: "e10adc3949ba59abbe56e057f20f883e",
    pId: "15052221631",
    right: null,
    role: null,
    shop: "5c616a3e21ae3d2914e9ac19",
    theme: null
} );
