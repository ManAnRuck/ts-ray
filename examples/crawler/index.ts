import Xray from "../..";
const x = Xray();

x("http://www.imdb.com/", {
  title: ["title"],
  links: x(".rhs-body .rhs-row", [
    {
      text: "a",
      href: "a@href",
      next_page: x("a@href", {
        title: "title",
        heading: "h1",
      }),
    },
  ]),
})(function (err: Error, obj: any) {
  console.log(err, obj);
});
