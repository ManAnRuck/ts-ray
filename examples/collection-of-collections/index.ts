import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

var html = read(path.resolve(__dirname, "index.html"), "utf-8");

var x = Xray();

x(html, ".item", [
  {
    title: "h2",
    tags: x(".tags", ["li"]),
  },
])(console.log);
