/**
 * Component to ask for a remote account creation.
 * @module account.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/account.html';

@Component({
    template: template
})
export class Account implements OnInit, OnDestroy {

    public request: string;
    public sec_key: string;
    public id_to: string;
    public data_list_shared_as: string[][];
    public return_url_ok: string;
    public return_url_deny: string;
    public expire_epoch: Date;
    public requester: any;
    public new_data: {[id: string]: string};
    public new_datas: {[id: string]: {[id: string]: string}};
    public filter: {[id: string]: string};
    public new_name: {[id: string]: string};
    public forever: boolean;
    public trigger: string;
    public with_account: string;
    public strangeEmail: string;
    private unreqing: boolean;
    private cpar: any;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param backend Backend service.
     * @param data Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data, private check: ApplicationRef) {
        this.requester = {};
        this.new_data = {};
        this.new_datas = {};
        this.new_name = {};
        this.filter = {};
        this.strangeEmail = '';
        this.unreqing = false;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        this.sub = this.routed.params.subscribe(this.onRouting.bind(this));
    }

    /**
     * Called upon routing change.
     * @function onRouting
     * @private
     * @param {Object} params URI params.
     */
    private onRouting(params: any) {
        var self = this;
        this.data_list_shared_as = [];
        this.cpar = params;
        this.id_to = params['id_to'].split(':')[0];
        this.request = params['id_to'].split(':')[1];
        this.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
        this.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
        this.with_account = params['with_account'];
        this.trigger = (!!params['trigger'])? 
            window.decodeURIComponent(params['trigger']).replace(/:whigi_id:/g, this.backend.profile._id).replace(/:whigi_hidden_id:/g, this.backend.profile.hidden_id) : '';
        this.expire_epoch = (!!params['expire_epoch'])? new Date(parseInt(params['expire_epoch'])) : new Date(0);
        this.forever = parseInt(params['expire_epoch']) < (new Date).getTime();
        this.strangeEmail = (!!params['email'])? window.decodeURIComponent(params['email']) : '';
        this.sec_key = (!!params['sec_key'])? window.decodeURIComponent(params['sec_key']) : '';

        //First, check if we need to add 3rd party css
        this.dataservice.providerCSS(this.id_to);

        window.$('#pick3').ready(function() {
            window.$('#pick3').datetimepicker();
            window.$('#pick3').datetimepicker('date', window.moment(parseInt(params['expire_epoch'])));
        });
        
        //We prepare HTTPS
        if(!/^https/.test(this.return_url_ok)) {
            this.deny();
            return;
        }
        var parts = this.return_url_ok.split('https://');
        if(parts.length == 3) {
            this.return_url_ok = 'https://' + parts[1] + window.encodeURIComponent('https://' + parts[2]);
        }

        //List data
        this.dataservice.listData(false).then(function() {
            var more = [];
            var data_list = (!!params['data_list'] && params['data_list'] != '-')? window.decodeURIComponent(params['data_list']).split('::') : [];
            //If we are asked for folders, go see what's underneath
            for(var i = 0; i < data_list.length; i++) {
                if(data_list[i].charAt(data_list[i].length - 1) == '/') {
                    more = more.concat(self.backend.generics_trie.suggestions(data_list[i]));
                }
            }
            data_list = data_list.concat(more).filter(function(el: string): boolean {
                return el.charAt(el.length - 1) != '/';
            });
            //Keep only one instance if one is written twice
            data_list = (function(arr) {
                var u = {}, a = [];
                for(var i = 0, l = arr.length; i < l; ++i) {
                    if(u.hasOwnProperty(arr[i])) {
                        continue;
                    }
                    a.push(arr[i]);
                    u[arr[i]] = true;
                }
                return a;
            })(data_list);
            //Now separate in both required and where to share
            self.data_list_shared_as = data_list.map(function(el: string): string[] {
                var exp = el.split('//');
                if(exp.length == 1) {
                    return [el, el];
                } else {
                    return [exp[0], exp[1]];
                }
            });
            //Keep only the generics
            self.data_list_shared_as = self.data_list_shared_as.filter(function(el: string[]): boolean {
                return (el[0] in self.backend.generics) && !self.backend.generics[el[0]][self.backend.generics[el[0]].length - 1].has_requirements;
            });
            //Cannot register two under the same name
            if(new Set(self.data_list_shared_as.map(function(el: string[]): string {
                return el[1];
            })).size != self.data_list_shared_as.length) {
                self.deny();
                return;
            }

            //Now that we know what 3rd party wants, turn it into the required variables
            self.dataservice.filterKnown(self.data_list_shared_as, function(now: string[][], unreq: string[][], req: string[][]) {
                if(unreq.length > 0) {
                    //We miss some requirements!
                    self.data_list_shared_as = unreq;
                    self.unreqing = true;
                } else {
                    //We have all that is required, go on with turned values
                    self.data_list_shared_as = req.concat(now);
                    self.unreqing = false;
                }

                for(var i = 0; i < self.data_list_shared_as.length; i++) {
                    if(self.backend.generics[self.data_list_shared_as[i][0]][self.backend.generics[self.data_list_shared_as[i][0]].length - 1].instantiable) {
                        if(self.backend.generics[self.data_list_shared_as[i][0]][self.backend.generics[self.data_list_shared_as[i][0]].length - 1].new_keys_only) {
                            self.new_name[self.data_list_shared_as[i][0]] = self.backend.generics[self.data_list_shared_as[i][0]][self.backend.generics[self.data_list_shared_as[i][0]].length - 1].new_key[0].substr(4);
                        }
                    }
                }

                //Check if already granted
                var done = 0, len = self.data_list_shared_as.length;
                function fallback() {
                    //Fallback to a request
                    window.$('#ctn-acc').ready(function() {
                        window.$('#ctn-acc').css('display', 'block');
                    });
                }
                function tryMove() {
                    done++;
                    if(done >= len && (self.with_account == 'false' || ('keys/auth/' + self.id_to in self.backend.profile.data &&
                        self.id_to in self.backend.profile.data['keys/auth/' + self.id_to].shared_to))) {
                        self.ok();
                    } else if(done >= len) {
                        fallback();
                    }
                }
                self.data_list_shared_as.forEach(function(req: string[]) {
                    //A data to check...
                    if(req[0] in self.backend.generics && (!(req[0] in self.backend.profile.data) || !(self.id_to in self.backend.profile.data[req[0]].shared_to))) {
                        if(self.backend.generics[req[0]][0].instantiable) {
                            //Instances we have
                            var ret = self.backend.data_trie.suggestions(req[0] + '/', '/').filter(function(el: string): boolean {
                                return el.charAt(el.length - 1) != '/';
                            });
                            //Check each one, is it shared to the person, and under the correct name?
                            var nice = false, did = 0, todo = ret.length, answ = false;
                            function completeRound() {
                                did++;
                                if(nice || did >= todo) {
                                    if(answ)
                                        return;
                                    answ = true;
                                    if(nice) {
                                        tryMove();
                                    } else {
                                        fallback();
                                    }
                                }
                            }
                            ret.forEach(function(record) {
                                if(self.id_to in self.backend.profile.data[record].shared_to) {
                                    if(req[0] == req[1]) {
                                        nice = true;
                                        completeRound();
                                    } else {
                                        self.backend.getAccessVault(self.backend.profile.data[record].shared_to[self.id_to]).then(function(info) {
                                            if(info.shared_as == req[1]) {
                                                nice = true;
                                            }
                                            completeRound();
                                        }, function(e) {
                                            completeRound();
                                        });
                                    }
                                } else {
                                    completeRound();
                                }
                            });
                            if(todo == 0)
                                completeRound();
                        } else {
                            //Not instantiable, but we do not have it...
                            fallback();
                        }
                    } else {
                        //No need to check this one
                        tryMove();
                    }
                });
            });
        }, function() {
            self.deny();
        });
        this.backend.getUser(this.id_to).then(function(user) {
            self.requester = user;
            if(self.strangeEmail == '')
                self.dataservice.picts(user, 'pict-user');
            self.check.tick();
        }, function(e) {
            self.deny();
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    /**
     * Called once the user has selected whether to accept or deny.
     * @function finish
     * @public
     * @param {Boolean} ok True if create account.
     */
    finish(ok: boolean) {
        var self = this, saves: any[] = [], used = {}, key = (this.sec_key != '')? this.sec_key : this.backend.generateRandomString(64);
        if(ok) {
            if(!this.allFilled()) {
                this.notif.error(this.translate.instant('error'), this.translate.instant('account.fill'));
                return;
            }
            if(this.with_account != 'false' && (!self.backend.profile.data['keys/auth/' + this.id_to] || !self.backend.profile.data['keys/auth/' + this.id_to].shared_to[this.id_to])) {
                saves.push({
                    mode: 'new',
                    data: key,
                    name: 'keys/auth/' + this.id_to,
                    is_dated: false,
                    force: true,
                    version : 0
                });
                saves.push({
                    mode: 'grant',
                    data: key,
                    to: this.id_to,
                    name: 'keys/auth/' + this.id_to,
                    real_name: 'keys/auth/' + this.id_to,
                    until: new Date(0),
                    version: 0
                });
            }
            for(var i = 0; i < this.data_list_shared_as.length; i++) {
                var adata = this.data_list_shared_as[i];
                if(this.backend.generics[adata[0]][this.backend.generics[adata[0]].length - 1].share_as_folder) {
                    saves.push({
                        mode: 'build-and-grant',
                        to: this.id_to,
                        name: adata[0],
                        until: this.expire_epoch,
                        trigger: this.trigger
                    });
                } else if((!(adata[1] in this.filter) && !(adata[0] in this.backend.profile.data)) || (adata[1] in this.filter && this.filter[adata[1]] == '/new')) {
                    //Build and test
                    window.$('#igen' + this.dataservice.sanit(adata[1])).removeClass('has-error');
                    var send = this.dataservice.recGeneric(this.new_data[adata[1]], '', this.new_datas[adata[1]], adata[0], false);
                    if(send.constructor === Array) {
                        this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
                        window.$('#igen' + this.dataservice.sanit(adata[1])).addClass('has-error');
                        return;
                    }
                    //Build name
                    var name = adata[0];
                    if(this.backend.generics[adata[0]][this.backend.generics[adata[0]].length - 1].instantiable) {
                        name += '/' + this.new_name[adata[1]];
                    }
                    //Once only
                    if(name in used) {
                        this.notif.error(this.translate.instant('error'), this.translate.instant('account.twice'));
                        window.$('#igen' + this.dataservice.sanit(adata[1])).addClass('has-error');
                        return;
                    }
                    used[name] = true;
                    //Create
                    saves.push({
                        mode: 'new',
                        data: send,
                        name: name,
                        is_dated: this.backend.generics[adata[0]][this.backend.generics[adata[0]].length - 1].is_dated,
                        version: this.backend.generics[adata[0]].length - 1,
                        force: false
                    });
                    saves.push({
                        mode: 'grant',
                        data: send,
                        to: this.id_to,
                        name: adata[1],
                        real_name: name,
                        until: this.expire_epoch,
                        version: this.backend.generics[adata[0]].length - 1,
                        trigger: this.trigger
                    });
                } else {
                    //Build name
                    var name = adata[0];
                    if(this.backend.generics[adata[0]][this.backend.generics[adata[0]].length - 1].instantiable) {
                        name += '/' + this.filter[adata[1]];
                    }
                    //Once only
                    if(name in used) {
                        this.notif.error(this.translate.instant('error'), this.translate.instant('account.twice'));
                        window.$('#igen' + this.dataservice.sanit(adata[1])).addClass('has-error');
                        return;
                    }
                    used[name] = true;
                    //Get and grant
                    saves.push({
                        mode: 'get-and-grant',
                        to: this.id_to,
                        name: adata[1],
                        real_name: name,
                        until: this.expire_epoch,
                        trigger: this.trigger
                    });
                }
            }
            //End by calling process
            this.process(saves).then(function() {
                self.ok();
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('account.err'));
                window.setTimeout(function() {
                    self.deny();
                }, 1500);
            });
        } else {
            self.deny();
        }
    }

    /**
     * Deals with grantings, etc.
     * @function process
     * @private
     * @param {Object[]} array Tasks.
     * @return {Promise} When done.
     */
    private process(array: any[]): Promise {
        var self = this, index = 0;
        return new Promise(function(resolve, reject) {
            function next() {
                if(index < array.length) {
                    var work = array[index];
                    index++;
                    switch(work.mode) {
                        case 'new':
                            self.dataservice.newData(true, work.name, work.data, work.is_dated, work.version, work.force).then(function(naes: number[]) {
                                array[index].decr_aes = naes;
                                next();
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        case 'grant':
                            self.dataservice.grantVault(work.to, work.name, work.real_name, work.data, work.version, work.until, work.trigger, false, work.decr_aes).then(function() {
                                next();
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        case 'get-and-grant':
                            self.dataservice.getData(self.backend.profile.data[work.real_name].id).then(function(data) {
                                array.push({
                                    mode: 'grant',
                                    data: data.decr_data,
                                    to: work.to,
                                    name: work.name,
                                    real_name: work.real_name,
                                    until: work.until,
                                    trigger: work.trigger,
                                    version: data.version,
                                    decr_aes: data.decr_aes
                                });
                                next();
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        case 'build-and-grant':
                            if(work.name in self.backend.profile.data) {
                                array.push({
                                    mode: 'get-and-grant',
                                    to: work.to,
                                    name: work.name,
                                    real_name: work.name,
                                    until: work.until,
                                    trigger: work.trigger
                                });
                                next();
                            } else {
                                var naes = self.backend.newAES();
                                self.dataservice.newData(true, work.name, '{}', false, 0, true, naes).then(function() {
                                    array.push({
                                        mode: 'grant',
                                        data: '{}',
                                        to: work.to,
                                        name: work.name,
                                        real_name: work.name,
                                        until: work.until,
                                        trigger: work.trigger,
                                        version: 0,
                                        decr_aes: naes
                                    });
                                    next();
                                }, function(e) {
                                    reject(e);
                                });
                            }
                            break;
                        default:
                            break;
                    }
                } else {
                    resolve();
                }
            }
            next();
        });
    }

    /**
     * Register data from input_block.
     * @function regData
     * @public
     * @param {String} group Attached group.
     * @param {Object[]} Event.
     */
    regData(group: string, event: any[]) {
        switch(event[0]) {
            case 1:
                this.new_data[group] = event[1];
                break;
            case 2:
                this.new_data[group] = event[1];
                break;
            case 3:
                this.new_datas[group] = event[1];
                break;
        }
    }

    /**
     * Keys of data names known.
     * @function filters
     * @public
     * @param {String} folder to list.
     * @param {String} forName Name under which will be registered.
     * @return {Array} Known fields.
     */
    filters(folder: string, forName: string): string[] {
        var ret = this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        }).concat(['/new']);

        if(!this.new_datas[forName] && !this.filter[forName]) {
            this.new_datas[forName] = {};
            this.filter[forName] = ret[0];
        }
        return ret;
    }

    /**
     * OK, which is a move and maybe some calls.
     * @function ok
     * @private
     */
    private ok() {
        //If we were unreqing, now is the real deal
        if(this.unreqing) {
            this.onRouting(this.cpar);
            return;
        }
        //Quit, we've done everything
        if(typeof Android !== undefined) {
            try {
                Android.ok();
            } catch(e) {}
        } else if(typeof webkit !== undefined && !!webkit.messageHandlers) {
            try {
                webkit.messageHandlers.ok.postMessage();
            } catch(e) {}
        }
        if(this.strangeEmail != '') {
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            this.backend.forceReload();
            delete this.backend.profile;
        }
        if(this.with_account == 'flow') {
            var arr = this.return_url_ok.split('/');
            arr.shift();
            arr.shift();
            arr.shift();
            this.router.navigate(arr);
        } else {
            window.location.href = this.return_url_ok;
        }
    }

    /**
     * Deny, which is a move and maybe some calls.
     * @function deny
     * @private
     */
    private deny() {
        if(typeof Android !== undefined) {
            try {
                Android.deny();
            } catch(e) {}
        } else if(typeof webkit !== undefined && !!webkit.messageHandlers) {
            try {
                webkit.messageHandlers.deny.postMessage();
            } catch(e) {}
        }
        if(this.strangeEmail != '') {
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            this.backend.forceReload();
            delete this.backend.profile;
        }
        window.location.href = this.return_url_deny;
    }

    /**
     * Link to requester profile.
     * @function reqLink
     * @public
     * @return {String[]} Link.
     */
    reqLink(): string[] {
        return ['/user', window.encodeURIComponent(this.requester._id)];
    }

    /**
     * Check form completion.
     * @function allFilled
     * @public
     * @return {Boolean} Filled.
     */
    allFilled(): boolean {
        var obj = window.$('.grant-required'), ok = true;
        window.$('.panel-clearable').removeClass('panel-danger');
        for(var i = 0; i < obj.length; i++) {
            if(typeof window.$(obj[i]).val() === undefined || window.$(obj[i]).val() == '') {
                var ok = false;
                window.$(window.$(obj[i]).attr('data-forid')).addClass('panel-danger');
            }
        }
        return ok;
    }

    /**
     * Last part of name.
     * @function lightName
     * @public
     * @param {String} str Input.
     * @return {String} Name.
     */
    lightName(str: string): string {
        return str.replace(/[^\/]*\//g, '');
    }

}
