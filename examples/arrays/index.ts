import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

var html = read(path.resolve(__dirname, "index.html"), "utf-8");
var x = Xray();

x(html, ["a"])(console.log);
