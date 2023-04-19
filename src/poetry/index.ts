import dashjs from "dashjs";

class Poetry {
  public dom: HTMLVideoElement;
  private player: dashjs.MediaPlayerClass;
  constructor(src: string) {
    this.dom = document.createElement("video");
    this.player = dashjs.MediaPlayer().create();
    this.player.initialize(this.dom, src, true);

    // var controlbar = new ControlBar(player);
    // controlbar.initialize();
  }
}

export default Poetry;
