import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../../index";
var html = read(path.resolve(__dirname, "index.html"), "utf8");
var x = Xray();

x(html, "h2")(console.log);
