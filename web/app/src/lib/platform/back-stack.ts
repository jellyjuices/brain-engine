interface Layer {
  close: () => void;
  released: boolean;
}

const layers: Layer[] = [];
const waiting: (() => void)[] = [];
let skips = 0;

function settle() {
  waiting.splice(0).forEach((run) => run());
}

function popEntries(count: number) {
  if (count === 0) return;
  skips += 1;
  history.go(-count);
}

function releasedOnTop(): number {
  let count = 0;
  while (layers.at(-1)?.released) {
    layers.pop();
    count += 1;
  }
  return count;
}

export function openLayer(close: () => void): () => void {
  const layer: Layer = { close, released: false };
  history.pushState({ ...(history.state as object | null), layer: true }, "");
  layers.push(layer);
  return function release() {
    if (layer.released || !layers.includes(layer)) return;
    layer.released = true;
    popEntries(releasedOnTop());
  };
}

export function closeAllLayers() {
  const open = layers.splice(0);
  popEntries(open.length);
  open.reverse().forEach((layer) => layer.released || layer.close());
}

export function isLayerEntry(): boolean {
  return (history.state as { layer?: unknown } | null)?.layer === true;
}

export function skipLayerEntry() {
  skips += 1;
  history.back();
}

export function takePop(): boolean {
  if (skips > 0) {
    skips -= 1;
    if (skips === 0) settle();
    return true;
  }
  const top = layers.pop();
  if (!top) return false;
  top.close();
  popEntries(releasedOnTop());
  return true;
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
