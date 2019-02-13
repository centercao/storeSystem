db.getCollection("roles").insert( {
    _id: ObjectId("5c35e56a21ae3d18d81bc83a"),
    name: "管理员",
    right: [
        NumberInt("0"),
        NumberInt("1"),
        NumberInt("2")
    ]
} );
db.getCollection("roles").insert( {
    _id: ObjectId("5c35e56621ae3d18d81bc838"),
    name: "店员",
    right: [
        NumberInt("1"),
        NumberInt("2"),
        NumberInt("3")
    ]
} );
db.getCollection("roles").insert( {
    _id: ObjectId("5c35e55f21ae3d18d81bc836"),
    name: "库管",
    right: [
        NumberInt("3"),
        NumberInt("4"),
        NumberInt("5")
    ]
} );
