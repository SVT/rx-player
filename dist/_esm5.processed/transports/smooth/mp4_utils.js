/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { canPatchISOBMFFSegment } from "../../compat";
import { getMDAT, getTRAF, } from "../../parsers/containers/isobmff";
import assert from "../../utils/assert";
import { be2toi, be4toi, be8toi, bytesToHex, bytesToStr, concat, hexToBytes, itobe2, itobe4, itobe8, strToBytes, } from "../../utils/byte_parsing";
/**
 * Sampling frequencies defined in MPEG-4 Audio.
 * @type {Array.<Number>}
 */
var SAMPLING_FREQUENCIES = [
    96000,
    88200,
    64000,
    48000,
    44100,
    32000,
    24000,
    22050,
    16000,
    12000,
    11025,
    8000,
    7350,
];
/**
 * Speed up string to bytes conversion by memorizing the result
 *
 * The keys here are ISOBMFF box names. The values are the corresponding
 * bytes conversion for putting as an ISOBMFF boxes.
 *
 * Used by the boxName method.
 * @type {Object}
 */
var boxNamesMem = {};
/**
 * Convert the string name of an ISOBMFF box into the corresponding bytes.
 * Has a memorization mechanism to speed-up if you want to translate the
 * same string multiple times.
 * @param {string} str
 * @returns {Uint8Array}
 */
function boxName(str) {
    if (boxNamesMem[str]) {
        return boxNamesMem[str];
    }
    var nameInBytes = strToBytes(str);
    boxNamesMem[str] = nameInBytes;
    return nameInBytes;
}
/**
 * Create a new ISOBMFF "box" with the given name.
 * @param {string} name - name of the box you want to create, must always
 * be 4 characters (uuid boxes not supported)
 * @param {Uint8Array} buff - content of the box
 * @returns {Uint8Array} - The entire ISOBMFF box (length+name+content)
 */
function Atom(name, buff) {
    if (false) {
        assert(name.length === 4);
    }
    var len = buff.length + 8;
    return concat(itobe4(len), boxName(name), buff);
}
/**
 * @param {Uint8Array} buf
 * @param {Number} id1
 * @param {Number} id2
 * @param {Number} id3
 * @param {Number} id4
 * @returns {Uint8Array|undefined}
 */
