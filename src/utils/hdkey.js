import HDKey from 'hdkey'
import assert from 'assert'

const PUBLIC_KEY_ONLY_WALLET = 'This is a public key only wallet'

export default class rnHDKey {
    constructor(hdkey) {
        this._hdkey = hdkey
    }

    static fromMasterSeed(seed) {
        return new rnHDKey(HDKey.fromMasterSeed(seed))
    }

    static fromExtendedKey(base58key) {
        return new rnHDKey(HDKey.fromExtendedKey(base58key))
    }


    privateExtendedKey() {
        assert(this._hdkey.privateExtendedKey, PUBLIC_KEY_ONLY_WALLET)
        return this._hdkey.privateExtendedKey
    }

    publicExtendedKey() {
        return this._hdkey.publicExtendedKey
    }

    derivePath(path) {
        return new rnHDKey(this._hdkey.derive(path))
    }

    deriveChild(index) {
        return new rnHDKey(this._hdkey.deriveChild(index))
    }

}