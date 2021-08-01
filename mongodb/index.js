const mongoose = require("mongoose");
const db = require("./db.js");

/* mongoose 数据库连接 */
mongoose
  .connect(`mongodb://${db.hostname}:${db.port}/${db.name}`)
  .then(() => {
    console.log(`${db.name} is connected successfully`);
  })
  .catch((err) => {
    console.log(err);
  });

/* 针对 mongoose warning，
`findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. */
mongoose.set("useFindAndModify", false);