function readUuid(buf, id1, id2, id3, id4) {
    var l = buf.length;
    var i = 0;
    var len;
    while (i < l) {
        len = be4toi(buf, i);
        if (be4toi(buf, i + 4) === 0x75756964 /* === "uuid" */ &&
            be4toi(buf, i + 8) === id1 &&
            be4toi(buf, i + 12) === id2 &&
            be4toi(buf, i + 16) === id3 &&
            be4toi(buf, i + 20) === id4) {
            return buf.subarray(i + 24, i + len);
        }
        i += len;
    }
}
var atoms = {
    /**
     * @param {string} name
     * @param {Array.<Uint8Array>} children
     * @returns {Uint8Array}
     */
    mult: function (name, children) {
        return Atom(name, concat.apply(null, children));
    },
    /**
     * @param {string} name - "avc1" or "encv"
     * @param {Number} drefIdx - shall be 1
     * @param {Number} width
     * @param {Number} height
     * @param {Number} hRes - horizontal resolution, eg 72
     * @param {Number} vRes - horizontal resolution, eg 72
     * @param {string} encDepth
     * @param {Number} colorDepth - eg 24
     * @param {Uint8Array} avcc - Uint8Array representing the avcC atom
     * @param {Uint8Array} [sinf] - Uint8Array representing the sinf atom,
     * only if name == "encv"
     * @returns {Uint8Array}
     */
    avc1encv: function (name, drefIdx, width, height, hRes, vRes, encName, colorDepth, avcc, sinf) {
        if (false) {
            assert(name === "avc1" || name === "encv", "should be avc1 or encv atom");
            assert(name !== "encv" || sinf instanceof Uint8Array);
        }
        return Atom(name, concat(6, // 6 bytes reserved
        itobe2(drefIdx), 16, // drefIdx + QuickTime reserved, zeroes
        itobe2(width), // size 2 w
        itobe2(height), // size 2 h
        itobe2(hRes), 2, // reso 4 h
        itobe2(vRes), 2 + 4, // reso 4 v + QuickTime reserved, zeroes
        [0, 1, encName.length], // frame count (default 1)
        strToBytes(encName), // 1byte len + encoder name str
        (31 - encName.length), // + padding
        itobe2(colorDepth), // color depth
        [0xFF, 0xFF], // reserved ones
        avcc, // avcc atom,
        name === "encv" ? sinf || [] : []));
    },
    /**
     * @param {Uint8Array} sps
     * @param {Uint8Array} pps
     * @param {Number} nalLen - NAL Unit length: 1, 2 or 4 bytes
     * eg: avcc(0x4d, 0x40, 0x0d, 4, 0xe1, "674d400d96560c0efcb80a70505050a0",
     * 1, "68ef3880")
     * @returns {Uint8Array}
     */
    avcc: function (sps, pps, nalLen) {
        var nal = (nalLen === 2) ?
            0x1 : (nalLen === 4) ?
            0x3 : 0x0;
        // Deduce AVC Profile from SPS
        var h264Profile = sps[1];
        var h264CompatibleProfile = sps[2];
        var h264Level = sps[3];
        return Atom("avcC", concat([
            1,
            h264Profile,
            h264CompatibleProfile,
            h264Level,
            (0x3F << 2 | nal),
            (0xE0 | 1),
        ], itobe2(sps.length), sps, [1], itobe2(pps.length), pps));
    },
    /**
     * @param {url} Uint8Array
     * @returns {Uint8Array}
     */
    dref: function (url) {
        // only one description here... FIXME
        return Atom("dref", concat(7, [1], url));
    },
    /**
     * @param {Number} stream
     * @param {string} codecPrivateData - hex string
     * eg: esds(1, 98800, "1190")
     * @returns {Uint8Array}
     */
    esds: function (stream, codecPrivateData) {
        return Atom("esds", concat(4, [0x03, 0x19], itobe2(stream), [0x00, 0x04, 0x11, 0x40, 0x15], 11, [0x05, 0x02], hexToBytes(codecPrivateData), [0x06, 0x01, 0x02]));
    },
    /**
     * @param {string} dataFormat - four letters (eg "avc1")
     * @returns {Uint8Array}
     */
    frma: function (dataFormat) {
        if (false) {
            assert(dataFormat.length === 4, "wrong data format length");
        }
        return Atom("frma", strToBytes(dataFormat));
    },
    /**
     * @param {Number} length
     * @returns {Uint8Array}
     */
    free: function (length) {
        return Atom("free", new Uint8Array(length - 8));
    },
    /**
     * @param {string} majorBrand
     * @param {Array.<string>} brands
     * @returns {Uint8Array}
     */
    ftyp: function (majorBrand, brands) {
        return Atom("ftyp", concat.apply(null, [
            strToBytes(majorBrand),
            [0, 0, 0, 1],
        ].concat(brands.map(strToBytes))));
    },
    /**
     * @param {string} type - "video" or "audio"
     * @returns {Uint8Array}
     */
    hdlr: function (type) {
        var name;
        var handlerName;
        switch (type) {
            case "video":
                name = "vide";
                handlerName = "VideoHandler";
                break;
            case "audio":
                name = "soun";
                handlerName = "SoundHandler";
                break;
            default:
                name = "hint";
                handlerName = "";
                break;
        }
        return Atom("hdlr", concat(8, strToBytes(name), 12, strToBytes(handlerName), 1 // handler name is C-style string (0 terminated)
        ));
    },
    /**
     * @param {number} timescale
     * @returns {Uint8Array}
     */
    mdhd: function (timescale) {
        return Atom("mdhd", concat(12, itobe4(timescale), 8));
    },
    /**
     * @param {Uint8Array} mfhd
     * @param {Uint8Array} traf
     * @returns {Uint8Array}
     */
    moof: function (mfhd, traf) {
        return atoms.mult("moof", [mfhd, traf]);
    },
    /**
     * @param {string} name - "mp4a" or "enca"
     * @param {Number} drefIdx
     * @param {Number} channelsCount
     * @param {Number} sampleSize
     * @param {Number} packetSize
     * @param {Number} sampleRate
     * @param {Uint8Array} esds - Uint8Array representing the esds atom
     * @param {Uint8Array} [sinf] - Uint8Array representing the sinf atom,
     * only if name == "enca"
     * @returns {Uint8Array}
     */
    mp4aenca: function (name, drefIdx, channelsCount, sampleSize, packetSize, sampleRate, esds, sinf) {
        if (false) {
            assert(name !== "enca" || sinf instanceof Uint8Array);
        }
        return Atom(name, concat(6, itobe2(drefIdx), 8, itobe2(channelsCount), itobe2(sampleSize), 2, itobe2(packetSize), itobe2(sampleRate), 2, esds, (name === "enca") ? sinf || [] : []));
    },
    /**
     * @param {Number} timescale
     * @param {Number} trackId
     * @returns {Uint8Array}
     */
    mvhd: function (timescale, trackId) {
        return Atom("mvhd", concat(12, itobe4(timescale), 4, [0, 1], 2, // we assume rate = 1;
        [1, 0], 10, // we assume volume = 100%;
        [0, 1], 14, // default matrix
        [0, 1], 14, // default matrix
        [64, 0, 0, 0], 26, itobe2(trackId + 1) // next trackId (=trackId + 1);
        ));
    },
    /**
     * @param {string} systemId - Hex string representing the CDM, 16 bytes.
     * @param {Uint8Array|undefined} privateData - Data associated to protection
     * specific system.
     * @param {Array.<Uint8Array>} keyIds - List of key ids contained in the PSSH
     * @returns {Uint8Array}
     */
    pssh: function (systemId, privateData, keyIds) {
        if (privateData === void 0) { privateData = new Uint8Array(0); }
        if (keyIds === void 0) { keyIds = new Uint8Array(0); }
        var _systemId = systemId.replace(/-/g, "");
        assert(_systemId.length === 32, "wrong system id length");
        var version;
        var kidList;
        var kidCount = keyIds.length;
        if (kidCount > 0) {
            version = 1;
            kidList = concat.apply(void 0, [itobe4(kidCount)].concat(keyIds));
        }
        else {
            version = 0;
            kidList = [];
        }
        return Atom("pssh", concat([version, 0, 0, 0], hexToBytes(_systemId), kidList, itobe4(privateData.length), privateData));
    },
    /**
     * @param {Uint8Array} mfhd
     * @param {Uint8Array} tfhd
     * @param {Uint8Array} tfdt
     * @param {Uint8Array} trun
     * @returns {Uint8Array}
     */
    saio: function (mfhd, tfhd, tfdt, trun) {
        return Atom("saio", concat(4, [0, 0, 0, 1], // ??
        itobe4(mfhd.length +
            tfhd.length +
            tfdt.length +
            trun.length +
            8 + 8 + 8 + 8)));
    },
    /**
     * @param {Uint8Array} sencData - including 8 bytes flags and entries count
     * @returns {Uint8Array}
     */
    saiz: function (senc) {
        if (senc.length === 0) {
            return Atom("saiz", new Uint8Array(0));
        }
        var flags = be4toi(senc, 0);
        var entries = be4toi(senc, 4);
        var arr = new Uint8Array(entries + 9);
        arr.set(itobe4(entries), 5);
        var i = 9;
        var j = 8;
        var pairsCnt;
        var pairsLen;
        while (j < senc.length) {
            j += 8; // assuming IV is 8 bytes TODO handle 16 bytes IV
            // if we have extradata for each entry
            if ((flags & 0x2) === 0x2) {
                pairsLen = 2;
                pairsCnt = be2toi(senc, j);
                j += (pairsCnt * 6) + 2;
            }
            else {
                pairsCnt = 0;
                pairsLen = 0;
            }
            arr[i] = pairsCnt * 6 + 8 + pairsLen;
            i++;
        }
        return Atom("saiz", arr);
    },
    /**
     * @param {string} schemeType - four letters (eg "cenc" for Common Encryption)
     * @param {Number} schemeVersion - eg 65536
     * @returns {Uint8Array}
     */
    schm: function (schemeType, schemeVersion) {
        if (false) {
            assert(schemeType.length === 4, "wrong scheme type length");
        }
        return Atom("schm", concat(4, strToBytes(schemeType), itobe4(schemeVersion)));
    },
    /**
     * @param {Uint8Array} buf
     * @returns {Uint8Array}
     */
    senc: function (buf) {
        return Atom("senc", buf);
    },
    /**
     * @returns {Uint8Array}
     */
    smhd: function () {
        return Atom("smhd", new Uint8Array(8));
    },
    /**
     * @param {Array.<Uint8Array>} representations - arrays of Uint8Array,
     * typically [avc1] or [encv, avc1]
     * @returns {Uint8Array}
     */
    stsd: function (reps) {
        // only one description here... FIXME
        var arrBase = [7, [reps.length]];
        return Atom("stsd", concat.apply(void 0, arrBase.concat(reps)));
    },
    /**
     * @param {Number} width
     * @param {Number} height
     * @param {Number} trackId
     * @returns {Uint8Array}
     */
    tkhd: function (width, height, trackId) {
        return Atom("tkhd", concat(itobe4(1 + 2 + 4), 8, // we assume track is enabled,
        // in media and in preview.
        itobe4(trackId), 20, // we assume trackId = 1;
        [1, 0, 0, 0], // we assume volume = 100%;
        [0, 1, 0, 0], 12, // default matrix
        [0, 1, 0, 0], 12, // default matrix
        [64, 0, 0, 0], // ??
        itobe2(width), 2, // width (TODO handle fixed)
        itobe2(height), 2 // height (TODO handle fixed)
        ));
    },
    /**
     * @param {Number} trackId
     * @returns {Uint8Array}
     */
    trex: function (trackId) {
        // default sample desc idx = 1
        return Atom("trex", concat(4, itobe4(trackId), [0, 0, 0, 1], 12));
    },
    /**
     * @param {Number} decodeTime
     * @returns {Uint8Array}
     */
    tfdt: function (decodeTime) {
        return Atom("tfdt", concat([1, 0, 0, 0], itobe8(decodeTime)));
    },
    /**
     * @param {Number} algId - eg 1
     * @param {Number} ivSize - eg 8
     * @param {string} keyId - Hex KID 93789920e8d6520098577df8f2dd5546
     * @returns {Uint8Array}
     */
    tenc: function (algId, ivSize, keyId) {
        if (false) {
            assert(keyId.length === 32, "wrong default KID length");
        }
        return Atom("tenc", concat(6, [algId, ivSize], hexToBytes(keyId)));
    },
    /**
     * @param {Uint8Array} tfhd
     * @param {Uint8Array} tfdt
     * @param {Uint8Array} trun
     * @param {Uint8Array} senc
     * @param {Uint8Array} mfhd
     * @returns {Uint8Array}
     */
    traf: function (tfhd, tfdt, trun, mfhd, senc) {
        var trafs = [tfhd, tfdt, trun];
        if (senc) {
            trafs.push(atoms.senc(senc), atoms.saiz(senc), atoms.saio(mfhd, tfhd, tfdt, trun));
        }
        return atoms.mult("traf", trafs);
    },
    /**
     * @param {Uint8Array} oldtrun
     * @returns {Uint8Array}
     */
    trun: function (oldtrun) {
        var headersLast = oldtrun[11];
        var hasDataOffset = headersLast & 0x01;
        if (hasDataOffset) {
            return oldtrun;
        }
        // If no dataoffset is present, we change the headers and add one
        var trun = new Uint8Array(oldtrun.length + 4);
        trun.set(itobe4(oldtrun.length + 4), 0);
        trun.set(oldtrun.subarray(4, 16), 4); // name + (version + headers) +
        // samplecount
        trun[11] = trun[11] | 0x01; // add data offset header info
        trun.set([0, 0, 0, 0], 16); // data offset
        trun.set(oldtrun.subarray(16, oldtrun.length), 20);
        return trun;
    },
    /**
     * @returns {Uint8Array}
     */
    vmhd: function () {
        var arr = new Uint8Array(12);
        arr[3] = 1; // QuickTime...
        return Atom("vmhd", arr);
    },
};
var reads = {
    /**
     * Extract senc data (derived from UUID MS Atom)
     * @param {Uint8Array} traf
     * @returns {Uint8Array|undefined}
     */
    senc: function (traf) {
        return readUuid(traf, 0xA2394F52, 0x5A9B4F14, 0xA2446C42, 0x7C648DF4);
    },
    /**
     * Extract tfxd data (derived from UUID MS Atom)
     * @param {Uint8Array} traf
     * @returns {Uint8Array|undefined}
     */
    tfxd: function (traf) {
        return readUuid(traf, 0x6D1D9B05, 0x42D544E6, 0x80E2141D, 0xAFF757B2);
    },
    /**
     * Extract tfrf data (derived from UUID MS Atom)
     * @param {Uint8Array} traf
     * @returns {Uint8Array|undefined}
     */
    tfrf: function (traf) {
        return readUuid(traf, 0xD4807EF2, 0XCA394695, 0X8E5426CB, 0X9E46A79F);
    },
};
/**
 * Return AAC ES Header (hexstr form)
 *
 * @param {Number} type
 *          1 = AAC Main
 *          2 = AAC LC
 *          cf http://wiki.multimedia.cx/index.php?title=MPEG-4_Audio
 * @param {Number} frequency
 * @param {Number} chans (1 or 2)
 * @returns {string}
 */
