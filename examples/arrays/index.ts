import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

const html = read(path.resolve(__dirname, "index.html"), "utf-8");
const x = Xray();

x(html, ["a"])(console.log);
