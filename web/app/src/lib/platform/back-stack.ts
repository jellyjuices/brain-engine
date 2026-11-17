interface Layer {
  close: () => void;
}

const layers: Layer[] = [];
const waiting: (() => void)[] = [];
let skips = 0;

function settle() {
  waiting.splice(0).forEach((run) => run());
}

export function openLayer(close: () => void): () => void {
  const layer: Layer = { close };
  history.pushState(history.state, "");
  layers.push(layer);
  return function release() {
    const at = layers.indexOf(layer);
    if (at < 0) return;
    layers.splice(at, 1);
    skips += 1;
    history.back();
  };
}

export function takePop(): boolean {
  if (skips > 0) {
    skips -= 1;
    if (skips === 0) settle();
    return true;
  }
  const top = layers.pop();
  top?.close();
  return top !== undefined;
}

export function whenSettled(run: () => void) {
  if (skips > 0) waiting.push(run);
  else run();
}

export function resetLayers() {
  layers.length = 0;
  waiting.length = 0;
  skips = 0;
}