function aacesHeader(type, frequency, chans) {
    var freq = SAMPLING_FREQUENCIES.indexOf(frequency);
    if (false) {
        assert(freq >= 0, "non supported frequency"); // TODO : handle Idx = 15...
    }
    var val;
    val = (type & 0x3F) << 0x4;
    val = (val | (freq & 0x1F)) << 0x4;
    val = (val | (chans & 0x1F)) << 0x3;
    return bytesToHex(itobe2(val));
}
/**
 * @param {Uint8Array} mvhd
 * @param {Uint8Array} mvex
 * @param {Uint8Array} trak
 * @param {Object} pssList
 * @returns {Array.<Uint8Array>}
 */
function moovChildren(mvhd, mvex, trak, pssList) {
    var moov = [mvhd, mvex, trak];
    pssList.forEach(function (pss) {
        var pssh = atoms.pssh(pss.systemId, pss.privateData, pss.keyIds);
        moov.push(pssh);
    });
    return moov;
}
/**
 * /!\ Mutates given segment
 * @param {Uint8Array} segment
 * @param {Number} trunoffset
 * @param {Number} dataoffset
 */
function patchTrunDataOffset(segment, trunoffset, dataOffset) {
    // patch trun dataoffset with new moof atom size
    segment.set(itobe4(dataOffset), trunoffset + 16);
}
/**
 * @param {Uint8Array} segment
 * @param {Uint8Array} newmoof
 * @param {Uint8Array} oldmoof
 * @param {Number} trunoffset
 * @returns {Uint8Array}
 */
