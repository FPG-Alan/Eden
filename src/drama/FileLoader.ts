export type MP4ArrayBuffer = ArrayBuffer & { fileStart: number };

class VideoFileLoader {
  private cacheFileSink: Map<string, CacheFileSink> = new Map();
  /**
   * 请求一个buffer来填充mp4File, 有以下三种状态
   * 1. 没有本地缓存， 则直接请求网络， 并将请求缓存
   * 2. 有缓存， 但数据流进行中， 则将MP4file添加到流中， 并同步append之前所有的buffer缓存
   * 3. 有缓存， 且流已经关闭， 则同步append
   *
   * chunkSize: 每次请求的大小, 默认2M
   */
  loadVideo(url: string, mp4File: any, chunkSize: number = 1024 * 1024) {
    const cacheFileSink = this.cacheFileSink.get(url);
    if (cacheFileSink) {
      cacheFileSink.addMp4File(mp4File);
      return;
    }

    const fileSink = new CacheFileSink(mp4File);

    this.cacheFileSink.set(url, fileSink);

    console.log(chunkSize);
    if (chunkSize === -1) {
      console.log("load video without chunk");
      // 不分片， mp4可能不是progressive的
      fetch(url, {
        headers: {
          Range: `bytes=0-`, // 从0开始
        },
      }).then((response) => {
        console.log("pipe stream");
        response.body?.pipeTo(
          new WritableStream(fileSink, { highWaterMark: 1024 * 1024 * 2 })
        );
      });
    } else {
      // 首先确定文件大小
      fetch(url, {
        headers: {
          Range: "bytes=0-1", // 只请求一个字节
        },
      }).then((response) => {
        const contentRange = response.headers.get("Content-Range");
        // bytes 0-76758784/76758785
        if (contentRange) {
          const total = contentRange.split("/")[1];
          const totalSize = parseInt(total);

          console.log(totalSize);

          this.feedFileSink(url, chunkSize, fileSink, 0, totalSize);
        }
      });
    }
  }

  feedFileSink(
    url: string,
    chunkSize: number,
    fileSink: CacheFileSink,
    offset: number,
    total: number
  ) {
    const start = offset;
    const end = Math.min(offset + chunkSize, total);

    console.log(`load chunk from ${start} to ${end}`);
    fetch(url, {
      headers: {
        Range: (end < total && `bytes=${start}-${end}`) || `bytes=${start}-`, // 从0开始
      },
    }).then((response) => {
      response.body?.pipeTo(new WritableStream(fileSink, { highWaterMark: 2 }));

      if (end < total) {
        this.feedFileSink(url, chunkSize, fileSink, end + 1, total);
      }
    });
  }
}

class CacheFileSink {
  private cache: MP4ArrayBuffer[] = [];
  private offset = 0;
  private mp4Files: any[] = [];
  private state: "loading" | "closed" = "loading";

  private writeNum = 0;

  constructor(mp4File: any) {
    this.mp4Files.push(mp4File);
  }

  /**
   * 动态添加mp4File
   */
  addMp4File(mp4File: any) {
    for (let i = 0, l = this.cache.length; i < l; i++) {
      const buffer = this.cache[i];
      mp4File.appendBuffer(buffer);
    }

    if (this.state === "closed") {
      mp4File.flush();
    }
    this.mp4Files.push(mp4File);
  }
  write(chunk: Uint8Array) {
    // MP4Box.js requires buffers to be ArrayBuffers, but we have a Uint8Array.
    const buffer = new ArrayBuffer(chunk.byteLength) as MP4ArrayBuffer;
    new Uint8Array(buffer).set(chunk);

    // Inform MP4Box where in the file this chunk is from.
    buffer.fileStart = this.offset;
    this.offset += buffer.byteLength;
    this.writeNum += 1;

    console.log(`${this.writeNum} 次写入, buffer size: ${buffer.byteLength}`);

    // 保存buffer
    this.cache.push(buffer);

    for (let i = 0, l = this.mp4Files.length; i < l; i++) {
      const file = this.mp4Files[i];
      console.log("append buffer", this.offset);
      file.appendBuffer(buffer);
    }
  }

  close() {
    for (let i = 0, l = this.mp4Files.length; i < l; i++) {
      const file = this.mp4Files[i];
      file.flush();
    }

    this.state = "closed";
  }
}

export default new VideoFileLoader();
