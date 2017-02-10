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
import {Auth} from './auth.service';
import {Trie} from '../utils/Trie';
import * as configs from './configs.js';

@Injectable()
export class Backend {

    public block_mask: boolean;
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
        is_dated_day_only?: boolean,
        instantiable: boolean,
        name_placeholder?: string,
        descr_key: string,
        long_descr_key: string,
        help_url: string,
        icon: string,
        mode: string,
        multiple?: boolean,
        enum?: string,
        validate: string,
        json_keys: {descr_key: string, mode: string, multiple?: boolean, enum?: string, enumMore?: string, required: boolean, placeholder?: string, help_url?: string}[],
        new_key?: string[],
        new_key_is?: string
        new_keys_only?: boolean,
        placeholder?: string,
        requires?: string,
        modes?: string[][],
        share_as_folder?: boolean,
        json_from_ask?: true,
        json_from_key?: string,
        can_trigger_account?: boolean,
        transform?: string
    }]};
    public generics_trie: Trie;
    public generics_paths: {[id: string]: {
        descr_key: string,
        long_descr_key: string,
        help_url: string
    }};
    private INSTANCE: string = 'localhost';
    public MY_URL = '';
    public EID_HOST = '';
    public BASE_URL = '';
    public RESTORE_URL = '';
    public ADVERT_WORLD_URL = '';
    public ADVERT_BEL_URL = '';
    public GWP_URL = '';
    public FEEDBACK_URL = 'https://whigi2-report.envict.com/api/http.php/tickets.json';
    public MAIL = '';
    public ENV: string = '';
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
     * @param auth Auth service.
     */
    constructor(private http: Http, private notif: NotificationsService, private translate: TranslateService, private router: Router, private auth: Auth) {
        var self = this;
        //Try loading info
        if(!!configs.c[this.INSTANCE]) {
            this.MY_URL = configs.c[this.INSTANCE].MY_URL;
            this.EID_HOST = configs.c[this.INSTANCE].EID_HOST;
            this.BASE_URL = configs.c[this.INSTANCE].BASE_URL;
            this.RESTORE_URL = configs.c[this.INSTANCE].RESTORE_URL;
            this.ADVERT_WORLD_URL = configs.c[this.INSTANCE].ADVERT_WORLD_URL;
            this.ADVERT_BEL_URL = configs.c[this.INSTANCE].ADVERT_BEL_URL;
            this.GWP_URL = configs.c[this.INSTANCE].GWP_URL;
            this.MAIL = configs.c[this.INSTANCE].MAIL;
            this.ENV = configs.c[this.INSTANCE].ENV;
        }
        //Other params
        this.block_mask = true;
        this.forceMove = false;
        this.data_loaded = false;
        this.rsa_key = [];
        this.generics_trie = new Trie();
        this.backend('whigi', false, 'GET', {}, 'generics.json', false, false).then(function(response) {
            self.generics = response;
            var keys = Object.getOwnPropertyNames(response);
            for(var i = 0; i < keys.length; i++) {
                self.generics_trie.addMilestones(keys[i], '/');
                self.generics_trie.add(keys[i], undefined);
            }
        }, function(e) {});
        this.backend('whigi', false, 'GET', {}, 'generics_paths.json', false, false).then(function(response) {
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
        if(!this.profile.company_info.by_key) {
            try {
                var kd = this.auth.getParams()[2];
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
        } else {
            this.rsa_key = [window.prompt(this.translate.instant('login.priKey'))];
            var nbstr = window.prompt(this.translate.instant('login.mk'));
            this.master_key = [];
            nbstr = nbstr.split(',');
            for(var i = 0; i < nbstr.length; i++)
                this.master_key.push(parseInt(nbstr[i].replace(/[\[\] ]/g, '')));
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
                this.auth.regPuzzle(res.puzzle);
            }
        } catch(e) {}
    }

    /**
     * Block UI.
     * @function block
     * @public
     * @param {Boolean} on Toggle.
     */
    block(on: boolean) {
        if(on) {
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
        } else {
            window.$.unblockUI();
        }
    }

    /**
     * Returns the result of a call to the backend.
     * @function backend
     * @private
     * @param {String} whigi 'whigi' to come from Whigi base. Otherwise, see endpoints.
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
    private backend(whigi: string, block: boolean, method: string, data: any, url: string, auth: boolean, token: boolean, puzzle?: boolean,
        ok?: Function, nok?: Function, num?: number): Promise {
        var call, puzzle = puzzle || false, self = this, dest;
        var headers: Headers = new Headers();
        num = num || 0;
        if(block && this.block_mask)
            this.block(true);

        function accept(resolve, response) {
            var res = response.json();
            if(typeof res === 'string') {
                res = JSON.parse(res);
            } else {
                res._status = response.status;
                if('puzzle' in res) {
                    self.auth.regPuzzle(res.puzzle);
                }
            }
            if(block && self.block_mask)
                self.block(false);
            resolve(res);
        }
        function retry(e, resolve, reject) {
            self.recordPuzzle(e);
            if(e.status == 412 && num < 4) {
                self.backend(whigi, block, method, data, url, auth, token, puzzle, resolve, reject, num + 1);
            } else {
                if(block && self.block_mask)
                    self.block(false);
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
            headers.append('X-Whigi-Authorization', 'Bearer ' + btoa(self.auth.getParams()[0]));
        } else if(auth) {
            headers.append('X-Whigi-Authorization', 'Basic ' + btoa(data.username + ':' + data.password));
        }
        headers.append('Accept-Language', this.translate.currentLang + ';q=1');
        switch(whigi) {
            case 'whigi':
                dest = this.BASE_URL;
                break;
            case 'whigi-restore':
                dest = this.RESTORE_URL;
                break;
            case 'whigi-advert-WORLD':
                dest = this.ADVERT_WORLD_URL;
                break;
            case 'whigi-advert-BEL':
                dest = this.ADVERT_BEL_URL;
                break;
            default:
                dest = this.BASE_URL;
                break;
        }
        dest += url + (puzzle? this.regPuzzle() : '');

        switch(method) {
            case 'post':
            case 'POST':
                headers.append('Content-Type', 'application/json');
                if(!!ok && !!nok) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }, function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }, function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'delete':
            case 'DELETE':
                if(!!ok && !!nok) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }, function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
               return new Promise(function(resolve, reject) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }, function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'get':
            case 'GET':
            default:
                if(!!ok && !!nok) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }, function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }, function(e) {
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
        var i = 0, complete, puzzle = this.auth.getParams()[1];
        if(!puzzle)
            return '?puzzle=0'
        do {
            complete = window.sha256(puzzle + i);
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
        return this.backend('whigi', false, 'GET', {}, 'selects/' + known, false, false);
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
        return this.backend('whigi', false, 'GET', {}, 'schemas/' + window.encodeURIComponent(name) + '/' + as + '/' + to, false, false);
    }

    /**
     * Get the tooltip help.
     * @function tooltip
     * @public
     * @param {String} name Tooltip name.
     * @return {Promise} JSON response from backend.
     */
    tooltip(name: string): Promise {
        return this.backend('whigi', true, 'GET', {}, 'helps/' + name, false, false);
    }

    /**
     * Returns the public info of a user.
     * @function peekUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    peekUser(known: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'peek/' + known, false, false);
    }

    /**
     * Returns the public info of a user.
     * @function getUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    getUser(known: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'user/' + known, true, true);
    }

    /**
     * Returns the info of the logged in user.
     * @function getProfile
     * @public
     * @return {Promise} JSON response from backend.
     */
    getProfile(): Promise {
        return this.backend('whigi', false, 'GET', {}, 'profile', true, true);
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
        return this.backend('whigi', true, 'POST', {
            new_keys: nk
        }, 'close/' + to, true, true, true);
    }

    /**
     * Obliterates profile.
     * @function oblit
     * @public
     * @return {Promise} JSON response from backend.
     */
    oblit(): Promise {
        return this.backend('whigi', true, 'DELETE', {}, 'profile', true, true);
    }

    /**
     * Posts info for company.
     * @function goCompany
     * @public
     * @param {Object} info Informations.
     * @return {Promise} JSON response from backend.
     */
    goCompany(info: any): Promise {
        return this.backend('whigi', true, 'POST', info, 'profile/info', true, true);
    }

    /**
     * Changes user's language eveywhere.
     * @function remLang
     * @public
     * @param {String} code New lang.
     * @return {Promise} JSON response from backend.
     */
    remLang(code: string): Promise {
        return this.backend('whigi', false, 'POST', {lang: code}, 'profile/info3', true, true);
    }

    /**
     * Loads data from BCE.
     * @function goBCE
     * @public
     * @param {String} bce BCE code.
     * @return {Promise} JSON response from backend.
     */
    goBCE(bce: string): Promise {
        return this.backend('whigi', true, 'GET', {}, 'eid/bce/' + bce, true, true);
    }

    /**
     * Returns the data of the user.
     * @function listData
     * @public
     * @return {Promise} JSON response from backend.
     */
    listData(): Promise {
        return this.backend('whigi', false, 'GET', {}, 'profile/data', true, true);
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
        return this.backend('whigi', true, 'POST', {
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
        return this.backend('whigi', true, 'POST', {
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
        return this.backend('whigi', true, 'POST', {
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
        return this.backend('whigi', true, 'POST', {
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
        if(!!more)
            post['more'] = more;
        if(!!email)
            post['warn'] = email;
        if(!!is_company)
            post['company_info'] = {is_company: true};
        return this.backend('whigi', true, 'POST', post, 'user/create' + this.regCaptcha(), false, false);
    }

    /**
     * Acks a new user.
     * @function ackUser
     * @public
     * @param {String} username Username.
     * @param {String} pubkey Public key
     * @param {Boolean} is_company Create a company account.
     * @return {Promise} JSON response from backend.
     */
    ackUser(username: string, pubkey: string, is_company?: boolean): Promise {
        var post = {
            username: username,
            public_pem: pubkey
        };
        if(!!is_company)
            post['company_info'] = {is_company: true};
        return this.backend('whigi', true, 'POST', post, 'user/ack', false, false);
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
        return this.backend('whigi', true, 'POST', {
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
        return this.backend('whigi', false, 'DELETE', {}, 'profile/token' + (all? '' : ('?token=' + this.auth.getParams()[0])), true, true);
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
        return this.backend('whigi', true, 'POST', post, 'oauth/new', true, true);
    }

    /**
     * Invalidates an OAuth token.
     * @function removeOAuth
     * @public
     * @param {String} id token id.
     * @return {Promise} JSON response from backend.
     */
    removeOAuth(id: string): Promise {
        return this.backend('whigi', true, 'DELETE', {}, 'oauth/' + id, true, true);
    }

    /**
     * Goes on nominatim.
     * @function nominatim
     * @public
     * @param {String} query Query.
     * @return {Promise} JSON response from backend.
     */
    nominatim(query: string): Promise {
        return this.backend('whigi', false, 'POST', {}, 'nominatim/search.php?format=json&limit=1&q=' + query, true, true);
    }

    /**
     * Ask for a execution server side.
     * @function doPay
     * @public
     * @param {String} pathfor Path to be credited.
     * @param {String} pid Payment ID.
     * @param {String} payer_id Payer ID.
     * @return {Promise} JSON response from backend.
     */
    doPay(pathfor: string, pid:string, payer_id: string): Promise {
        return this.backend('whigi', false, 'POST', {payer_id: payer_id}, 'payed/' + window.encodeURIComponent(pathfor) + '/' + pid, true, true);
    }

    /**
     * Ask for a payment server side.
     * @function askPay
     * @public
     * @param {String} pathfor Path to be credited.
     * @return {Promise} JSON response from backend.
     */
    askPay(pathfor: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'payed/init/begin/' + window.encodeURIComponent(pathfor), true, true);
    }

    /**
     * Retrieves a piece of data.
     * @function getData
     * @public
     * @param {String} dataid Request id.
     * @return {Promise} JSON response from backend.
     */
    getData(dataid: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'data/' + dataid, true, true);
    }

    /**
     * Retrieves a piece of data.
     * @function getDataByName
     * @public
     * @param {String} name Request name.
     * @return {Promise} JSON response from backend.
     */
    getDataByName(name: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'data/byname/' + window.encodeURIComponent(name), true, true);
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
        return this.backend('whigi', false, 'GET', {}, 'data/' + window.encodeURIComponent(old) + '/to/' + window.encodeURIComponent(now), true, true, true);
    }

    /**
     * Trigger vaults.
     * @function triggerVaults
     * @public
     * @param {String} name Data name.
     * @return {Promise} JSON response from backend.
     */
    triggerVaults(name: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'data/trigger/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Deletes a piece of data.
     * @function getData
     * @public
     * @param {String} name Data name.
     * @return {Promise} JSON response from backend.
     */
    removeData(name: string): Promise {
        return this.backend('whigi', true, 'DELETE', {}, 'data/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Links a vault.
     * @function linkVault
     * @public
     * @param {String} vault_id Vault ID to act upon.
     * @param {String} link_name New name.
     * @return {Promise} JSON response from backend.
     */
    linkVault(vault_id: string, link_name: string): Promise {
        return this.backend('whigi', false, 'POST', {
            vault_id: vault_id,
            data_name: link_name
        }, 'vault/link', true, true, true);
    }

    /**
     * Shares a data between users.
     * @function createVault
     * @public
     * @param {String} data_name Data name.
     * @param {String[]} links Links to add.
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
    createVault(data_name: string, links: string[], real_name: string, shared_to_id: string, data_crypted_aes: number[], aes_crypted_shared_pub: string,
        version: number, expire_epoch?: number, trigger?: string, storable?: boolean): Promise {
        var post = {
            data_name: data_name,
            links: links,
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
        return this.backend('whigi', post.data_crypted_aes.length > 1000, 'POST', post, 'vault/new', true, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    revokeVault(vault_id: string): Promise {
        return this.backend('whigi', true, 'DELETE', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVaultFromGrantee
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    revokeVaultFromGrantee(vault_id: string): Promise {
        return this.backend('whigi', false, 'DELETE', {}, 'vault/forother/' + vault_id, true, true);
    }

    /**
     * Retrieves a data shared.
     * @function getVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getVault(vault_id: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Returns the time the remote person accessed the vault.
     * @function getAccessVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getAccessVault(vault_id: string): Promise {
        return this.backend('whigi', false, 'GET', {}, 'vault/time/' + vault_id, true, true);
    }

    /**
     * Ask for a share.
     * @function askShare
     * @public
     * @param {String[]} data_list Share formatted data list.
     * @param {String} towards Email to target.
     * @param {Number} expire_epoch Time for expiration.
     * @param {String} trigger URL that frontend should trigger upon change.
     * @param {String} lang Language code.
     * @return {Promise} JSON response from backend.
     */
    askShare(data_list: string[], towards: string, expire_epoch: number, trigger: string, lang: string): Promise {
        return this.backend('whigi', false, 'POST', {
            list: data_list,
            towards: towards,
            expire: expire_epoch,
            trigger: trigger,
            lang: lang
        }, 'ask', true, true, true);
    }

    /**
     * Asks for a AES key.
     * @function getRestore
     * @public
     * @param {String} k Key.
     * @return {Promise} JSON response from backend.
     */
    getRestore(k: string): Promise {
        return this.backend('whigi-restore', false, 'GET', {}, 'get/' + k, false, false);
    }

    /**
     * Asks for a reset link.
     * @function requestRestore
     * @public
     * @param {String} id Id.
     * @return {Promise} JSON response from backend.
     */
    requestRestore(id: string): Promise {
        return this.backend('whigi-restore', true, 'GET', {}, 'request/' + id, false, false);
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
        return this.backend('whigi-restore', false, 'GET', {}, 'mix/' + id + '/' + window.encodeURIComponent(half), false, false);
    }

    /**
     * Searches for ads.
     * @function searchAds
     * @public
     * @param {String} ccode Country code.
     * @param {Object[]} points Points.
     * @param {String} query Query.
     * @return {Promise} JSON response from backend.
     */
    searchAds(ccode: string, points: {lat: number, lon: number}[], query: string): Promise {
        return this.backend('whigi-advert-' + ccode, false, 'POST', {
            points: points,
            terms: query.split(/[\s,]/),
            lang: this.translate.currentLang
        }, 'search', false, false);
    }

}