import '../shim'
import assert from 'assert'
import rnBip39 from './utils/bip39'
import rnHDkey from './utils/hdkey'
import walletUtils from './utils/walletUtils'

export default class HDWallet {

    constructor(priv, pub, hdkey) {
        if (priv && pub) {
            throw new Error('Cannot supply both a private and a public key to the constructor')
        }
        if (priv && !walletUtils.isValidPrivate(priv)) {
            throw new Error('Private key does not satisfy the curve requirements (ie. it is invalid)')
        }
        if (pub && !walletUtils.isValidPublic(pub)) {
            throw new Error('Invalid public key')
        }
        if (!hdkey) {
            throw new Error('HDWallet hdkey is must')
        }
        this._privKey = priv
        this._pubKey = pub
        this._hdkey = hdkey
    }

    get privKey() {
        assert(this._privKey, 'This is a public key only wallet')
        return this._privKey
    }

    get pubKey() {
        if (!this._pubKey) {
            this._pubKey = walletUtils.privateToPublic(this.privKey)
        }
        return this._pubKey
    }

    get hdkey() {
        return this._hdkey
    }

    set hdkey(newHDkey) {
        this._hdkey = newHDkey
        this._privKey = newHDkey._hdkey._privateKey
        this._pubKey = newHDkey._hdkey._publicKey
    }

    static fromMasterSeed(seed) {
        var hdkey = rnHDkey.fromMasterSeed(seed)
        if (hdkey._hdkey._privateKey) {
            return new HDWallet(hdkey._hdkey._privateKey, null, hdkey)
        } else {
            var pub = walletUtils.importPublic(hdkey._hdkey._publicKey)
            return new HDWallet(null, pub, hdkey)
        }
    }

    setDerivePath(path) {
        this.hdkey = this.hdkey.derivePath(path)
    }

    setDeriveChild(index) {
        this.hdkey = this.hdkey.deriveChild(index)
    }

    getPrivateKey() {
        return this.privKey
    }

    getPrivateKeyString() {
        return walletUtils.bufferToHex(this.getPrivateKey())
    }

    getPublicKey() {
        return this.pubKey
    }

    getPublicKeyString() {
        return walletUtils.bufferToHex(this.getPublicKey())
    }

    getAddress() {
        return walletUtils.publicToAddress(this.pubKey,true)
    }

    getAddressString() {
        return walletUtils.bufferToHex(this.getAddress())
    }

    getChecksumAddressString() {
        return walletUtils.toChecksumAddress(this.getAddressString())
    }

    
}