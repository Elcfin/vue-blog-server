const bcrypt = require("bcrypt");

/* 将密码转换成哈希值 */
const encrypt = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
};

module.exports = { encrypt };
