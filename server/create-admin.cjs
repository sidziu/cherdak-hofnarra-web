const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const args = process.argv.slice(2);

if(!args[0]){
    console.log("Укажите пароль в аргументах при запуске. Например, \"node create-admin.js qwerty\"")
    process.exit(1)
}

const PASSWORD = args[0]

const adminData = {
    username: "admin",
    passwordHash: bcrypt.hashSync(PASSWORD, 10) 
};

const dirPath = path.join(__dirname, "data");
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

fs.writeFileSync(
    path.join(dirPath, "admin.json"), 
    JSON.stringify(adminData, null, 2)
);

console.log("Администратор успешно создан в data/admin.json!");
