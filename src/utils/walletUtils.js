import secp256k1 from 'secp256k1'
import stripHexPrefix from 'strip-hex-prefix'
import BN from 'bn.js'
import createKeccakHash from 'keccak'
import assert from 'assert'
import rnBip39 from './bip39'

export default class walletUtils {

    static isValidPrivate(privateKey) {
        return secp256k1.privateKeyVerify(privateKey)
    }

    static isValidPublic(publickey, sanitize) {
        if (publickey.length === 64) {
            return secp256k1.publicKeyVerify(Buffer.concat([Buffer.from([4]), publickey]))
        }
        if (!sanitize) {
            return false
        }
        return secp256k1.publicKeyVerify(publickey)
    }

    static generateMnemonic = async (strength, rng, wordlist) => {
        try {
            return await rnBip39.generateMnemonic(strength, rng, wordlist)
        } catch (e) {
            return false
        }
    }

    static mnemonicToSeed(mnemonic, password) {
        return rnBip39.mnemonicToSeed(mnemonic, password)
    }

    static mnemonicToSeedHex(mnemonic, password) {
        return rnBip39.mnemonicToSeedHex(mnemonic, password)
    }

    static validateMnemonic(mnemonic, wordlist) {
        return rnBip39.validateMnemonic(mnemonic, wordlist)
    }

    static privateToPublic(privateKey) {
        privateKey = this.toBuffer(privateKey)
        return secp256k1.publicKeyCreate(privateKey, false).slice(1)
    }

    static publicToAddress(pubKey, sanitize) {
        pubKey = this.toBuffer(pubKey)
        if (sanitize && (pubKey.length !== 64)) {
            pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1)
        }
        assert(pubKey.length === 64)
        return this.keccak(pubKey).slice(-20)
    }

    static importPublic(publickey) {
        publickey = this.toBuffer(publickey)
        if (publickey.length !== 64) {
            publickey = secp256k1.publicKeyConvert(publickey, false).slice(1)
        }
        return publickey
    }

    static toChecksumAddress(address) {
        address = stripHexPrefix(address).toLowerCase()
        const hash = this.keccak(address).toString('hex')
        let ret = '0x'
        for (let i = 0; i < address.length; i++) {
            if (parseInt(hash[i], 16) >= 8) {
                ret += address[i].toUpperCase()
            } else {
                ret += address[i]
            }
        }
        return ret
    }

    static toBuffer(v) {
        if (!Buffer.isBuffer(v)) {
            if (Array.isArray(v)) {
                v = Buffer.from(v)
            } else if (typeof v === 'string') {
                if (this.isHexString(v)) {
                    v = Buffer.from(this.padToEven(stripHexPrefix(v)), 'hex')
                } else {
                    v = Buffer.from(v)
                }
            } else if (typeof v === 'number') {
                v = this.inToBuffer(v)
            } else if (v === null || v === undefined) {
                v = Buffer.allocUnsafe(0)
            } else if (BN.isBN(v)) {
                v = v.toArrayLike(Buffer)
            } else if (v.toArray) {
                v = Buffer.from(v.toArray())
            } else {
                throw new Error('invalid type')
            }
        }
        return v
    }

    static isHexString(value, lenth) {
        if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false
        }
        if (lenth && value.length !== 2 + 2 * length) {
            return false
        }
        return true
    }

    static padToEven(value) {
        var e = value
        if (typeof e !== 'string') {
            throw new Error('walletUtils while padding to even, value must be string, is currently' + typeof a + ',while padToEven')
        }
        if (e.length % 2) {
            e = '0' + e
        }
        return e
    }

    static intToHex(i) {
        var hex = i.toString(16)
        return '0x' + this.padToEven(hex)
    }

    static inToBuffer(i) {
        var hex = this.intToHex(i)
        return new Buffer(hex.slice(2), 'hex')
    }

    static bufferToHex(buf) {
        buf = this.toBuffer(buf)
        return '0x' + buf.toString('hex')
    }

    static keccak(a, bits) {
        a = this.toBuffer(a)
        if (!bits) {
            bits = 256
        }
        return createKeccakHash('keccak' + bits).update(a).digest()
    }


    static wordlists = rnBip39.wordlists

} 