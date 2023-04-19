import Drama from "./drama";
import Poetry from "./poetry";

export type SupportMime = "video/mp4" | "video/webm" | "application/dash+xml";

export function createVideoElement(src: string, extension?: SupportMime) {
  let mime = extension;

  if (!mime) {
    const ext = src.split(".").pop();
    if (ext === "mpd") {
      mime = "application/dash+xml";
    } else if (ext === "webm") {
      mime = "video/webm";
    } else if (ext === "mp4") {
      mime = "video/mp4";
    } else {
      throw new Error("Unsupported extension");
    }
  }
  if (mime === "application/dash+xml") {
    // DASH
    const video = new Poetry(src);

    return video;
  }
  if (mime === "video/mp4") {
    // mp4, 使用Mp4Box进行实时分段, 流喂入MSE， 通过video标签播放
    const video = new Drama(src);

    return video;
  }
}
