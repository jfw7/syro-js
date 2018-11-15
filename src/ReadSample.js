import {
  LITTLE_ENDIAN,
} from './constants';

class ReadSample {
  numOfSample;

  bitlenEff;

  sampleEndian;

  sum;

  padding;

  getPcm() {
    let dat;
    // if (this.sampleEndian === LITTLE_ENDIAN) {
    //  dat = (int32_t)((int8_t)(prp->ptr[1]));
    //  dat <<= 8;
    //  dat |= (int32_t)(*prp->ptr);
    //  prp->ptr += 2;
    // } else {
    //  dat = (int32_t)((int8_t)(*prp->ptr++));
    //  dat <<= 8;
    //  dat |= (int32_t)(*prp->ptr++);
    // }

    /* ----- convert, 16Bit -> specified bit ----*/
    if (this.bitlenEff < 16) {
      dat /= (1 << (16 - this.bitlenEff)); // replace from  dat >>= (16 - prp->bitlen_eff);
      this.sum += dat << (16 - this.bitlenEff);
    } else {
      this.sum += dat;
    }

    return dat;
  }
}

export default ReadSample;
