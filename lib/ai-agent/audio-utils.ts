export class AudioProcessor {
  static normalizeAudioVolume(buffer: Buffer): Buffer {
    // Convert to 16-bit samples
    const samples = new Int16Array(buffer.buffer, buffer.byteOffset + 44, (buffer.length - 44) / 2);
    
    // Find peak value
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
    }
    
    // Normalize to prevent clipping
    if (peak > 0) {
      const normalizeRatio = 0.8 * 32767 / peak; // 80% of max to prevent distortion
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.round(samples[i] * normalizeRatio);
      }
    }
    
    return buffer;
  }

  static removeClicks(buffer: Buffer): Buffer {
    const samples = new Int16Array(buffer.buffer, buffer.byteOffset + 44, (buffer.length - 44) / 2);
    
    // Simple click removal - smooth sudden jumps
    for (let i = 1; i < samples.length - 1; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const next = samples[i + 1];
      
      // Detect sudden jump (click)
      if (Math.abs(curr - prev) > 8000 && Math.abs(curr - next) > 8000) {
        // Smooth the sample
        samples[i] = Math.round((prev + next) / 2);
      }
    }
    
    return buffer;
  }
}