import * as tar from 'tar'
import * as crypto from 'crypto'
import * as fs from 'fs'

export function extractTarball(destFolder, tarball) {
    return tar.x({
        cwd: destFolder,
        file: tarball
    })
}

export function createTarBall(destFolder, destFile, filter) {
    return tar
        .c({
            file: destFile,
            cwd: destFolder,
            gzip: true,
            filter
        }, ['.'])
        .then(() => destFile)
}

export function getFileHash(file) {
    const hash = crypto.createHash('sha256')
    const f = fs.readFileSync(file)
    hash.update(f)
    return hash.digest('hex')
}
