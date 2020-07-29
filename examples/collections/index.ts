import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

var x = Xray();
var html = read(path.resolve(__dirname, "index.html"), "utf-8");

x(html, {
  title: ".title",
  image: "img@src",
  tags: ["li"],
})(console.log);
