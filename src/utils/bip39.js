import { randomBytes } from 'react-native-randombytes'
import { createHash, pbkdf2Sync } from 'react-native-crypto'
import unorm from 'unorm'
import assert from 'assert'

import CHINESE_SIMPLIFIED_WORDLIST from '../wordlists/chinese_simplified.json'
import CHINESE_TRADITIONAL_WORDLIST from '../wordlists/chinese_traditional.json'
import ENGLISH_WORDLIST from '../wordlists/english.json'
import FRENCH_WORDLIST from '../wordlists/french.json'
import ITALIAN_WORDLIST from '../wordlists/italian.json'
import JAPANESE_WORDLIST from '../wordlists/japanese.json'
import KOREAN_WORDLIST from '../wordlists/korean.json'
import SPANISH_WORDLIST from '../wordlists/spanish.json'

const DEFAULT_WORDLIST = ENGLISH_WORDLIST
const INVALID_MNEMONIC = 'Invalid mnemonic'
const INVALID_ENTROPY = 'Invalid entropy'
const INVALID_CHECKSUM = 'Invalid mnemonic checksum'

export default class rnBip39 {
    static generateMnemonic(strength, rng, wordlist) {
        return new Promise((resolve, reject) => {
            strength = strength || 128
            assert(strength % 32 === 0, INVALID_ENTROPY)
            rng = rng || randomBytes
            rng(strength / 8, (error, randomBytesBuffer) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(this.entropyToMnemonic(randomBytesBuffer.toString('hex'), wordlist))
                }
            })
        })
    }

    static entropyToMnemonic(entropy, wordlist) {
        if (!Buffer.isBuffer(entropy)) {
            entropy = Buffer.from(entropy, 'hex')
        }
        wordlist = wordlist || DEFAULT_WORDLIST
        assert(entropy.length >= 16 && entropy.length <= 32, INVALID_ENTROPY)
        assert(entropy.length % 4 === 0, INVALID_ENTROPY)
        var entropyBits = this.bytesToBinary([].slice.call(entropy))
        var checksumBits = this.deriveChecksumBits(entropy)

        var bits = entropyBits + checksumBits
        var chunks = bits.match(/(.{1,11})/g)
        var words = chunks.map((binary) => {
            var index = this.binaryToByte(binary)
            return wordlist[index]
        })

        return wordlist === JAPANESE_WORDLIST ? words.join('\u3000') : words.join(' ')
    }

    static mnemonicToSeedHex(mnemonic, password) {
        return this.mnemonicToSeed(mnemonic, password).toString('hex')
    }

    static mnemonicToSeed(mnemonic, password) {
        var mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8')
        var saltBuffer = Buffer.from(this.salt(unorm.nfkd(password)), 'utf8')

        return pbkdf2Sync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
    }

    static mnemonicToEntropy(mnemonic, wordlist) {
        wordlist = wordlist || DEFAULT_WORDLIST
        var words = unorm.nfkd(mnemonic).split(' ')
        assert(words.length % 3 === 0, INVALID_MNEMONIC)
        var bits = words.map((word) => {
            var index = wordlist.indexOf(word)
            assert(index !== -1, INVALID_MNEMONIC)
            return this.lpad(index.toString(2), '0', 11)
        }).join('')

        var dividerIndex = Math.floor(bits.length / 33) * 32
        var entropyBits = bits.slice(0, dividerIndex)
        var checksumBits = bits.slice(dividerIndex)

        var entropyBytes = entropyBits.match(/(.{1,8})/g).map(this.binaryToByte)
        assert(entropyBytes.length >= 16, INVALID_ENTROPY)
        assert(entropyBytes.length <= 32, INVALID_ENTROPY)
        assert(entropyBytes.length % 4 === 0, INVALID_ENTROPY)

        var entropy = Buffer.from(entropyBytes)
        var newChecksum = this.deriveChecksumBits(entropy)
        assert(newChecksum === checksumBits, INVALID_CHECKSUM)

        return entropy.toString('hex')
    }

    static validateMnemonic(mnemonic, wordlist) {
        try {
            this.mnemonicToEntropy(mnemonic, wordlist)
        } catch (e) {
            console.error(e)
            return false
        }
        return true
    }

    static deriveChecksumBits(entropyBuffer) {
        var ENT = entropyBuffer.length * 8
        var CS = ENT / 32
        var hash = createHash('sha256').update(entropyBuffer).digest()
        return this.bytesToBinary([].slice.call(hash)).slice(0, CS)
    }

    static salt(password) {
        return 'mnemonic' + (password || '')
    }


    static lpad(str, padString, length) {
        while (str.length < length) str = padString + str
        return str
    }

    static bytesToBinary(bytes) {
        return bytes.map((x) => {
            return this.lpad(x.toString(2), '0', 8)
        }).join('')
    }

    static binaryToByte(bin) {
        return parseInt(bin, 2)
    }

    static wordlists = {
        chinese_simplified: CHINESE_SIMPLIFIED_WORDLIST,
        chinese_traditional: CHINESE_TRADITIONAL_WORDLIST,
        english: ENGLISH_WORDLIST,
        french: FRENCH_WORDLIST,
        italian: ITALIAN_WORDLIST,
        japanese: JAPANESE_WORDLIST,
        korean: KOREAN_WORDLIST,
    }

}