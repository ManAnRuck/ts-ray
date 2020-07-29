import path from "path";
import { readFileSync as read } from "fs";
import Xray from "../..";

const x = Xray();
const html = read(path.resolve(__dirname, "index.html"), "utf-8");

x(html, {
  title: ".title",
  image: "img@src",
  tags: ["li"],
})(console.log);
