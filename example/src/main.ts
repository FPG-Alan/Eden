import { createVideoElement } from "lib";

import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const video = createVideoElement("/test2/test2.mp4");
if (video.dom) {
  video.dom.width = 300;
  video.dom.controls = true;
  app.appendChild(video.dom);
}

const video_dash = createVideoElement("/test2/output.mpd");
if (video_dash.dom) {
  video_dash.dom.width = 300;
  video_dash.dom.controls = true;
  app.appendChild(video_dash.dom);
}

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
//   <p>The sum of 1 and 2 is ${sum(1, 2)}</p>
// `;
