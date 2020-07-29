import Xray from "..";
var x = Xray();

x("http://google.com", {
  main: "title",
  image: x("https://images.google.com", "title"),
}).then(console.log);
