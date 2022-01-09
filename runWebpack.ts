import { runWebpack } from "./src/backend/helpers/webpack";

(async function () {
  await runWebpack();
})();

console.log("This is done");
