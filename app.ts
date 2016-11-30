/*
korg_syro_volcasample_example.c
*/
const MAX_SYRO_DATA: number = 10;

const WAV_HEADER: Array<number> = [
    0x52, 0x49, 0x46, 0x46,        // 'RIFF'
    0x00, 0x00, 0x00, 0x00,        // Size (data size + 0x24)
    0x57, 0x41, 0x56, 0x45,        // 'WAVE'
    0x66, 0x6d, 0x74, 0x20,        // 'fmt '
    0x10, 0x00, 0x00, 0x00,        // Fmt chunk size
    0x01, 0x00,                    // encode(wav)
    0x02, 0x00,                    // channel = 2
    0x44, 0xAC, 0x00, 0x00,        // Fs (44.1kHz)
    0x10, 0xB1, 0x02, 0x00,        // Bytes per sec (Fs * 4)
    0x04, 0x00,                    // Block Align (2ch,16Bit -> 4)
    0x10, 0x00,                    // 16Bit
    0x64, 0x61, 0x74, 0x61,        // 'data'
    0x00, 0x00, 0x00, 0x00        // data size(bytes)
];

const WAVFMT_POS_ENCODE: number = 0x00;
const WAVFMT_POS_CHANNEL: number = 0x02
const WAVFMT_POS_FS: number = 0x04;
const WAVFMT_POS_BIT: number = 0x0E;

const WAV_POS_RIFF_SIZE: number = 0x04;
const WAV_POS_WAVEFMT: number = 0x08;
const WAV_POS_DATA_SIZE: number = 0x28;





/*
korg_syro_func.h
*/
const NUM_OF_CHANNEL: number = 2;
const QAM_CYCLE: number = 8;
const NUM_OF_CYCLE: number = 2;
const NUM_OF_CYCLE_BUF: number = QAM_CYCLE * NUM_OF_CYCLE;

class SyroChannel {
    cycleSample: Array<number>;
    lastPhase: number;
    lpfZ: number;
    generateSingleCycle(writePage: number, dat: number, block: boolean): void {
        let i: number;
        let phaseOrg: number;
        let phase: number;
        let dat1: number;
        let dat2: number;
        let vol: number;
        let dlt: number;
        let writePos: number;
        let writePosLast: number;

        writePos = writePage * QAM_CYCLE;
        writePosLast = writePos ? (writePos - 1) : (NUM_OF_CYCLE_BUF - 1);

        phaseOrg = (dat >> 1) & 3;
        phase = phaseOrg * (QAM_CYCLE / 4);
        vol = (dat & 1);
        vol = vol ? 16 : 4;

        for (i=0; i < QAM_CYCLE; i++) {
            dat1 = getSinValue(phase, block);
            dat1 = (dat1 * vol) / 24;
            if (! i) {
                if (phaseOrg != this.lastPhase) {
                    if (((this.lastPhase & 1) && (phaseOrg & 1) ||
                        ((this.lastPhase + 1) & 3) == phaseOrg))
                    {
                        dat2 = this.cycleSample[writePosLast];
                        dlt = dat1 - dat2;
                        dlt = Math.floor(dlt / 3);
                        dat1 -= dlt;
                        dat2 += dlt;
                        this.cycleSample[writePosLast] = dat2;
                    }
                }
            }

            this.cycleSample[writePos++] = dat1;
            if ((++phase) == QAM_CYCLE) {
                phase =0;
            }
        }
        this.lastPhase = phaseOrg;
    }
    smoothStartMark(writePage: number): void {
        let writePos: number;
        let writePosLast: number;
        let dat1: number;
        let dat2: number;
        let dat3: number;
        let avg: number;

        writePos = writePage * QAM_CYCLE;
        writePosLast = writePos ? (writePos - 1) : (NUM_OF_CYCLE_BUF - 1);

        dat1 = this.cycleSample[writePosLast];
        dat2 = this.cycleSample[writePos];
        dat3 = this.cycleSample[writePos + 1];

        avg = Math.floor((dat1 + dat2 + dat3) / 3);

        dat1 = Math.floor((dat1 + avg) / 2);
        dat2 = Math.floor((dat2 + avg) / 2);
        dat3 = Math.floor((dat3 + avg) / 2);

        this.cycleSample[writePosLast] = dat1;
        this.cycleSample[writePos] = dat2;
        this.cycleSample[writePos + 1] = dat3;
    }