function createNewSegment(segment, newmoof, oldmoof, trunoffset) {
    var segmentlen = segment.length;
    var newmooflen = newmoof.length;
    var oldmooflen = oldmoof.length;
    var mdat = segment.subarray(oldmooflen, segmentlen);
    var newSegment = new Uint8Array(newmooflen + (segmentlen - oldmooflen));
    newSegment.set(newmoof, 0);
    newSegment.set(mdat, newmooflen);
    patchTrunDataOffset(newSegment, trunoffset, newmoof.length + 8);
    return newSegment;
}
/**
 * /!\ Mutates given segment
 * @param {Uint8Array} segment
 * @param {Uint8Array} newmoof
 * @param {Uint8Array} oldmoof
 * @param {Number} trunoffset
 * @returns {Uint8Array}
 */
function patchSegmentInPlace(segment, newmoof, oldmoof, trunoffset) {
    var free = oldmoof.length - newmoof.length;
    segment.set(newmoof, 0);
    segment.set(atoms.free(free), newmoof.length);
    patchTrunDataOffset(segment, trunoffset, newmoof.length + 8 + free);
    return segment;
}
/**
 * @param {Number} timescale
 * @param {string} type
 * @param {Uint8Array} stsd
 * @param {Uint8Array} mhd
 * @param {Number} width
 * @param {Number} height
 * @param {Array.<Object>} pssList - List of dict, example:
 * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF}
 * @returns {Uint8Array}
 */
