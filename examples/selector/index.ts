import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../../index";
const html = read(path.resolve(__dirname, "index.html"), "utf8");
const x = Xray();

x(html, "h2")(console.log);
