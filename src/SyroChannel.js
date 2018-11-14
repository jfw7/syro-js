import {
  QAM_CYCLE,
  NUM_OF_CYCLE_BUF,
  NUM_OF_CHANNEL,
} from './constants';

const sinTable = [
  0,
  23169,
  32767,
  23169,
  0,
  -23169,
  -32767,
  -23169,
];

const getSinValue = (phase, isData) => {
  let ret = sinTable[phase];

  if (isData) {
    if (ret > 0) {
      ret = 32767 - ret;
      ret = Math.round((ret * ret) / 32767);
      ret = 32767 - ret;
    } else if (ret < 0) {
      ret += 32767;
      ret = Math.round((ret * ret) / 32767);
      ret -= 32767;
    }
  }

  return ret;
};

class SyroChannel {
  cycleSample;

  lastPhase;

  lpfZ;

  generateSingleCycle(writePage, dat, block) {
    let i;
    const phaseOrg = (dat >> 1) & 3;
    let phase = phaseOrg * (QAM_CYCLE / 4);
    let dat1;
    let dat2;
    const vol = (dat % 2 === 1) ? 16 : 4;
    let dlt;
    let writePos = writePage * QAM_CYCLE;
    const writePosLast = writePos ? (writePos - 1) : (NUM_OF_CYCLE_BUF - 1);

    for (i = 0; i < QAM_CYCLE; i += 1) {
      dat1 = getSinValue(phase, block);
      dat1 = (dat1 * vol) / 24;
      if (i !== 0) {
        if (phaseOrg !== this.lastPhase) {
          if (
            (this.lastPhase % 2 === 1 && phaseOrg % 2 === 1)
            || ((this.lastPhase + 1) % 4 === phaseOrg)
          ) {
            dat2 = this.cycleSample[writePosLast];
            dlt = dat1 - dat2;
            dlt = Math.floor(dlt / 3);
            dat1 -= dlt;
            dat2 += dlt;
            this.cycleSample[writePosLast] = dat2;
          }
        }
      }

      this.cycleSample[writePos] = dat1;
      writePos += 1;
      phase = (phase + 1) % QAM_CYCLE;
    }

    this.lastPhase = phaseOrg;
  }

  smoothStartMark(writePage) {
    const writePos = writePage * QAM_CYCLE;
    const writePosLast = writePos === 0 ? (NUM_OF_CYCLE_BUF - 1) : (writePos - 1);

    let dat1 = this.cycleSample[writePosLast];
    let dat2 = this.cycleSample[writePos];
    let dat3 = this.cycleSample[writePos + 1];

    const avg = Math.floor((dat1 + dat2 + dat3) / 3);

    dat1 = Math.floor((dat1 + avg) / 2);
    dat2 = Math.floor((dat2 + avg) / 2);
    dat3 = Math.floor((dat3 + avg) / 2);

    this.cycleSample[writePosLast] = dat1;
    this.cycleSample[writePos] = dat2;
    this.cycleSample[writePos + 1] = dat3;
  }

  makeGap(writePage) {
    for (let ch = 0; ch < NUM_OF_CHANNEL; ch += 1) {
      this.generateSingleCycle(writePage, 1, false);
    }
  }

  makeStartMark(writePage) {
    for (let ch = 0; ch < NUM_OF_CHANNEL; ch += 1) {
      this.generateSingleCycle(writePage, 5, false);
      this.smoothStartMark(writePage);
    }
  }

  makeChannelInfo(writePage) {
    for (let ch = 0; ch < NUM_OF_CHANNEL; ch += 1) {
      this.generateSingleCycle(writePage, ch, true);
    }
  }
}

export default SyroChannel;