function createInitSegment(timescale, type, stsd, mhd, width, height, pssList) {
    var stbl = atoms.mult("stbl", [
        stsd,
        Atom("stts", new Uint8Array(0x08)),
        Atom("stsc", new Uint8Array(0x08)),
        Atom("stsz", new Uint8Array(0x0c)),
        Atom("stco", new Uint8Array(0x08)),
    ]);
    var url = Atom("url ", new Uint8Array([0, 0, 0, 1]));
    var dref = atoms.dref(url);
    var dinf = atoms.mult("dinf", [dref]);
    var minf = atoms.mult("minf", [mhd, dinf, stbl]);
    var hdlr = atoms.hdlr(type);
    var mdhd = atoms.mdhd(timescale); // this one is really important
    var mdia = atoms.mult("mdia", [mdhd, hdlr, minf]);
    var tkhd = atoms.tkhd(width, height, 1);
    var trak = atoms.mult("trak", [tkhd, mdia]);
    var trex = atoms.trex(1);
    var mvex = atoms.mult("mvex", [trex]);
    var mvhd = atoms.mvhd(timescale, 1); // in fact, we don't give a sh** about
    // this value :O
    var moov = atoms.mult("moov", moovChildren(mvhd, mvex, trak, pssList));
    var ftyp = atoms.ftyp("isom", ["isom", "iso2", "iso6", "avc1", "dash"]);
    return concat(ftyp, moov);
}
export default {
    getMdat: getMDAT,
    getTraf: getTRAF,
    /**
     * @param {Uint8Array} traf
     * @returns {Array.<Object>}
     */
    parseTfrf: function (traf) {
        var tfrf = reads.tfrf(traf);
        if (!tfrf) {
            return [];
        }
        var frags = [];
        var version = tfrf[0];
        var fragCount = tfrf[4];
        for (var i = 0; i < fragCount; i++) {
            var duration = void 0;
            var time = void 0;
            if (version === 1) {
                time = be8toi(tfrf, i * 16 + 5);
                duration = be8toi(tfrf, i * 16 + 5 + 8);
            }
            else {
                time = be4toi(tfrf, i * 8 + 5);
                duration = be4toi(tfrf, i * 8 + 5 + 4);
            }
            frags.push({
                time: time,
                duration: duration,
            });
        }
        return frags;
    },
    /**
     * @param {Uint8Array} traf
     * @returns {Object|undefined}
     */
    parseTfxd: function (traf) {
        var tfxd = reads.tfxd(traf);
        if (tfxd) {
            return {
                duration: be8toi(tfxd, 12),
                time: be8toi(tfxd, 4),
            };
        }
    },
    /**
     * Return full video Init segment as Uint8Array
     * @param {Number} timescale - lowest number, this one will be set into mdhd
     * *10000 in mvhd, e.g. 1000
     * @param {Number} width
     * @param {Number} height
     * @param {Number} hRes
     * @param {Number} vRes
     * @param {Number} nalLength (1, 2 or 4)
     * @param {string} codecPrivateData
     * @param {string} keyId - hex string representing the key Id,
     * 32 chars. eg. a800dbed49c12c4cb8e0b25643844b9b
     * @param {Array.<Object>} [pssList] - List of dict, example:
     * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF}
     * @returns {Uint8Array}
     */
    createVideoInitSegment: function (timescale, width, height, hRes, vRes, nalLength, codecPrivateData, keyId, pssList) {
        var _pssList = pssList || [];
        var _a = codecPrivateData.split("00000001"), spsHex = _a[1], ppsHex = _a[2];
        var sps = hexToBytes(spsHex);
        var pps = hexToBytes(ppsHex);
        // TODO NAL length is forced to 4
        var avcc = atoms.avcc(sps, pps, nalLength);
        var stsd;
        if (!_pssList.length || keyId == null) {
            var avc1 = atoms.avc1encv("avc1", // name
            1, // drefIdx
            width, height, hRes, vRes, "AVC Coding", // encName
            24, // color depth
            avcc);
            stsd = atoms.stsd([avc1]);
        }
        else {
            var tenc = atoms.tenc(1, 8, keyId);
            var schi = atoms.mult("schi", [tenc]);
            var schm = atoms.schm("cenc", 65536);
            var frma = atoms.frma("avc1");
            var sinf = atoms.mult("sinf", [frma, schm, schi]);
            var encv = atoms.avc1encv("encv", 1, width, height, hRes, vRes, "AVC Coding", 24, avcc, sinf);
            stsd = atoms.stsd([encv]);
        }
        return createInitSegment(timescale, "video", stsd, atoms.vmhd(), width, height, _pssList);
    },
    /**
     * Return full audio Init segment as Uint8Array
     * @param {Number} timescale
     * @param {Number} channelsCount
     * @param {Number} sampleSize
     * @param {Number} packetSize
     * @param {Number} sampleRate
     * @param {string} codecPrivateData
     * @param {string} keyId - hex string representing the key Id, 32 chars.
     * eg. a800dbed49c12c4cb8e0b25643844b9b
     * @param {Array.<Object>} [pssList] - List of dict, example:
     * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF"}
     * @returns {Uint8Array}
     */
    createAudioInitSegment: function (timescale, channelsCount, sampleSize, packetSize, sampleRate, codecPrivateData, keyId, pssList) {
        var _pssList = pssList || [];
        var _codecPrivateData = codecPrivateData || aacesHeader(2, sampleRate, channelsCount);
        var esds = atoms.esds(1, _codecPrivateData);
        var stsd;
        if (!_pssList.length || keyId == null) {
            var mp4a = atoms.mp4aenca("mp4a", 1, channelsCount, sampleSize, packetSize, sampleRate, esds);
            stsd = atoms.stsd([mp4a]);
        }
        else {
            var tenc = atoms.tenc(1, 8, keyId);
            var schi = atoms.mult("schi", [tenc]);
            var schm = atoms.schm("cenc", 65536);
            var frma = atoms.frma("mp4a");
            var sinf = atoms.mult("sinf", [frma, schm, schi]);
            var enca = atoms.mp4aenca("enca", 1, channelsCount, sampleSize, packetSize, sampleRate, esds, sinf);
            stsd = atoms.stsd([enca]);
        }
        return createInitSegment(timescale, "audio", stsd, atoms.smhd(), 0, 0, _pssList);
    },
    /**
     * Add decodeTime info in a segment (tfdt box)
     * @param {Uint8Array} segment
     * @param {Number} decodeTime
     * @return {Uint8Array}
     */
    patchSegment: function (segment, decodeTime) {
        if (false) {
            // TODO handle segments with styp/free...
            var name_1 = bytesToStr(segment.subarray(4, 8));
            assert(name_1 === "moof");
        }
        var oldmoof = segment.subarray(0, be4toi(segment, 0));
        var newtfdt = atoms.tfdt(decodeTime);
        // reads [moof[mfhd|traf[tfhd|trun|..]]]
        var tfdtlen = newtfdt.length;
        var mfhdlen = be4toi(oldmoof, 8);
        var traflen = be4toi(oldmoof, mfhdlen + 8);
        var tfhdlen = be4toi(oldmoof, mfhdlen + 8 + 8);
        var trunlen = be4toi(oldmoof, mfhdlen + 8 + 8 + tfhdlen);
        var oldmfhd = oldmoof.subarray(8, mfhdlen + 8);
        var oldtraf = oldmoof
            .subarray(mfhdlen + 8 + 8, mfhdlen + 8 + 8 + traflen - 8);
        var oldtfhd = oldtraf.subarray(0, tfhdlen);
        var oldtrun = oldtraf.subarray(tfhdlen, tfhdlen + trunlen);
        // force trackId=1 since trackIds are not always reliable...
        oldtfhd.set([0, 0, 0, 1], 12);
        // TODO fallback?
        var oldsenc = reads.senc(oldtraf);
        // writes [moof[mfhd|traf[tfhd|tfdt|trun|senc|saiz|saio]]]
        var newtrun = atoms.trun(oldtrun);
        var newtraf = atoms.traf(oldtfhd, newtfdt, newtrun, oldmfhd, oldsenc);
        var newmoof = atoms.moof(oldmfhd, newtraf);
        var trunoffset = mfhdlen + 8 + 8 + tfhdlen + tfdtlen;
        if (!canPatchISOBMFFSegment()) {
            return createNewSegment(segment, newmoof, oldmoof, trunoffset);
        }
        else {
            if (oldmoof.length - newmoof.length >= 8 /* minimum "free" atom size */) {
                return patchSegmentInPlace(segment, newmoof, oldmoof, trunoffset);
            }
            else {
                return createNewSegment(segment, newmoof, oldmoof, trunoffset);
            }
        }
    },
};