    makeGap(writePage: number): void {
        let ch: number;
        for (ch = 0; ch < NUM_OF_CHANNEL; ch++) {
            this.generateSingleCycle(writePage, 1, false);
        }
    }

    makeStartMark(writePage: number): void {
        let ch: number;
        for (ch = 0; ch < NUM_OF_CHANNEL; ch++) {
            this.generateSingleCycle(writePage, 5, false);
            this.smoothStartMark(writePage);
        }
    }

    makeChannelInfo(writePage: number): void {
        let ch: number;
        for (ch = 0; ch < NUM_OF_CHANNEL; ch++) {
            this.generateSingleCycle(writePage, ch, true);
        }
    }
}



/*
korg_syro_func.c
*/
const eccTable: Array<number> = [
    0x00,0x55,0x56,0x03,0x59,0x0C,0x0F,0x5A,0x5A,0x0F,0x0C,0x59,0x03,0x56,0x55,0x00,
    0x65,0x30,0x33,0x66,0x3C,0x69,0x6A,0x3F,0x3F,0x6A,0x69,0x3C,0x66,0x33,0x30,0x65,
    0x66,0x33,0x30,0x65,0x3F,0x6A,0x69,0x3C,0x3C,0x69,0x6A,0x3F,0x65,0x30,0x33,0x66,
    0x03,0x56,0x55,0x00,0x5A,0x0F,0x0C,0x59,0x59,0x0C,0x0F,0x5A,0x00,0x55,0x56,0x03,
    0x69,0x3C,0x3F,0x6A,0x30,0x65,0x66,0x33,0x33,0x66,0x65,0x30,0x6A,0x3F,0x3C,0x69,
    0x0C,0x59,0x5A,0x0F,0x55,0x00,0x03,0x56,0x56,0x03,0x00,0x55,0x0F,0x5A,0x59,0x0C,
    0x0F,0x5A,0x59,0x0C,0x56,0x03,0x00,0x55,0x55,0x00,0x03,0x56,0x0C,0x59,0x5A,0x0F,
    0x6A,0x3F,0x3C,0x69,0x33,0x66,0x65,0x30,0x30,0x65,0x66,0x33,0x69,0x3C,0x3F,0x6A,
    0x6A,0x3F,0x3C,0x69,0x33,0x66,0x65,0x30,0x30,0x65,0x66,0x33,0x69,0x3C,0x3F,0x6A,
    0x0F,0x5A,0x59,0x0C,0x56,0x03,0x00,0x55,0x55,0x00,0x03,0x56,0x0C,0x59,0x5A,0x0F,
    0x0C,0x59,0x5A,0x0F,0x55,0x00,0x03,0x56,0x56,0x03,0x00,0x55,0x0F,0x5A,0x59,0x0C,
    0x69,0x3C,0x3F,0x6A,0x30,0x65,0x66,0x33,0x33,0x66,0x65,0x30,0x6A,0x3F,0x3C,0x69,
    0x03,0x56,0x55,0x00,0x5A,0x0F,0x0C,0x59,0x59,0x0C,0x0F,0x5A,0x00,0x55,0x56,0x03,
    0x66,0x33,0x30,0x65,0x3F,0x6A,0x69,0x3C,0x3C,0x69,0x6A,0x3F,0x65,0x30,0x33,0x66,
    0x65,0x30,0x33,0x66,0x3C,0x69,0x6A,0x3F,0x3F,0x6A,0x69,0x3C,0x66,0x33,0x30,0x65,
    0x00,0x55,0x56,0x03,0x59,0x0C,0x0F,0x5A,0x5A,0x0F,0x0C,0x59,0x03,0x56,0x55,0x00
];

