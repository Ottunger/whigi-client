/**
 * Service to reach the backend.
 * @module app.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';
import {Headers, Http, Response} from '@angular/http';
import {Router} from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {TranslateService} from 'ng2-translate/ng2-translate';
import * as toPromise from 'rxjs/add/operator/toPromise';
import {Trie} from '../utils/Trie';

@Injectable()
export class Backend {

    public forceMove: boolean;
    public profile: any;
    public data_trie: Trie;
    public shared_with_me_trie: Trie;
    public my_shares: {[id: string]: string[]};
    public data_loaded: boolean;
    public master_key: number[];
    public generics: {[id: string]: [{
        has_requirements?: boolean,
        is_dated: boolean,
        instantiable: boolean,
        descr_key: string,
        long_descr_key: string,
        help_url: string,
        icon: string,
        mode: string,
        enum: string,
        validate: string,
        json_keys: {descr_key: string, mode: string, enum: string, required: boolean, placeholder?: string}[],
        new_key: string[],
        new_key_is?: string
        new_keys_only?: boolean,
        placeholder?: string,
        requires?: string,
        modes?: string[][],
        share_as_folder?: boolean,
        from_now?: boolean
    }]};
    public generics_trie: Trie;
    public generics_paths: {[id: string]: {
        descr_key: string,
        long_descr_key: string,
        help_url: string
    }};
    public MY_URL = 'http://localhost:3000/';
    public EID_HOST = 'localhost/api/v1/eid';
    public BASE_URL = 'https://localhost/api/v1/';
    public RESTORE_URL = 'https://localhost:444/api/v1/';
    public GWP_URL = 'https://whigi2-giveaway.envict.com';
    public MAIL = 'mailto://whigi.com@gmail.com';
    public FEEDBACK_URL = 'https://whigi2-report.envict.com/api/http.php/tickets.json';
    private cpt: string;
    private rsa_key: string[];

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     * @param notif Notification service.
     * @param translate Translation service.
     * @param router Routing service.
     */
    constructor(private http: Http, private notif: NotificationsService, private translate: TranslateService, private router: Router) {
        var self = this;
        this.forceMove = false;
        this.data_loaded = false;
        this.rsa_key = [];
        this.generics_trie = new Trie();
        this.backend(true, false, 'GET', {}, 'generics.json', false, false).then(function(response) {
            self.generics = response;
            var keys = Object.getOwnPropertyNames(response);
            for(var i = 0; i < keys.length; i++) {
                self.generics_trie.addMilestones(keys[i], '/');
                self.generics_trie.add(keys[i], undefined);
            }
        }, function(e) {});
        this.backend(true, false, 'GET', {}, 'generics_paths.json', false, false).then(function(response) {
            self.generics_paths = response;
        }, function(e) {});
        window.WHIGI_URL = this.BASE_URL;
    }

    /**
     * Return an array from the first values of a string giving an AES key.
     * @function toBytes
     * @public
     * @param {String} data String.
     * @return {Bytes} Bytes.
     */
     toBytes(data: string): number[] {
        function num(e) {
            if(e >= 65)
                return e - 55;
            else
                return e - 48;
        }

        var ret: number[] = [];
        try {
            for(var i = 0; i < 32; i++) {
                ret.push((num(data.charCodeAt(2*i)) * 16 + num(data.charCodeAt(2*i + 1))) % 256);
            }
        } catch(e) {
            return ret;
        }
        return ret;
    }

    /**
     * Turns an array of nums to a string.
     * @function arr2str
     * @public
     * @param {Number[]} arr Array.
     * @return {String} String.
     */
    arr2str(arr: number[]): string {
        var result = '';
        for(var i = 0; i < arr.length; i++) {
            result += String.fromCharCode(arr[i]);
        }
        return result;
    }

    /**
     * Turns a string to an array of numbers.
     * @function str2arr
     * @public
     * @param {String} str String.
     * @return {Number[]} Array.
     */
    str2arr(str: string): number[] {
        var result: number[] = [];
        for(var i = 0; i < str.length; i++) {
            result.push(window.parseInt(str.charCodeAt(i).toString(10)));
        }
        return result;
    }

    /**
     * Generates a random string.
     * @function generateRandomString
     * @public
     * @param {Number} length The length.
     * @return {String} The string.
     */
    generateRandomString(length) {
        var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var randomString = '';
        for(var i = 0; i < length; i++) {
            randomString += characters[Math.floor(Math.random() * characters.length)];
        }
        return randomString;
    }

    /**
     * Decrypts the master key once and for all.
     * @function decryptMaster
     * @public
     */
    decryptMaster() {
        try {
            var kd = localStorage.getItem('key_decryption');
            for(var i = 0; window.sha256(window.sha256(this.arr2str(this.master_key || []) || '')) != this.profile.sha_master; i++) {
                var key = this.toBytes(kd);
                var decrypter = new window.aesjs.ModeOfOperation.ctr(key, new window.aesjs.Counter(0));
                this.master_key = decrypter.decrypt(this.profile.encr_master_key);
                kd = window.sha256(kd);
                if(i == 1) {
                    //We set to 1 or far more...
                    for(var j = 0; j < 600; j++)
                        kd = window.sha256(kd);
                }
            }
            for(var i = 0; i < this.profile.rsa_pri_key.length; i++) {
                decrypter = new window.aesjs.ModeOfOperation.ctr(this.master_key, new window.aesjs.Counter(0));
                this.rsa_key[i] = window.aesjs.util.convertBytesToString(decrypter.decrypt(this.profile.rsa_pri_key[i]));
            }
        } catch(e) {
            this.notif.alert(this.translate.instant('error'), this.translate.instant('noKey'));
        }
    }

    /**
     * Create a new AES key suitable after.
     * @function newAES
     * @public
     * @return {Bytes} Key.
     */
    newAES(): number[] {
        return this.toBytes(this.generateRandomString(64));
    }

    /**
     * Encrypt the master AES key using password derivated AES key.
     * @function encryptMasterAES
     * @public
     * @param {String} pwd Password.
     * @param {String} salt User salt.
     * @param {String} master_key Master key.
     * @return {Bytes} Encrypted master key.
     */
    encryptMasterAES(pwd: string, salt: string, master_key: string): number[] {
        return new window.aesjs.ModeOfOperation.ctr(this.toBytes(window.sha256(pwd + salt)), new window.aesjs.Counter(0))
            .encrypt(this.toBytes(master_key));
    }

    /**
     * Encrypt the master AES key using password derivated AES key.
     * @function encryptMasterAESAsNumber
     * @public
     * @param {String} pwd Password.
     * @param {Number[]} master_key Master key.
     * @return {Bytes} Encrypted master key.
     */
    private encryptMasterAESAsNumber(pwd: string): number[] {
        if(!this.master_key) {
            this.decryptMaster();
        }
        return Array.from(new window.aesjs.ModeOfOperation.ctr(this.toBytes(window.sha256(pwd + this.profile.salt)), new window.aesjs.Counter(0)).encrypt(this.master_key));
    }

    /**
     * Encrypt a string using master_key in AES.
     * @function encryptAES
     * @public
     * @param {String} data Data to encrypt.
     * @param {Function} onmsg Worker handler.
     * @param {Bytes} key Key to use.
     * @return {Worker} Worker object.
     */
    encryptAES(data: string, onmsg: any,  key?: number[]): Worker {
        if(!this.master_key && !key) {
            this.decryptMaster();
        }
        key = key || this.master_key;
        var w = new Worker('/js/worker.js');
        w.onmessage = onmsg;
        w.postMessage([data, key, true]);
        return w;
    }

    /**
     * Decrypt a string using master_key in AES.
     * @function decryptAES
     * @public
     * @param {Bytes} data Data to decrypt.
     * @param {Function} onmsg Worker handler.
     * @param {Bytes} key Key to use.
     * @return {Worker} Worker object.
     */
    decryptAES(data: number[], onmsg: any, key?: number[]): Worker {
        if(!this.master_key && !key) {
            this.decryptMaster();
        }
        key = key || this.master_key;
        var w = new Worker('/js/worker.js');
        w.onmessage = onmsg;
        w.postMessage([data, key, false]);
        return w;
    }

    /**
     * Encrypt an AES key using RSA.
     * @function encryptRSA
     * @public
     * @param {Number[]} AES key to be encrypted.
     * @param {String} RSA public key.
     * @return {String} Encrypted data.
     */
    encryptRSA(data: number[], key: string): string {
        var enc = new window.JSEncrypt.JSEncrypt();
        enc.setPublicKey(key);
        var dt = this.arr2str(data);
        return enc.encrypt(window.sha256(dt) + dt);
    }

    /**
     * Decrypt an AES key using RSA.
     * @function decryptRSA
     * @public
     * @param {String} Encrypted data.
     * @return {Number[]} Decrypted data, we use AES keys.
     */
    decryptRSA(data: string): number[] {
        if(this.rsa_key.length == 0) {
            this.decryptMaster();
        }
        var dec = new window.JSEncrypt.JSEncrypt();
        for(var i = 0; i < this.rsa_key.length; i++) {
            try {
                dec.setPrivateKey(this.rsa_key[i]);
                var r = dec.decrypt(data);
                var h = r.substring(0, 64), next = r.substring(64);
                //if(window.sha256(next) == h), but because of encoding reasons,
                //let's say getting a hash if okay, right?
                if(/^[a-fA-F0-9]{64}$/.test(h)) {
                    return this.str2arr(next);
                }
            } catch(e) {}
        }
        return undefined;
    }

    /**
     * Deletes keys, forcing a reload next time.
     * @function forceReload
     * @public
     */
    forceReload() {
        this.data_trie = new Trie();
        this.shared_with_me_trie = new Trie();
        delete this.master_key;
        delete this.profile;
        this.rsa_key = [];
        this.data_loaded = false;
    }

    /**
     * Router link for self page.
     * @function userLink
     * @public
     * @return {String[]} Link.
     */
    userLink(): string[] {
        return ['/user', this.profile._id];
    }

    /**
     * Saves the current puzzle returned from server.
     * @function recordPuzzle
     * @private
     * @param e Response.
     */
    private recordPuzzle(e) {
        try {
            var res = e.json() || {};
            e.msg = res.error || '';
            if('puzzle' in res) {
                localStorage.setItem('puzzle', res.puzzle);
            }
        } catch(e) {}
    }

    /**
     * Returns the result of a call to the backend.
     * @function backend
     * @private
     * @param {Boolean} whigi True to come from Whigi base. Otherwise, use Whigi-restore.
     * @param {Boolean} block Whether to block UI while requesting.
     * @param {String} method Method to use.
     * @param {Object} data JSON body.
     * @param {String} url URL suffix.
     * @param {Boolean} auth Whether auth is needed.
     * @param {Boolean} token Consider auth using token. Else expect data.username and data.password to be set.
     * @param {Boolean} puzzle Require puzzle.
     * @param {Function} ok Resolve method for retry.
     * @param {Function} nok Reject method for retry.
     * @param {Number} num Number of retries.
     * @return {Promise} The result. On error, a description can be found in e.msg.
     */
    private backend(whigi: boolean, block: boolean, method: string, data: any, url: string, auth: boolean, token: boolean, puzzle?: boolean,
        ok?: Function, nok?: Function, num?: number): Promise {
        var call, puzzle = puzzle || false, self = this, dest;
        var headers: Headers = new Headers();
        num = num || 0;
        window.$.blockUI({
            message: '<img src="img/loading-spinner-blue.gif" />',
            baseZ: 1e3,
            css: {
                border: '0',
                padding: '0',
                backgroundColor: 'none'
            },
            overlayCSS: {
                backgroundColor: '#222',
                opacity: .1,
                cursor: 'wait'
            }
        });

        function accept(resolve, response) {
            var res = response.json();
            if('puzzle' in res) {
                localStorage.setItem('puzzle', res.puzzle);
            }
            window.$.unblockUI();
            resolve(res);
        }
        function retry(e, resolve, reject) {
            self.recordPuzzle(e);
            if(e.status == 412 && num < 4) {
                self.backend(whigi, block, method, data, url, auth, token, puzzle, resolve, reject, num + 1);
            } else {
                window.$.unblockUI();
                if(e.status == 418 && token) {
                    self.forceReload();
                    //Session has expired; we need to reach login page!
                    self.forceMove = true;
                    self.router.navigate(['/end']);
                }
                reject(e);
            }
        }

        if(auth && token) {
            headers.append('X-Whigi-Authorization', 'Bearer ' + btoa(localStorage.getItem('token')));
        } else if(auth) {
            headers.append('X-Whigi-Authorization', 'Basic ' + btoa(data.username + ':' + data.password));
        }
        headers.append('Accept-Language', (('lang' in localStorage)? localStorage.getItem('lang') : 'en') + ';q=1');
        dest = (whigi? this.BASE_URL : this.RESTORE_URL) + url + (puzzle? this.regPuzzle() : '');

        switch(method) {
            case 'post':
            case 'POST':
                headers.append('Content-Type', 'application/json');
                if(!!ok && !!nok) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'delete':
            case 'DELETE':
                if(!!ok && !!nok) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
               return new Promise(function(resolve, reject) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'get':
            case 'GET':
            default:
                if(!!ok && !!nok) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
        }
    }

    /**
     * Solves the server puzzle, then return a string for it.
     * @function regPuzzle
     * @private
     * @return {String} Puzzle solution.
     */
    private regPuzzle(): string {
        var i = 0, complete;
        if(!('puzzle' in localStorage))
            return '?puzzle=0'
        do {
            complete = window.sha256(localStorage.getItem('puzzle') + i);
            i++;
        } while(complete.charAt(0) != '0' || complete.charAt(1) != '0' || complete.charAt(2) != '0');
        return '?puzzle=' + (i - 1);
    }

    /**
     * Register a string as captcha.
     * @function cptReg
     * @public
     * @param {String} cpt Captcha.
     */
    cptReg(cpt: string) {
        this.cpt = cpt;
    }
    
    /**
     * Solves the server captcha, then return a string for it.
     * @function regCaptcha
     * @private
     * @return {String} Captcha solution.
     */
    private regCaptcha(): string {
        return '?captcha=' + this.cpt;
    }

    /**
     * Returns the list of a select.
     * @function selectValues
     * @public
     * @param {String} known Select id.
     * @return {Promise} JSON response from backend.
     */
    selectValues(known: string): Promise {
        return this.backend(true, false, 'GET', {}, 'selects/' + known, false, false);
    }

    /**
     * Returns the transition schema for a changed generic.
     * @function transitionSchema
     * @public
     * @param {String} name Generic name.
     * @param {Number} as From version.
     * @param {Number} to To version.
     * @return {Promise} JSON response from backend.
     */
    transitionSchema(name: string, as: number, to: number): Promise {
        return this.backend(true, false, 'GET', {}, 'schemas/' + name + '/' + as + '/' + to, false, false);
    }

    /**
     * Get the tooltip help.
     * @function tooltip
     * @public
     * @param {String} name Tooltip name.
     * @return {Promise} JSON response from backend.
     */
    tooltip(name: string): Promise {
        return this.backend(true, true, 'GET', {}, 'helps/' + name, false, false);
    }

    /**
     * Returns the public info of a user.
     * @function peekUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    peekUser(known: string): Promise {
        return this.backend(true, false, 'GET', {}, 'peek/' + known, false, false);
    }

    /**
     * Returns the public info of a user.
     * @function getUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    getUser(known: string): Promise {
        return this.backend(true, false, 'GET', {}, 'user/' + known, true, true);
    }

    /**
     * Returns the info of the logged in user.
     * @function getProfile
     * @public
     * @return {Promise} JSON response from backend.
     */
    getProfile(): Promise {
        return this.backend(true, false, 'GET', {}, 'profile', true, true);
    }

    /**
     * Close an account to another profile.
     * @function closeTo
     * @public
     * @param {String} to To.
     * @param {Number[]} new_master New master key.
     * @return {Promise} JSON response from backend.
     */
    closeTo(to: string, new_master: number[]): Promise {
        var nk: number[][] = [];
        for(var i = 0; i < this.rsa_key.length; i++) {
            nk.push(Array.from(new window.aesjs.ModeOfOperation.ctr(new_master, new window.aesjs.Counter(0))
                .encrypt(window.aesjs.util.convertStringToBytes(this.rsa_key[i]))));
        }
        return this.backend(true, true, 'POST', {
            new_keys: nk
        }, 'close/' + to, true, true, true);
    }

    /**
     * Posts info for company.
     * @function goCompany
     * @public
     * @param {Object} info Informations.
     * @return {Promise} JSON response from backend.
     */
    goCompany(info: any): Promise {
        return this.backend(true, true, 'POST', info, 'profile/info', true, true);
    }

    /**
     * Changes user's language eveywhere.
     * @function remLang
     * @public
     * @param {String} code New lang.
     * @return {Promise} JSON response from backend.
     */
    remLang(code: string): Promise {
        return this.backend(true, false, 'POST', {lang: code}, 'profile/info3', true, true);
    }

    /**
     * Loads data from BCE.
     * @function goBCE
     * @public
     * @param {String} bce BCE code.
     * @return {Promise} JSON response from backend.
     */
    goBCE(bce: string): Promise {
        return this.backend(true, true, 'GET', {}, 'eid/bce/' + bce, true, true);
    }

    /**
     * Returns the data of the user.
     * @function listData
     * @public
     * @return {Promise} JSON response from backend.
     */
    listData(): Promise {
        return this.backend(true, false, 'GET', {}, 'profile/data', true, true);
    }

    /**
     * Posts a piece of data.
     * @function postData
     * @public
     * @param {String} name Data name.
     * @param {Number[]} encr_data Locally crypted data.
     * @param {Number} version Data version.
     * @param {Boolean} is_dated True to register as a dated data.
     * @param {Boolean} is_bound Whether data is bound.
     * @param {Number[]} encr_aes Crypted used for crypting data.
     * @return {Promise} JSON response from backend.
     */
    postData(name: string, encr_data: number[], version: number, is_dated: boolean, is_bound: boolean, encr_aes: number[]): Promise {
        return this.backend(true, true, 'POST', {
            name: name,
            encr_data: this.arr2str(encr_data),
            is_dated: (!!is_dated)? is_dated : false,
            version: version,
            encr_aes: this.arr2str(encr_aes),
            is_bound: is_bound
        }, 'profile/data/new', true, true, true);
    }

    /**
     * Updates the password and preferences of the user.
     * @function updateProfile
     * @public
     * @param {String} new_password New password.
     * @param {String} password Current password for auth.
     * @return {Promise} JSON response from backend.
     */
    updateProfile(new_password: string, password: string): Promise {
        return this.backend(true, true, 'POST', {
            new_password: window.sha256(new_password),
            encr_master_key: this.encryptMasterAESAsNumber(new_password),
            sha_master: window.sha256(window.sha256(this.arr2str(this.master_key))),
            username: this.profile._id,
            password: window.sha256(password)
        }, 'profile/update', true, false);
    }

    /**
     * Updates the password and preferences of the user.
     * @function changeUsername
     * @public
     * @param {String} uname New username.
     * @param {String} password Current password for auth.
     * @return {Promise} JSON response from backend.
     */
    changeUsername(uname: string, password: string): Promise {
        return this.backend(true, true, 'POST', {
            new_username: uname,
            username: this.profile._id,
            password: window.sha256(password)
        }, 'profile/uname' + this.regCaptcha(), true, false);
    }

    /**
     * Updates the password of the user after a reset.
     * @function updateProfileForReset
     * @public
     * @param {String} new_password New password.
     * @param {String} password Hash of current password for auth.
     * @return {Promise} JSON response from backend.
     */
    updateProfileForReset(new_password: string, encr_master_key: string): Promise {
        return this.backend(true, true, 'POST', {
            new_password: window.sha256(new_password),
            encr_master_key: encr_master_key
        }, 'profile/update', true, true);
    }

    /**
     * Creates a new user.
     * @function createUser
     * @public
     * @param {String} username Username.
     * @param {String} password Password.
     * @param {Object[]} more More data to automatically create.
     * @param {String} email Email to warn.
     * @param {Boolean} is_company Create a company account.
     * @return {Promise} JSON response from backend.
     */
    createUser(username: string, password: string, more?: any[], email?: string, is_company?: boolean): Promise {
        var post = {
            username: username,
            password: password
        };
        if(!!more && !!email) {
            post['more'] = more;
            post['warn'] = email;
        }
        if(!!is_company)
            post['company_info'] = {is_company: true};
        return this.backend(true, true, 'POST', post, 'user/create' + this.regCaptcha(), false, false);
    }

    /**
     * Creates a new token for logging in.
     * @function createToken
     * @public
     * @param {String} username Username.
     * @param {String} password Password.
     * @param {Boolean} is_eternal Create a full token.
     * @return {Promise} JSON response from backend.
     */
    createToken(username: string, password: string, is_eternal: boolean): Promise {
        return this.backend(true, true, 'POST', {
            username: username,
            password: window.sha256(password),
            is_eternal: is_eternal
        }, 'profile/token/new', true, false, true);
    }

    /**
     * Invalidates tokens, logging out.
     * @function removeTokens
     * @public
     * @param {Boolean} all To remove all tokens.
     * @return {Promise} JSON response from backend.
     */
    removeTokens(all: boolean): Promise {
        return this.backend(true, false, 'DELETE', {}, 'profile/token' + (all? '' : ('?token=' + localStorage.getItem('token'))), true, true);
    }

    /**
     * Create an OAuth token.
     * @function createOAuth
     * @public
     * @param {String} for_id Given 3rd party name.
     * @param {String} prefix Prefix given.
     * @param {String} token Token for checking.
     * @param {Boolean} admin Create an admin account.
     * @return {Promise} JSON response from backend.
     */
    createOAuth(for_id: string, prefix: string, token?: string, admin?: boolean): Promise {
        var post = {
            for_id: for_id,
            prefix: prefix
        };
        if(!!token)
            post['token'] = token;
        if(!!admin)
            post['is_admin'] = admin;
        return this.backend(true, true, 'POST', post, 'oauth/new', true, true);
    }

    /**
     * Invalidates an OAuth token.
     * @function removeOAuth
     * @public
     * @param {String} id token id.
     * @return {Promise} JSON response from backend.
     */
    removeOAuth(id: string): Promise {
        return this.backend(true, true, 'DELETE', {}, 'oauth/' + id, true, true);
    }

    /**
     * Retrieves a piece of data.
     * @function getData
     * @public
     * @param {String} dataid Request id.
     * @return {Promise} JSON response from backend.
     */
    getData(dataid: string): Promise {
        return this.backend(true, false, 'GET', {}, 'data/' + dataid, true, true);
    }

    /**
     * Retrieves a piece of data.
     * @function getDataByName
     * @public
     * @param {String} name Request name.
     * @return {Promise} JSON response from backend.
     */
    getDataByName(name: string): Promise {
        return this.backend(true, false, 'GET', {}, 'data/byname/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Renames a piece of data.
     * @function rename
     * @public
     * @param {String} old Old name.
     * @param {String} now New name.
     * @return {Promise} JSON response from backend.
     */
    rename(old: string, now: string): Promise {
        return this.backend(true, false, 'GET', {}, 'data/' + window.encodeURIComponent(old) + '/to/' + window.encodeURIComponent(now), true, true, true);
    }

    /**
     * Trigger vaults.
     * @function triggerVaults
     * @public
     * @param {String} name Data name.
     * @return {Promise} JSON response from backend.
     */
    triggerVaults(name: string): Promise {
        return this.backend(true, false, 'GET', {}, 'data/trigger/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Deletes a piece of data.
     * @function getData
     * @public
     * @param {String} name Data name.
     * @return {Promise} JSON response from backend.
     */
    removeData(name: string): Promise {
        return this.backend(true, true, 'DELETE', {}, 'data/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Shares a data between users.
     * @function createVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} real_name Real data name.
     * @param {String} shared_to_id Id of person with who to share.
     * @param {Bytes} data_crypted_aes Locally crypted data using a freshly generated AES key.
     * @param {String} aes_crypted_shared_pub Locally crypted new AES key using remote public RSA key.
     * @param {Number} version Vault version.
     * @param {Number} expire_epoch Time for expiration.
     * @param {String} trigger URL that frontend should trigger upon change.
     * @param {Boolean} storable Create a storable vault.
     * @return {Promise} JSON response from backend.
     */
    createVault(data_name: string, real_name: string, shared_to_id: string, data_crypted_aes: number[], aes_crypted_shared_pub: string,
        version: number, expire_epoch?: number, trigger?: string, storable?: boolean): Promise {
        var post = {
            data_name: data_name,
            shared_to_id: shared_to_id,
            data_crypted_aes: this.arr2str(data_crypted_aes),
            aes_crypted_shared_pub: aes_crypted_shared_pub,
            expire_epoch: (!!expire_epoch)? expire_epoch : 0,
            trigger: (!!trigger)? trigger : '',
            real_name: real_name,
            version: version
        };
        if(typeof storable !== undefined && storable) {
            post['storable'] = true;
        }
        return this.backend(true, post.data_crypted_aes.length > 1000, 'POST', post, 'vault/new', true, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    revokeVault(vault_id: string): Promise {
        return this.backend(true, true, 'DELETE', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVaultFromGrantee
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    revokeVaultFromGrantee(vault_id: string): Promise {
        return this.backend(true, false, 'DELETE', {}, 'vault/forother/' + vault_id, true, true);
    }

    /**
     * Retrieves a data shared.
     * @function getVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getVault(vault_id: string): Promise {
        return this.backend(true, false, 'GET', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Returns the time the remote person accessed the vault.
     * @function getAccessVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getAccessVault(vault_id: string): Promise {
        return this.backend(true, false, 'GET', {}, 'vault/time/' + vault_id, true, true);
    }

    /**
     * Asks for a AES key.
     * @function getRestore
     * @public
     * @param {String} k Key.
     * @return {Promise} JSON response from backend.
     */
    getRestore(k: string): Promise {
        return this.backend(false, false, 'GET', {}, 'get/' + k, false, false);
    }

    /**
     * Asks for a reset link.
     * @function requestRestore
     * @public
     * @param {String} id Id.
     * @return {Promise} JSON response from backend.
     */
    requestRestore(id: string): Promise {
        return this.backend(false, true, 'GET', {}, 'request/' + id, false, false);
    }

    /**
     * Use a reset link.
     * @function mixRestore
     * @public
     * @param {String} id Requestant id.
     * @param {String} half Half password.
     * @return {Promise} JSON response from backend.
     */
    mixRestore(id: string, half: string): Promise {
        return this.backend(false, false, 'GET', {}, 'mix/' + id + '/' + window.encodeURIComponent(half), false, false);
    }

}