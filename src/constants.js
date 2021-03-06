export const MAX_SYRO_DATA = 10;

export const WAV_HEADER = [
  0x52, 0x49, 0x46, 0x46, // 'RIFF'
  0x00, 0x00, 0x00, 0x00, // Size (data size + 0x24)
  0x57, 0x41, 0x56, 0x45, // 'WAVE'
  0x66, 0x6d, 0x74, 0x20, // 'fmt '
  0x10, 0x00, 0x00, 0x00, // Fmt chunk size
  0x01, 0x00, // encode(wav)
  0x02, 0x00, // channel = 2
  0x44, 0xAC, 0x00, 0x00, // Fs (44.1kHz)
  0x10, 0xB1, 0x02, 0x00, // Bytes per sec (Fs * 4)
  0x04, 0x00, // Block Align (2ch,16Bit -> 4)
  0x10, 0x00, // 16Bit
  0x64, 0x61, 0x74, 0x61, // 'data'
  0x00, 0x00, 0x00, 0x00, // data size(bytes)
];

export const WAVFMT_POS_ENCODE = 0x00;
export const WAVFMT_POS_CHANNEL = 0x02;
export const WAVFMT_POS_FS = 0x04;
export const WAVFMT_POS_BIT = 0x0E;

export const WAV_POS_RIFF_SIZE = 0x04;
export const WAV_POS_WAVEFMT = 0x08;
export const WAV_POS_DATA_SIZE = 0x28;

export const NUM_OF_CHANNEL = 2;
export const QAM_CYCLE = 8;
export const NUM_OF_CYCLE = 2;
export const NUM_OF_CYCLE_BUF = QAM_CYCLE * NUM_OF_CYCLE;

export const LITTLE_ENDIAN = 'LITTLE_ENDIAN';
export const BIG_ENDIAN = 'BIG_ENDIAN';