const crc16Table: Array<number> = [
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
    0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
    0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
    0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
    0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
    0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
    0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
    0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
    0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
    0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
    0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
    0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
    0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
    0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
    0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
    0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
    0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
    0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
    0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
    0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
    0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
    0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
    0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
    0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
    0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
    0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
    0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
    0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
    0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
    0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
    0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
    0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
];

const sinTable = [
    0,     23169,     32767,     23169,     0,     -23169, -32767, -23169
];

// https://gist.github.com/chitchcock/5112270
const calculateCrc16 = function(arr: Array<number>): number {
    let crc: number = 0xFFFF;
    let j: number;
    let i: number;

    for (i = 0; i < arr.length; i++) {
        let c: number = arr[i];
        if (c > 255) {
            throw new RangeError();
        }
        j = (c ^ (crc >> 8)) & 0xFF;
        crc = crc16Table[j] ^ (crc << 8);
    }

    return ((crc ^ 0) & 0xFFFF);
}

const calculateEcc = function(arr: Array<number>): number {
    let i: number;
    let eccReg1: number;
    let eccReg2: number;
    let eccReg3: number;
    let ecc1: number;
    let ecc2: number;
    let bitPatA: number;
    let bitPatB: number;
    let ci: number;
    let ecc: number;

    eccReg1 = 0;
    eccReg2 = 0;
    eccReg3 = 0;

    for (i = 0; i < arr.length; i++) {
        ci = eccTable[arr[i]];
        eccReg1 ^= ci;
        if (ci & 0x40) {
            eccReg3 ^= i;
            eccReg2 ^= 0xff - i
        }
    }

    ecc1 = 0;
    ecc2 = 0;

    bitPatA = 0x80;
    bitPatB = 0x80;

    for (i = 0; i < 4; i++) {
        if (eccReg3 & bitPatA) {
            ecc1 |= bitPatB;
        }
        bitPatB >>= 1;
        if (eccReg2 & bitPatA) {
            ecc1 |= bitPatB;
        }
        bitPatB >>= 1;
        bitPatA >>= 1;
    }

    bitPatB = 0x80;
    for (i = 0; i < 4; i++) {
        if (eccReg3 & bitPatA) {
            ecc2 |= bitPatB;
        }
        bitPatB >>= 1;
        if (eccReg2 & bitPatA) {
            ecc2 |= bitPatB;
        }
        bitPatB >>= 1;
        bitPatA >>= 1;
    }


    eccReg1 = ((eccReg1 << 2) & 0xff) | 3;

    ecc = eccReg1;
    ecc <<= 8;
    ecc |= ecc2;
    ecc <<= 8;
    ecc |= ecc1;

    return ecc;
}

