// @ts-ignore
import MP4Box from "mp4box";
import VideoFileLoader from "./FileLoader";

class Drama {
  private ms: MediaSource;
  private file: any;
  private url: string;
  // key: trackId
  private sbs: Map<
    number,
    {
      track_id: number;
      sb: SourceBuffer;
      pendding_buffers: BufferSource[];
      state: "pending" | "idle";
      pending_callback?: () => void;
    }
  > = new Map();

  private onAllSbIdle?: () => void;

  public dom: HTMLVideoElement;

  constructor(url: string) {
    this.url = url;

    this.ms = new MediaSource();
    this.ms.addEventListener("sourceopen", this.feedMs.bind(this));

    this.dom = document.createElement("video");
    this.dom.src = window.URL.createObjectURL(this.ms);
  }

  private feedMs() {
    this.file = MP4Box.createFile();

    this.file.onError = (error: any) => {
      console.log(error);
    };
    this.file.onReady = (info: any) => {
      console.log(info);

      for (let i = 0; i < info.tracks.length; i++) {
        const track = info.tracks[i];
        let mime = "";
        if (track.type === "video") {
          mime = 'video/mp4; codecs="' + track.codec + '"';
        } else {
          mime = 'audio/mp4; codecs="' + track.codec + '"';
        }
        console.log(mime);

        if (MediaSource.isTypeSupported(mime)) {
          console.log("支持MSE");
          const sb = this.ms.addSourceBuffer(mime);
          this.sbs.set(track.id, {
            track_id: track.id,
            sb,
            pendding_buffers: [],
            state: "idle",
          });

          this.file.setSegmentOptions(track.id, sb, { nbSamples: 4000 });
        }
      }

      const initSegs = this.file.initializeSegmentation();
      //   var pendingInits = 0;
      for (let i = 0; i < initSegs.length; i++) {
        const { id, user, buffer } = initSegs[i];
        const sb = this.sbs.get(id);
        if (sb) {
          sb.pendding_buffers.push(buffer);
        }
      }
      this.onAllSbIdle = () => {
        console.log("all sb idle");
        this.onAllSbIdle = undefined;
        this.file.start();
      };
      this.appendBuffer();
    };

    this.file.onSegment = (
      id: any,
      user: any,
      buffer: any,
      sampleNumber: any,
      last: any
    ) => {
      console.log("onSegment", id, user, buffer, sampleNumber, last);
      const sb = this.sbs.get(id);
      if (sb) {
        sb.pendding_buffers.push(buffer);
      }

      this.appendBuffer();
    };

    // get loader?
    VideoFileLoader.loadVideo(
      this.url,
      this.file,
      (this.file.isProgressive && 1024 * 1024 * 2) || -1
    );
  }

  private appendBuffer() {
    this.sbs.forEach((sb) => {
      if (sb.state === "idle" && sb.pendding_buffers.length > 0) {
        sb.state = "pending";
        this.runAppendBuffer(sb);
      }
    });
  }

  private runAppendBuffer(task: {
    track_id: number;
    sb: SourceBuffer;
    pendding_buffers: BufferSource[];
    state: "pending" | "idle";
    pending_callback?: () => void;
  }) {
    if (task.pending_callback) {
      task.sb.removeEventListener("updateend", task.pending_callback);
    }
    // 取出一个buffer
    const nextBuffer = task.pendding_buffers.shift();
    if (nextBuffer) {
      const fn = this.runAppendBuffer.bind(this, task);
      task.pending_callback = fn;

      task.sb.addEventListener("updateend", fn);
      // console.log("append buffer to sb of track", task.track_id);
      task.sb.appendBuffer(nextBuffer);
    } else {
      task.state = "idle";

      // 检查所有task是否都为idle状态
      let allIdle = true;
      this.sbs.forEach((sb) => {
        if (sb.state === "pending") {
          allIdle = false;
        }
      });

      if (allIdle && this.onAllSbIdle) {
        this.onAllSbIdle();
      }
    }
  }
}

export default Drama;
