const _ = require('lodash');
const {  FileSystem} =require('ftp-srv');
const nodePath = require('path');
const uuid = require('uuid');
const Promise = require('bluebird');
const promisify = (fn, options) => {
    return function() {
        console.log("Calling function", options.name, ...arguments);
        const args = Array.from(arguments);
        return new Promise((resolve, reject) => {
            fn.call(options.context, ...args, (err, result) => {
                if (err) {
                    console.log("Error for ", options.name, ...arguments,  err);
                    reject(err);
                } else {
                    // console.log("result for ", options.name, ...arguments, result);
                    resolve(result);
                }
            });
        });
    }
}

const methods = [
    'stat',
    'readdir',
    'unlink',
    'rmdir',
    'mkdir',
    'rename'
];


const UNIX_SEP_REGEX = /\//g;
const WIN_SEP_REGEX = /\\/g;

class WebDavFileSystem extends FileSystem{
    constructor(connection, { root } = {}) {
        console.log("NEW INSTANCE !!!");
        super(connection, root);
        this.connection = connection;
        this.currentDir = '/';
        this.fsAsync = methods.reduce((obj, method) => {
            obj[method] = promisify(connection[method], {context: connection, name: method});
            return obj;
        }, {});
    }


    currentDirectory() {
        return this.currentDir;
    }
    _resolvePath(path = '.') {
        path = path === "." ? this.currentDir : path;
        // Unix separators normalize nicer on both unix and win platforms
        const resolvedPath = path.replace(WIN_SEP_REGEX, '/');

        // Join cwd with new path
        const joinedPath = nodePath.isAbsolute(resolvedPath)
            ? nodePath.normalize(resolvedPath)
            : nodePath.join('/', this.currentDir, resolvedPath);

        // Create local filesystem path using the platform separator
        const fsPath = nodePath.resolve(nodePath.join(this.root, joinedPath)
            .replace(UNIX_SEP_REGEX, nodePath.sep)
            .replace(WIN_SEP_REGEX, nodePath.sep));

        // Create FTP client path using unix separator
        const clientPath = joinedPath.replace(WIN_SEP_REGEX, '/');

        return {
            clientPath,
            fsPath
        };
    }

    get(fileName) {
        const {clientPath} = this._resolvePath(fileName);
        return this.fsAsync.stat(clientPath)
            .then((stat) => {
                stat.mtime = this.utcTimestampToLocalTimestamp(stat.mtime);
                return _.set(stat, 'name', fileName)
            });
    }

    list(pathToList) {
        pathToList = pathToList === "." ? this.currentDir : pathToList;
        console.log("Calling list", pathToList);
        const {clientPath} = this._resolvePath(pathToList);
        return this.fsAsync.readdir(clientPath)
            .then((fileNames) => {
                return Promise.map(fileNames, (fileName) => {
                    const filePath = nodePath.join(clientPath, fileName);
                    return this.fsAsync.stat(filePath)
                     .then((stat) => {
                         stat.mtime = this.utcTimestampToLocalTimestamp(stat.mtime);
                         return _.set(stat, 'name', fileName)
                     })
                        .catch(() => null);
                });
            })
            .then(_.compact);
    }
    utcTimestampToLocalTimestamp(timestamp) {
        const offsetMin = new Date(timestamp).getTimezoneOffset();
        const offsetMs = offsetMin * 60 * 1000;
        return new Date(timestamp + offsetMs*(-1)).getTime();
    }

    chdir(path = '.') {
        console.log("Calling chdir", path);
        const {fsPath, clientPath} = this._resolvePath(path);
        return this.fsAsync.stat(clientPath)
            .tap((stat) => {
                if (!stat.isDirectory()) throw new errors.FileSystemError('Not a valid directory');
            })
            .then(() => {
                this.currentDir = clientPath;
                return this.currentDirectory();
            });
    }

    write(fileName, {append = false, start = undefined} = {}) {
        const {fsPath, clientPath} = this._resolvePath(fileName);
        const stream = this.connection.createWriteStream(clientPath, {flags: !append ? 'w+' : 'a+', start});
        stream.once('error', () => this.fsAsync.unlink(clientPath));
        stream.once('close', () => stream.end());
        return {
            stream,
            clientPath
        };
    }

    read(fileName, {start = undefined} = {}) {
        console.log("Calling read", fileName);
        const {fsPath, clientPath} = this._resolvePath(fileName);
        return this.fsAsync.stat(clientPath)
            .tap((stat) => {
                if (stat.isDirectory()) throw new errors.FileSystemError('Cannot read a directory');
            })
            .then(() => {
                const stream = this.connection.createReadStream(clientPath, {flags: 'r', start});
                return {
                    stream,
                    clientPath
                };
            });
    }

    delete(path) {
        const {clientPath} = this._resolvePath(path);
        return this.fsAsync.stat(clientPath)
            .then((stat) => {
                if (stat.isDirectory()) return this.fsAsync.rmdir(clientPath);
                else return this.fsAsync.unlink(clientPath);
            });
    }

    mkdir(path) {
        const {clientPath} = this._resolvePath(path);
        return this.fsAsync.mkdir(clientPath, { recursive: true })
            .then(() => clientPath);
    }

    rename(from, to) {
        const {clientPath: fromPath} = this._resolvePath(from);
        const {clientPath: toPath} = this._resolvePath(to);
        return this.fsAsync.rename(fromPath, toPath);
    }

    chmod(path, mode) {
        const {clientPath} = this._resolvePath(path);
        return this.fsAsync.chmod(clientPath, mode);
    }

    getUniqueName() {
        return uuid.v4().replace(/\W/g, '');
    }
}
module.exports = WebDavFileSystem;