const getSinValue = function(phase: number, data: boolean): number {
    let ret: number;

    ret = sinTable[phase];

    if (data) {
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
}

/*
korg_syro_volcasample.h
*/
const VERSION: number = 0x100;
const NUM_OF_SAMPLE: number = 100;
const NUM_OF_PATTERN: number = 10;
const PATTERN_SIZE: number = 0xA40;

enum SyroStatus {
    Status_Success,

    //------ Start -------
    Status_IllegalDataType,
    Status_IllegalData,
    Status_IllegalParameter,
    Status_OutOfRange_Number,
    Status_OutOfRange_Quality,
    Status_NotEnoughMemory,

    //------ GetSample/End  -------
    Status_InvalidHandle,
    Status_NoData
}

enum Endian {
    LittleEndian,
    BigEndian
}

enum SyroDataType {
    DataType_Sample_Liner,
    DataType_Sample_Compress,
    DataType_Sample_Erase,
    DataType_Sample_All,
    DataType_Sample_AllCompress,
    DataType_Pattern
}

class SyroData {
    dataType: SyroDataType;
    // pointer pData
    number: number;   // sample:0-99, pattern:0-9
    size: number;     // byte size (if type==Sample)
    quality: number;  // specific Sample bit (8-16), if type=LossLess
    sampleEndian: Endian;
}

// SyroHandle?

/*
korg_syro_volcasample.c
*/
const NUM_OF_DATA_MAX: number = NUM_OF_PATTERN + NUM_OF_SAMPLE;
const SAMPLE_FS: number = 31250;
const MANAGE_HEADER: number = 0x47524F4B;
const ALL_INFO_SIZE: number = 0x4000;

const BLOCK_SIZE: number = 256;
const BLOCK_PER_SECTOR: number = 256;
const BLOCK_PER_SUBSECTOR: number = 16;
const SUBSECTOR_SIZE: number = BLOCK_SIZE * BLOCK_PER_SUBSECTOR;

const LPF_FEEDBACK_LEVEL: number = 0x2000;

const NUM_OF_GAP_HEADER_CYCLE: number = 10000;
const NUM_OF_GAP_CYCLE: number = 35;
const NUM_OF_GAP_F_CYCLE: number = 1000;
const NUM_OF_GAP_3S_CYCLE: number = 15000;
const NUM_OF_GAP_FOOTER_CYCLE: number = 3000;

const NUM_OF_FRAME_GAP_HEADER: number = NUM_OF_GAP_HEADER_CYCLE * QAM_CYCLE;
const NUM_OF_FRAME_GAP: number = NUM_OF_GAP_CYCLE * QAM_CYCLE;
const NUM_OF_FRAME_GAP_F: number = NUM_OF_GAP_F_CYCLE * QAM_CYCLE;
const NUM_OF_FRAME_GAP_3S: number = NUM_OF_GAP_3S_CYCLE * QAM_CYCLE;
const NUM_OF_FRAME_GAP_FOOTER: number = NUM_OF_GAP_FOOTER_CYCLE * QAM_CYCLE;
const NUM_OF_FRAME_HEADER: number = 49 * QAM_CYCLE;
const NUM_OF_FRAME_BLOCK: number = 352 * QAM_CYCLE;

const TXHEADER_STR_LEN: number = 16;
const TXHEADER_STR: string = "KORG SYSTEM FILE";
const TXHEADER_DEVICE_ID: number = 0xff0033b8;
const TXHEADER_BLOCK_ALL: number = 0x01;
const TXHEADER_BLOCK_ALL_COMPRESS: number = 0x03;
const TXHEADER_BLOCK_SAMPLE_LINER: number = 0x10;
const TXHEADER_BLOCK_PATTERN: number = 0x20;
const TXHEADER_BLOCK_SAMPLE_COMPRESS: number = 0x30;

enum SyroTaskStatus {
    taskStatusGap = 0,
    taskStatusStartMark,
    taskStatusChannelInfo,
    taskStatusData,
    taskStatusGapFooter,
    taskStatusEnd = -1
}

class SyroTxHeader {
    header: Array<number>;
    deviceId: number;
    blockCode: number;
    num: number;

    misc: Array<number>;
    size: Array<number>;

    mReserved: number;
    mSpeed: number;
}

class SyroManage {
    header: number;
    flag: number;
    taskStatus: SyroTaskStatus;
    taskCount: number;

    numOfData: number;
    curData: number;

    // pointer???
    dataCount: number;
    dataSize: number;
    eraseAlign: number;
    eraseLength: number;
    eraseCount: number;
    isCompData: boolean;
    compBlockPos: number;
    blockLenFirst: number;

    sampleEndian: Endian;

    txBlock: Array<number>;
    txBlockSize: number;
    txBlockPos: number;

    poolData: number;
    poolDataBit: number;

    useEcc: boolean;
    eccData: number;
    useCrc: boolean;
    crcData: number;

    channel: Array<SyroChannel>
    cyclePos: number;
    frameCountInCycle: number;

    longGapCount: number;

    setupNextData(): void {
        let psth: SyroTxHeader;
        let block: number;
    }
}

class SyroManageSingle {
    data: SyroData;
    // pointer?
    compSize: number;
}




/*
korg_syro_comp.h
*/
const COMP_BLOCK_LEN: number = 0x800;


let ptrArray: Uint8Array;
let ptr: number;

/*
korg_syro_comp.c
*/
class ReadSample {
    numOfSample: number;
    bitLenEff: number;
    sampleEndian: Endian;
    sum: number;
    padding: number;
    mapBuffer: Uint8Array;
    pBitBase: Array<number>;

    getPcm(): number {
        let dat: number;
        if (this.sampleEndian === Endian.LittleEndian) {
            dat = ptrArray[1];
            dat <<= 8;
            dat |= ptrArray[ptr];
            ptr += 2;
        } else {
            dat = ptrArray[ptr++];
            dat <<= 8;
            dat |= ptrArray[ptr++];
        }

        if (this.bitLenEff < 16) {
            dat /= (1 << (16 - this.bitLenEff));
            this.sum += (dat << 16 - this.bitLenEff);
        } else {
            this.sum += dat;
        }
        return dat;
    }

    makeMapBuffer(pBitBase: Array<number>, nBitBase: number, type: number): void {
        let i: number;
        let mcnt: number;
        let dat: Array<number>;
        let datn: number;
        let bnum: number;

        this.mapBuffer = new Uint8Array(COMP_BLOCK_LEN);

        bnum = 0;
        mcnt = 0;
        this.mapBuffer[mcnt++] = this.bitLenEff;
        this.mapBuffer[mcnt++] = this.bitLenEff;
        this.mapBuffer[mcnt++] = this.bitLenEff;
        if (mcnt >= this.numOfSample) {
            return;
        }

        dat[3] = this.getPcm();
        dat[2] = this.getPcm();
        dat[1] = this.getPcm();
        for (;;) {
            dat[0] = this.getPcm();
            datn = dat[0];
            if (type) {
                datn -= (dat[1 * 2 - dat[2]]);
            }
            if (datn < 0) {
                datn = -datn;
            }

            for (i=0; i < nBitBase; i++) {
                bnum = pBitBase[i];
                if (datn < (1 << (bnum - 1))) {
                    break;
                }
            }
            if (i === nBitBase) {
                bnum = this.bitLenEff;
            }

            this.mapBuffer[mcnt++] = bnum;
            if (mcnt == this.numOfSample) {
                break;
            }
            dat[3] = dat[2];
            dat[2] = dat[1];
            dat[1] = dat[0];
        }
    }

    makeMapBitConv(numOfSample: number, bitLen: number): void {
        let i: number;
        let j: number;
        let dat: number;
        let dat1: number;
        let datLo: number;
        let datHi: number;
        let datUse: number;
        let st: number;
        let pls: number;
        let min: number;

        for (i = 0; i < bitLen; i++) {
            st = -1;
            for (j= 0; j <= numOfSample; j++) {
                dat = (j < numOfSample) ? this.mapBuffer[j] : 0;
                if (dat === i) {
                    if (st === -1) {
                         st =j;
                    }
                } else {
                    if (st !== -1) {
                        dat1 = (st) ? this.mapBuffer[st - 1] : 0;
                        if (dat < dat1) {
                            datLo = dat;
                            datHi = dat1;
                        } else {
                            datLo = dat1;
                            datHi = dat;
                        }
                        if (datHi > i) {
                             datUse = datHi;
                             if (datLo > i) {
                                 datUse = datLo;
                             }

                             pls = (datUse - i) * (j -st);
                             min = 2 + i;
                             if (datUse === bitLen) {
                                 min++;
                             }
                             if (datHi === datLo) {
                                 min += 2 + datLo;
                                 if (datLo === bitLen) {
                                     min++;
                                 }
                             }
                             if (min >= pls) {
                                 for (; st<j; st++) {
                                     this.mapBuffer[st] = datUse;
                                 }
                             }
                        }
                        st = -1;
                    }
                }
            }
        }
    }

    getCompSizeFromMap(type: number): number {
        let i: number;
        let pr: number;
        let bit: number;
        let prBit: number;
        let dat: number;
        let datLim: number;
        let bitLen: number;
        let datH: Array<number>;

        bitLen = this.bitLenEff;
        datLim = -(1 << (bitLen - 1));

        datH[0] = 0;
        datH[1] = 0;
        datH[2] = 0;
        datH[3] = 0;

        prBit = this.mapBuffer[0];
        pr = 16 + 2;        // 16=BitLen(4)*4, 2=1st Header

        for (i = 0; i < this.numOfSample; i++) {
            datH[0] = this.getPcm();
            bit = this.mapBuffer[i];
            if ( bit !== prBit) {
                pr += prBit;
                if (prBit === bitLen) {
                    pr++;
                }
                pr += 2;
                prBit = bit;
            }
            pr += bit;
            if ((prBit < bitLen) && type) {
                dat = datH[0] - (datH[1] * 2 - datH[2]);
            } else {
                dat = datH[0];
            }
            if (bit === bitLen && dat === datLim) {
                pr++;
            }
            datH[3] = datH[2];
            datH[2] = datH[1];
            datH[1] = datH[0];
        }
        pr += prBit;
        if (prBit === bitLen) {
            pr++;
        }

        return pr;
    }

    makeMapSingleType(type: number): number {
        let rp2: ReadSample;
        let len: number;
        let li: number;
        let i: number;
        let j: number;
        let bitBase: Array<number>;
        let bitLen: number;

        bitLen = this.bitLenEff;

        for (i = 0; i < (bitLen - 1); i++) {
            bitBase[i] = i+1;
        }

        this.makeMapBuffer(bitBase, bitLen - 1, type);
        this.makeMapBitConv(this.numOfSample, bitLen);

        let bitBaseScore: Array<number>;
        let maxBit: number;
        let maxSc: number;
        let sc: number;

        for (i = 0; i < 16; i++) {
            bitBaseScore[i] = 0;
        }
        for (li = 0; li < this.numOfSample; li++) {
            sc = this.mapBuffer[li];
            if (sc < 16) {
                bitBaseScore[sc]++;
            }
        }

        for (i = 0; i< 4; i++) {
            maxSc = -1;
            maxBit = -1;
            for (j = 0; j < bitLen; j++) {
                if (bitBaseScore[j] > maxSc) {
                    maxSc = bitBaseScore[j];
                    maxBit = j;
                }
            }
            bitBase[i] = maxBit;
            bitBaseScore[maxBit] = -1;
        }

        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                if (bitBase[j] > bitBase[j + 1]) {
                    sc = bitBase[j];
                    bitBase[j] = bitBase[j + 1];
                    bitBase[j + 1] = sc;
                }
            }
        }

        this.makeMapBuffer(bitBase, 4, type);
        this.makeMapBitConv(this.numOfSample, bitLen);

        len = this.getCompSizeFromMap(type);
        for (i = 0; i < 4; i++) {
            this.pBitBase[i] = bitBase[i];
        }
        return len;
    }

    makeMap(): number {
        let i: number;
        let bestType: number;
        let len: number;
        let bestLen: number;
        let bitBase: Array<number>;

        bestLen = 0;
        bestType = 0;

        for (i = 0; i < 2; i++) {
            len = this.makeMapSingleType(i * 2);

            if ((! bestLen) || (len < bestLen)) {
                bestLen = len;
                bestType = i;
            }
        }

        return bestLen;
    }
}

class WriteBit {
    // pointer?
    bitCount: number;
    byteCount: number;

    writeBit(dat: number, bit: number): void {
        dat <<= (32 - bit);
        dat >>= this.bitCount;

        for (;;) {
            if (this.bitCount) {
                ptrArray[ptr] |= dat >> 24;
            } else {
                ptrArray[ptr] = dat >> 24;
            }
            if (this.bitCount + bit >= 8) {
                bit -= (8 - this.bitCount);
                this.bitCount = 0;
                this.byteCount++;
                ptr++;
                dat <<= 8;
            } else {
                this.bitCount += bit;
                bit = 0;
            }
            if (! bit) {
                 break;
            }
        }
    }
}
