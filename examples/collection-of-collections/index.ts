import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

const html = read(path.resolve(__dirname, "index.html"), "utf-8");

const x = Xray();

x(html, ".item", [
  {
    title: "h2",
    tags: x(".tags", ["li"]),
  },
])(console.log);
