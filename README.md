### 2023/04/17

首先， 这是一个前端的， 视频播放器
其次， 我不会在这个项目里从 0 开始对视频进行 muxing/demuxing/code/decode 方面的工作

Eden 的主要目标是

1. 提供对 mp4/web 的, 跨普通视频和 DASH 的播放体验， 这部分主要集成 Dash.js
2. ~~提供 mov 的前端播放能力(技术验证阶段)~~
   - ~~需要解决 QTFF 到 ISO BMFF(mp4) / Matroska(webm)的转换问题~~
   - ~~考虑透明通道~~
3. 提供获取单帧 ImageData 的能力
