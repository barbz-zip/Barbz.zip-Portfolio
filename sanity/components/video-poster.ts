function waitForVideo(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked', signal: AbortSignal, start: () => void) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error('The video took too long to load.')), 30000);
    const ready = () => finish();
    const failed = () => finish(new Error('This browser could not decode the video.'));
    const aborted = () => finish(new DOMException('Aborted', 'AbortError'));
    function finish(error?: unknown) {
      clearTimeout(timeout);
      video.removeEventListener(event, ready);
      video.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener(event, ready);
    video.addEventListener('error', failed);
    signal.addEventListener('abort', aborted, {once: true});
    try { start(); } catch (error) { finish(error); }
  });
}

export async function captureVideoFrames(url: string, mode: 'poster' | 'sequence', signal: AbortSignal): Promise<Blob> {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  try {
    await waitForVideo(video, 'loadedmetadata', signal, () => { video.src = url; video.load(); });
    const sequence = mode === 'sequence' && Number.isFinite(video.duration) && video.duration > 0;
    const fractions = sequence ? [0, 0.33, 0.67, 0.95] : [0];
    const columns = sequence ? 2 : 1;
    const scale = Math.min(1, (sequence ? 640 : 1920) / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = columns * width;
    canvas.height = (sequence ? 2 : 1) * height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not capture the video.');
    for (const [index, fraction] of fractions.entries()) {
      // A seek inside the opening frame waits for drawable pixels even on Safari.
      const time = fraction === 0 ? 0.000001 : fraction * video.duration;
      await waitForVideo(video, 'seeked', signal, () => { video.currentTime = time; });
      context.drawImage(video, (index % columns) * width, Math.floor(index / columns) * height, width, height);
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('The video frame could not be encoded.'));
    }, 'image/jpeg', 0.9));
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}
