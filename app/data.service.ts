/**
 * Service play with data of the auth'd user.
 * @module data.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable, ApplicationRef, EventEmitter} from '@angular/core';
import {NotificationsService} from 'angular2-notifications';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';
import {Trie} from '../utils/Trie';
import * as modules from './subcmpts/templates/generics';

@Injectable()
export class Data {

    public m : {keys: {[id: string]: {is_i18n: boolean, holds: string[], left_num: number}}, holds: {[id: string]: {is_i18n: boolean, holds: string[], open: boolean}}};
    public ev: EventEmitter<[string, boolean]>;
    private maes: number[];
    private selects: {[id: string]: string[]};
    private marked: {[id: string]: boolean};
    private ee: EventEmitter<number>;
    private how: EventEmitter<number>;

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     * @param router Routing service.
     * @param backend Backend service.
     * @param check Check service.
     */
    constructor(private notif: NotificationsService, private translate: TranslateService, private backend: Backend,
        private check: ApplicationRef) {
        var self = this;
        this.m = modules.m;
        this.ev = new EventEmitter<[string, boolean]>();
        this.selects = {};
        this.marked = {};
        this.ee = new EventEmitter<number>();
        this.how = new EventEmitter<number>();
    }

    /**
     * Unique out an array in n^2 time.
     * @function unique
     * @private
     * @param {Array} a Input.
     * @return {Array} Output.
     */
    private unique(a: any[]): any[] {
        for(var i = 0; i < a.length; ++i) {
            for(var j = i+1; j < a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    }

    /**
     * Extend the modules for one user.
     * @function extendModules
     * @public
     */
    extendModules() {
        var self = this;
        this.m = Object.assign({}, modules.m);
        this.getData('keys/display', false, undefined, true).then(function(data) {
            var perso = {kkeys: [], keys: {}, modules: [], holds: {}};
            self.maes = data.decr_aes || self.backend.newAES();
            try {
                perso = JSON.parse(data.decr_data);
            } catch(e) {}
            //Objects
            self.m.keys = Object.assign((perso.keys || {}), self.m.keys);
            self.m.holds = Object.assign((perso.holds || {}), self.m.holds);
        }, function(e) {});
    }

    /**
     * Save current personal config.
     * @function saveRows
     * @public
     */
    saveRows() {
        var self = this, perso = {};
        var keys = Object.getOwnPropertyNames(this.m.keys).filter(function(el): boolean {
            return !self.m.keys[el].is_i18n;
        });
        perso['keys'] = {};
        for(var i = 0; i < keys.length; i++)
            perso['keys'][keys[i]] = this.m.keys[keys[i]];
        keys = Object.getOwnPropertyNames(this.m.holds).filter(function(el): boolean {
            return !self.m.holds[el].is_i18n;
        });
        perso['holds'] = {};
        for(var i = 0; i < keys.length; i++)
            perso['holds'][keys[i]] = this.m.holds[keys[i]];
        this.newData(true, 'keys/display', JSON.stringify(perso), false, 0, true, this.maes).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('sidebar.saved'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('sidebar.noSave'));
        });
    }

    /**
     * Warns for save of mapping.
     * @fucntion warnM
     * @public
     */
    warnM() {
        window.$(".whigi-save-config").animate({opacity:0}, 200, 'linear', function() {
            window.$(this).animate({opacity:1}, 200, function() {
                window.$(this).animate({opacity:0}, 200, function() {
                    window.$(this).animate({opacity:1}, 200, function() {
                        window.$(this).animate({opacity:0}, 200, function() {
                            window.$(this).animate({opacity:1}, 200);
                        });
                    });
                });
            });
        });
    }

    /**
     * List possible destinations for a generic.
     * @function destinations
     * @param {String} gen Generic name.
     * @return {String[][]} Array holding modules and submodules.
     */
    destinations(gen: string): string[][] {
        var ret: string[][] = [];
        var kkeys = Object.getOwnPropertyNames(this.m.keys);
        for(var i = 0; i < kkeys.length; i++) {
            if(!this.m.keys[kkeys[i]].is_i18n) {
                for(var j = 0; j < this.m.keys[kkeys[i]].holds.length; j++) {
                    var lk = this.m.keys[kkeys[i]].holds[j];
                    if(!this.m.holds[lk].is_i18n && this.m.holds[lk].holds.indexOf(gen) == -1)
                        ret.push([kkeys[i], lk]);
                }
            }
        }
        return ret;
    }

    /**
     * Register generic in tier2 level of tier1 page.
     * @function registerTopo
     * @public
     * @param {String} gen Generic name.
     * @param {String} t1 Tier 1.
     * @param {String} t2 Tier 2.
     */
    registerTopo(gen: string, t1: string, t2: string) {
        if(this.m.keys[t1].holds.indexOf(t2) == -1)
            this.m.keys[t1].holds.push(t2);
        this.m.holds[t2].holds.push(gen);
        this.warnM();
    }

    /**
     * Wrapper around getOwnPropertyNames.
     * @function keys
     * @public
     * @param {Object} o Input.
     * @return {String[]} Keys.
     */
    keys(o: any): string[] {
        return Object.getOwnPropertyNames(o);
    }

    /**
     * Prepares a name.
     * @function forDisplay
     * @public
     * @param {String} str Name.
     * @return {String} OKayed.
     */
    forDisplay(str: string): string {
        if(!str)
            return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Filters the list to only accept those who meet the requirements.
     * @function filterKnown
     * @public
     * @param {String[]} l Input.
     * @param {Function} callback Callback to be called with filtered elements and missing elements and required elements.
     */
    filterKnown(l: string[], callback: Function) {
        var self = this, more = [], req = [], unreq = [], decr = {}, done = 0;
        function complete() {
            var alwaysin = l.filter(function(el: string): boolean {
                if(!self.backend.generics[el][self.backend.generics[el].length - 1].requires)
                    return true;
                if(!(self.backend.generics[el][self.backend.generics[el].length - 1].requires in self.backend.profile.data))
                    return false;
                for(var i = 0; i < self.backend.generics[el][self.backend.generics[el].length - 1].modes.length; i++) {
                    if(new RegExp(self.backend.generics[el][self.backend.generics[el].length - 1].modes[i][0]).test(decr[self.backend.generics[el][self.backend.generics[el].length - 1].requires])) {
                        more.push(self.backend.generics[el][self.backend.generics[el].length - 1].modes[i][1]);
                        break;
                    }
                }
                return false;
            });
            callback(alwaysin.concat(more), unreq, req);
        }

        for(var i = 0; i < l.length; i++) {
            if(!!self.backend.generics[l[i]][self.backend.generics[l[i]].length - 1].requires)
                req.push(self.backend.generics[l[i]][self.backend.generics[l[i]].length - 1].requires);
        }
        for(var i = 0; i < req.length; i++) {
            if(!(req[i] in self.backend.profile.data)) {
                unreq.push(req[i]);
                done++;
                if(done >= req.length)
                    complete();
                continue;
            }
            self.getData(self.backend.profile.data[req[i]].id, false).then(function(data) {
                decr[this] = data.decr_data;
                done++;
                if(done >= req.length)
                    complete();
            }.bind(req[i]), function(e) {
                done++;
                if(done >= req.length)
                    complete();
            });
        }
        if(req.length == 0)
            complete();
    }

    /**
     * Manages a worker.
     * @function workerMgt
     * @public
     * @param {Boolean} encrypt Encryption or not.
     * @param {Function} callback Callback to call with result.
     * @param {Boolean} front If in foreground.
     * @return {Function} Worker onmessage implementation.
     */
    workerMgt(encrypt: boolean, callback: Function, front?: boolean) {
        var self = this;
        front = front !== false;
        this.how.emit(1);
        return function(msg) {
            switch(msg.data[0]) {
                case 4:
                    //Told by worker short message
                    if(msg.data[1] && front === true) {
                        window.$('.page-content').block({
                            message: `
                                <div style="background-color: #2b3643;">
                                    <ul class="dropdown-menu-list scroller" style="height: 45px; overflow: hidden; width: auto; padding: 5px;">
                                        <li>
                                            <a href="javascript:;" style="cursor: default;">
                                                <span class="task">
                                                    <span class="desc" style="color: white;">` + self.translate.instant('header.operation') + `</span>
                                                    <span class="percent" style="color: white;" id="worktx">0%</span>
                                                </span><br />
                                                <span class="progress">
                                                    <span id="workpg" style="width: 0%;" class="progress-bar progress-bar-success" aria-valuemin="0" aria-valuemax="100"></span>
                                                </span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                `,
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
                        front = false;
                    }
                    break;
                case 1:
                    self.ee.emit(parseInt(msg.data[1]));
                    if(front === true) {
                        window.$('#workpg').css('width', msg.data[1] + '%');
                        window.$('#worktx').text(msg.data[1] + '%');
                    }
                    self.check.tick();
                    break;
                case 2:
                    if(front === true)
                        window.$('.page-content').unblock();
                    self.how.emit(0);
                    self.check.tick();
                    callback(msg.data[1]);
                    break;
                case 3:
                    if(front === true)
                        window.$('.page-content').unblock();
                    self.how.emit(0);
                    self.notif.error(self.translate.instant(encrypt? 'encrypting' : 'decrypting'), self.translate.instant('corruption'));
                    console.log(JSON.parse(msg.data[1]));
                    self.check.tick();
                    callback('[]');
                    break;
                case 0:
                default:
                    break;
            }
        }
    }

    /**
     * Build up a generic and test it.
     * @param {String} raw_data Source for data.
     * @param {String} raw_data_file Source for file.
     * @param {Object} data_source Source for keyed values.
     * @param {String} gen_name Generic name.
     * @param {Boolean} as_file Load as file.
     * @return {String} Built up data or undefined if cannot pass test.
     */
    recGeneric(raw_data: string, raw_data_file: string, data_source: {[id: string]: string}, gen_name: string, as_file: boolean): string[] | string {
        raw_data = !!raw_data? raw_data.toString().trim() : '';
        if(raw_data.length > 127 && !as_file)
            return ['error', 'generics.tooLong'];
        //Build up the data, keys wrapping and date wrapping
        if(this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].mode == 'json_keys') {
            var ret = {};
            for(var i = 0; i < this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].json_keys.length; i++) {
                if(!data_source[this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].json_keys[i].descr_key]
                    || data_source[this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].json_keys[i].descr_key].length > 127)
                    return ['error', 'generics.tooLong'];
                ret[this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].json_keys[i].descr_key] = data_source[this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].json_keys[i].descr_key].trim();
            }
            raw_data = JSON.stringify(ret);
        }
        if(this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].is_dated) {
            raw_data = JSON.stringify([{
                value: as_file? raw_data_file : raw_data,
                from: (new Date).getTime()
            }]);
        } else {
            raw_data = as_file? raw_data_file : raw_data;
        }
        //Test if the data passes the associated test
        var res = window.eval.call(window, '(function(test) {' + this.backend.generics[gen_name][this.backend.generics[gen_name].length - 1].validate + '})')(raw_data);
        if(res !== true) {
            return ['error', res];
        }
        return raw_data;
    }

    /**
     * Store the user data's. Build the trie's for data and whared_with_me.
     * @function listData
     * @public
     * @param {Boolean} resolve Whether to perform heavy computations.
     * @return {Promise} Promise.
     */
    listData(resolve: boolean): Promise {
        var self = this;

        return new Promise(function(resolve, reject) {
            if(self.backend.data_loaded)
                resolve();

            self.backend.data_trie = new Trie();
            self.backend.shared_with_me_trie = new Trie();
            self.backend.my_shares = {};
            self.backend.listData().then(function(add) {
                self.backend.profile.data = add.data;
                self.backend.profile.shared_with_me = add.shared_with_me;
                
                var keys = Object.getOwnPropertyNames(add.data);
                for(var i = 0; i < keys.length; i++) {
                    self.backend.data_trie.addMilestones(keys[i], '/');
                    self.backend.data_trie.add(keys[i], self.backend.profile.data[keys[i]]);
                    //If heavy is on, check for version discordance
                    if(resolve) {
                        var gen_name = undefined;
                        if(!!self.backend.generics[keys[i]]) {
                            gen_name = keys[i];
                        } else if(!!self.backend.generics[keys[i].replace(/\/[^\/]*$/, '')] && self.backend.generics[keys[i].replace(/\/[^\/]*$/, '')][0].instantiable) {
                            gen_name = keys[i].replace(/\/[^\/]*$/, '');
                        }
                        if(gen_name && add.data[keys[i]].version < self.backend.generics[gen_name].length - 1) {
                            var name = keys[i];
                            self.backend.transitionSchema(gen_name, add.data[keys[i]].version, self.backend.generics[gen_name].length - 1).then(function(js) {
                                self.getData(add.data[name].id).then(function(data) {
                                    var got = window.eval.call(window, '(function(got) {' + js.js + '})')(data.decr_data);
                                    self.modifyData(name, got, self.backend.generics[gen_name][self.backend.generics[gen_name].length - 1].is_dated, self.backend.generics[gen_name].length - 1,
                                        add.data[name].shared_to, self.backend.generics[gen_name][self.backend.generics[gen_name].length - 1].instantiable, data.decr_aes);
                                }, function(e) {});
                            }, function(e) {});
                        }
                    }
                    //Go through shares
                    var kk = Object.getOwnPropertyNames(add.data[keys[i]].shared_to);
                    for(var j = 0; j < kk.length; j++) {
                        self.backend.my_shares[kk[j]] = self.backend.my_shares[kk[j]] || [];
                        self.backend.my_shares[kk[j]].push(keys[i]);
                    }
                }
                keys = Object.getOwnPropertyNames(add.shared_with_me);
                for(var i = 0; i < keys.length; i++) {
                    var insides = Object.getOwnPropertyNames(add.shared_with_me[keys[i]]);
                    for(var j = 0; j < insides.length; j++) {
                        self.backend.shared_with_me_trie.addMilestones(keys[i] + '/' + insides[j], '/');
                        self.backend.shared_with_me_trie.add(keys[i] + '/' + insides[j], self.backend.profile.shared_with_me[keys[i]][insides[j]]);
                        //If heavy is on, check if storable data
                        if(resolve) {
                            if(self.backend.profile.shared_with_me[keys[i]][insides[j]].indexOf('storable') == 0) {
                                var k = keys[i], kkstr = insides[j];
                                self.getVault(self.backend.profile.shared_with_me[keys[i]][insides[j]]).then(function(vault) {
                                    self.newData(true, vault.storable[0], vault.decr_data, vault.is_dated, vault.version, false).then(function() {
                                        self.backend.revokeVaultFromGrantee(self.backend.profile.shared_with_me[k][kkstr]).then(function() {
                                            self.listData(false);
                                        }, function(e) {});
                                        delete self.backend.profile.shared_with_me[k][kkstr];
                                    }, function(e) {});
                                }, function(e) {});
                            }
                        }
                    }
                }
                self.backend.data_loaded = true;
                resolve();
            }, function(e) {
                self.backend.profile.data = {};
                self.backend.profile.shared_with_me = {};
                self.backend.data_loaded = true;
                self.notif.error(self.translate.instant('error'), self.translate.instant('noData'));
                resolve();
            });
        });
    }

    /**
     * Register a new data.
     * @function newData
     * @public
     * @param {Boolean} is_bound Whether data is bound.
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Boolean} is_dated Dated field.
     * @param {Number} version Data version.
     * @param {Boolean} ignore Ignore existing data, wiping it.
     * @param {Number[]} naes Allows specifying which key to use.
     * @return {Promise} Whether it went OK.
     */
    newData(is_bound: boolean, name: string, value: string, is_dated: boolean, version: number, ignore?: boolean, naes?: number[]): Promise {
        var self = this, enc_key: number[];
        ignore = ignore || false;

        return new Promise(function(resolve, reject) {
            if(!ignore && self.backend.data_trie.has(name)) {
                reject(['exists']);
                return;
            }
            if(!self.backend.master_key)
                self.backend.decryptMaster();

            naes = is_bound? (naes || self.backend.newAES()) : self.backend.master_key;
            self.backend.encryptAES(value, self.workerMgt(true, function(got) {
                if(is_bound)
                    enc_key = new window.aesjs.ModeOfOperation.ctr(self.backend.master_key, new window.aesjs.Counter(0)).encrypt(naes);
                else
                    enc_key = [];
                self.backend.postData(name, got, version, is_dated, is_bound, enc_key).then(function(res) {
                    var shared_to = (name in self.backend.profile.data)? self.backend.profile.data[name].shared_to : {};
                    self.backend.profile.data[name] = {
                        id: res._id,
                        length: 0,
                        is_dated: is_dated,
                        shared_to: shared_to,
                        version: version
                    }
                    self.backend.data_trie.addMilestones(name, '/');
                    self.backend.data_trie.add(name, self.backend.profile.data[name]);
                    resolve(naes);
                }, function(e) {
                    reject(['server', e]);
                });
            }), naes);
        });
    }

    /**
     * Try to revoke a vault.
     * @function revoke
     * @public
     * @param {String} data_name Data name to revoke in.
     * @param {String} shared_to_id ID to revoke.
     * @return {Promise} Whether went OK.
     */
    revoke(data_name: string, shared_to_id: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            if(!(data_name in self.backend.profile.data)) {
                reject('No such data');
                return;
            }
            if(!(shared_to_id in self.backend.profile.data[data_name].shared_to)) {
                resolve();
                return;
            }
            self.backend.revokeVault(self.backend.profile.data[data_name].shared_to[shared_to_id]).then(function() {
                delete self.backend.profile.data[data_name].shared_to[shared_to_id];
                var i = self.backend.my_shares[shared_to_id].indexOf(data_name);
                delete self.backend.my_shares[shared_to_id][i];
                resolve();
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Removes a data if no associated vaults.
     * @function remove
     * @public
     * @param {String} name Data name.
     * @return {Promise} Of whether went OK.
     */
    remove(name: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.removeData(name).then(function() {
                delete self.backend.profile.data[name];
                self.backend.data_trie.remove(name);
                resolve();
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Modify a data and associated vaults.
     * @function modifyData
     * @public
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Boolean} is_dated Dated field.
     * @param {Number} version Data version.
     * @param {Object} users_mapping A dictionary that must contain user id => expire_epoch.
     * @param {Boolean} is_folder Whether to dump vault name into folder.
     * @param {Number[]} enc_key Used encryption key for bound data.
     * @return {Promise} Whether it went OK.
     */
    modifyData(name: string, value: string, is_dated: boolean, version: number, users_mapping: {[id: string]: {date: Date, trigger: string}}, is_folder: boolean, enc_key: number[]): Promise {
        var i = 0, names = Object.getOwnPropertyNames(users_mapping), max = names.length, went = true;
        var self = this;

        function check(ok, nok) {
            i++;
            if(i >= max) {
                self.listData(false);
                if(went)
                    ok();
                else
                    nok(['vault']);
            }
        }
        //No, we let backend do this
        //self.backend.triggerVaults(name);
        var is_bound = !!self.backend.profile.data[name]? self.backend.profile.data[name].id.indexOf('datafragment') == 0 : true;
        return new Promise(function(resolve, reject) {
            self.newData(is_bound, name, value, is_dated, version, true, enc_key).then(function() {
                if(names.length > 0 && !is_bound) {
                    names.forEach(function(id) {
                        var time: Date = (!!users_mapping[id].date && !!users_mapping[id].date.getTime)? users_mapping[id].date : new Date(0);
                        self.grantVault(id, is_folder? name.replace(/\/[^\/]*$/, '') : name, name, value, version, time, users_mapping[id].trigger, false, undefined).then(function(user, newid) {
                            check(resolve, reject);
                        }, function() {
                            went = false;
                            check(resolve, reject);
                        });
                    });
                } else {
                    resolve();
                }
            }, function(err, e) {
                reject(err, e);
            });
        });
    }

    /**
     * Retrieve a vault.
     * @function getVault
     * @public
     * @param {String} id Vault id.
     * @return {Promise} Responses decrypted.
     */
    getVault(id: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getVault(id).then(function(vault) {
                var aesKey: number[] = self.backend.decryptRSA(vault.aes_crypted_shared_pub);
                self.backend.decryptAES(self.backend.str2arr(vault.data_crypted_aes), self.workerMgt(false, function(got) {
                    vault.decr_data = got;
                    resolve(vault);
                }), aesKey);
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Grants access to a data, creating a vault.
     * @function grantVault
     * @public
     * @param {String} id User id.
     * @param {String} name Data name.
     * @param {String} real_name Real data name.
     * @param {String} decr_data Decrypted data or key for bound vaults.
     * @param {Number} version Vault version.
     * @param {Date} max_date Valid until.
     * @param {String} new_trigger URL to trigger.
     * @param {Boolean} is_storable Create a storable vault.
     * @param {Number[]} enc_key Key for bound vaults.
     * @return {Promise} Whether went OK with remote profile and newly created vault.
     */
    grantVault(id: string, name: string, real_name: string, decr_data: string, version: number, max_date: Date, new_trigger: string, is_storable: boolean, enc_key: number[]): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getUser(id).then(function(user) {
                //Sanity check
                if(!(real_name in self.backend.profile.data)) {
                    reject('sanity');
                    return;
                }
                var is_bound = self.backend.profile.data[real_name].id.indexOf('datafragment') == 0;

                //Keys
                var aesKey: number[] = is_bound? enc_key : self.backend.newAES();
                var aes_crypted_shared_pub: string = self.backend.encryptRSA(aesKey, user.rsa_pub_key);

                function complete(got: number[]) {
                    self.backend.createVault(name, real_name, user._id, got, aes_crypted_shared_pub, version,
                        (max_date.getTime() < (new Date).getTime())? 0 : max_date.getTime(), new_trigger, is_storable).then(function(res) {
                        self.backend.profile.data[real_name].shared_to[user._id] = res._id;
                        self.backend.my_shares[id] = self.backend.my_shares[id] || [];
                        if(self.backend.my_shares[id].indexOf(real_name) == -1)
                            self.backend.my_shares[id].push(real_name);
                        resolve(user, res._id);
                    }, function(e) {
                        reject(e);
                    });
                }
                if(!is_bound) {
                    self.backend.encryptAES(decr_data, self.workerMgt(true, function(got) {
                        complete(got);
                    }), aesKey);
                } else {
                    complete(self.backend.str2arr(self.backend.profile.data[real_name].id));
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Find all user details for the users listed.
     * @function populateUsers
     * @public
     * @param {String[]} User id's.
     * @return {Promise} To have a dictionary indexed by id's.
     */
    populateUsers(ids: string[]): Promise {
        var i = 0, max = ids.length;
        var ret = {}
        var self = this;

        function check(r) {
            i++;
            if(i >= max)
                r(ret);
        }

        return new Promise(function(resolve, reject) {
            ids.forEach(function(id) {
                self.backend.getUser(id).then(function(data) {
                    ret[data._id] = data;
                    check(resolve);
                }, function() {
                    check(resolve);  
                });
            });
            if(ids.length == 0)
                resolve({});
        });
    }

    /**
     * Get a datafragment, and parse it.
     * @function getData
     * @public
     * @param {String} id Datafragment ID.
     * @param {Boolean} front Frontend display.
     * @param {Function} inter An intermediate callback that returns a promise to run before decryption. Will receive data and may be undefined.
     * @param {Boolean} byName If want to use name rather than ID.
     * @return {Promise} The datafragment, completed with decrypted data.
     */
    getData(id: string, front?: boolean, inter?: Function, byName?: boolean): Promise {
        var self = this, getter: Function = (!!byName && byName)? this.backend.getDataByName : this.backend.getData;
        return new Promise(function(resolve, reject) {
            getter.call(self.backend, id).then(function(data) {
                function complete(key: number[]) {
                    self.backend.decryptAES(self.backend.str2arr(data.encr_data), self.workerMgt(false, function(got) {
                        data.decr_data = got;
                        resolve(data);
                    }, front), key);
                }
                function prepared(key: number[]) {
                    if(!!inter) {
                        inter(data).then(function() {
                            complete(key);
                        });
                    } else {
                        complete(key);
                    }
                }
                //First decryption phase if any
                if(data._id.indexOf('datafragment') == 0) {
                    if(!self.backend.master_key)
                        self.backend.decryptMaster();
                    data.decr_aes = new window.aesjs.ModeOfOperation.ctr(self.backend.master_key, new window.aesjs.Counter(0)).decrypt(self.backend.str2arr(data.encr_aes));
                    prepared(data.decr_aes);
                } else {
                    prepared(self.backend.master_key);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Moves to top.
     * @function top
     * @public
     */
    top() {
        window.scrollTo(0, 0);
    }

    /**
     * Collapses a div.
     * @function collapse
     * @public
     * @param {String} id Div to toggle.
     */
    collapse(id: string) {
        window.$('#' + id).slideToggle(300);
        window.$('#' + id).prev().find('a.tl-link').toggleClass('expand');
        window.$('#' + id).prev().find('a.tl-link').toggleClass('collapse');
    }

    /**
     * Sanitarizes name.
     * @function sanit
     * @public
     * @param {String} s String.
     * @return {String} Safe.
     */
    sanit(s: string): string {
        if(!s)
            return '';
        return s.replace(/[\/\.#]/g, '_');
    }

    /**
     * Returns whether a name is Whigi related.
     * @function isWhigi
     * @public
     * @param {String} str String.
     * @return {Boolean} Response.
     */
    isWhigi(str: string): boolean {
        return /(whigi)|(www)|(wissl)|(envict)|(mail)|(imap)|(pop)|(smtp)|(ssh)|(ftp)|(api)|(restore)|(giveaway)/i.test(str);
    }

    /**
     * Retrieves the keys for a select.
     * @function getSelect
     * @public
     * @param {String} e Enum name.
     * @return {String[]} Values.
     */
    getSelect(e: string): string[] {
        var self = this;
        if(e in this.selects)
            return this.selects[e];
        if(e in this.marked)
            return [];
        this.marked[e] = true;
        this.backend.selectValues(e).then(function(vals) {
            if(!(e in self.selects)) {
                self.selects[e] = vals.values;
                delete self.marked[e];
                self.check.tick();
            }
        });
        return [];
    }

    /**
     * Length of trie.
     * @function length
     * @public
     * @param {Trie} cpt Trie.
     * @return {Number} Length.
     */
    length(cpt: Trie): number {
        if(!cpt)
            return 0;
        return cpt.suggestions('').filter(function(el) {return el.charAt(el.length - 1) != '/';}).length;
    }

    /**
     * Add pictures to DOM.
     * @function picts
     * @public
     * @param {Object} user User.
     * @param {String} dom DOM ID.
     */
    picts(user: any, dom: string) {
        var self = this;
        //Cascading shares hack
        if(!!window.$('#' + dom).find('#mypict').length && window.$('#' + dom).find('#mypict').length > 0)
            return;
        //Really add pictures
        if(!!user.company_info && !!user.company_info.picture)
            window.$('#' + dom).prepend('<img id="mypict" src="' + user.company_info.picture + '" height="32px" alt="" style="float: left;margin-right: 10px;" />');
        else
            window.$('#' + dom).prepend('<img id="mypict" src="assets/logo.png" height="32px" alt="" style="float: left;margin-right: 10px;" />');
        window.$('#' + dom).prepend('<img id="confipict" src="img/' + user.is_company + '.png" height="32px" alt="" style="float: left;margin-right: 10px;cursor: pointer;" />');
        window.$('#confipict').click(function() {
            window.$(`
                <div class="modal">
                    <h3>` + self.translate.instant('help') + `</h3>
                    <p>` + self.translate.instant('confidence') + `</p>
                </div>
            `).appendTo('body').modal();
        });
    }

    /**
     * Triggers the load.
     * @function triggerLoad
     * @public
     * @param {String} id The ID of the input.
     */
    triggerLoad(id: string) {
        window.$('#' + id).trigger('click');
    }

    /**
     * Show password strength.
     * @function showStr
     * @public
     * @param {String} id DOM element.
     * @param {String} pass DOM Password.
     */
    showStr(id: string, pass: String) {
        var res = 0, l = 0, L = 0, n = 0, o = 0;
        pass = pass || '';
        setImmediate(function() {
            pass = window.$('#' + pass).val();
            pass = pass || '';
            for(var i = 0; i < pass.length; i++) {
                if(pass.charCodeAt(i) >= 97 && pass.charCodeAt(i) <= 122)
                    l++;
                else if(pass.charCodeAt(i) >= 65 && pass.charCodeAt(i) <= 90)
                    L++;
                else if(pass.charCodeAt(i) >= 48 && pass.charCodeAt(i) <= 57)
                    n++;
                else
                    o++;
            }
            if(pass.length >= 10)
                res += 20;
            if(l > 1)
                res += 20;
            if(L > 1)
                res += 20;
            if(n > 1)
                res += 20;
            if(o > 1)
                res += 20;
            window.$('#' + id).css('width', res + '%');
            if(res >= 80)
                window.$('#' + id).removeClass('progress-bar-success progress-bar-warning progress-bar-danger').addClass('progress-bar-success');
            else if(res >= 40)
                window.$('#' + id).removeClass('progress-bar-success progress-bar-warning progress-bar-danger').addClass('progress-bar-warning');
            else
                window.$('#' + id).removeClass('progress-bar-success progress-bar-warning progress-bar-danger').addClass('progress-bar-danger');
        });
    }

    /**
     * Check if we are on a customized page for CSS.
     * @function providerCSS
     * @public
     * @param {String} uri ID to.
     */
    providerCSS(uri: string) {
        var todo: string;
        if(uri.match(/^facebook$/))
            todo = 'facebook';
        else if(uri.match(/whigi/))
            todo = 'localhost';
        if(!!todo)
            window.$('head').append('<link id="custom-css" rel="stylesheet" type="text/css" href="custom_css/' + todo + '.css">');
    }

    /**
     * Removes any custom CSS.
     * @function normalCSS
     * @public
     */
    normalCSS() {
        window.$('#custom-css').remove();
    }

}