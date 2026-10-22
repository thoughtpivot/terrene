import { startApp } from "./app";

const root = document.querySelector("#app");
if (!root) {
    throw new Error("Missing #app");
}
startApp(root as HTMLElement);
