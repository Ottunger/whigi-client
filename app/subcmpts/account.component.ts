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

    public sec_key: string;
    public id_to: string;
    public data_list: string[];
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
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id_to = params['id_to'];
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            self.with_account = params['with_account'];
            self.trigger = (!!params['trigger'])? 
                window.decodeURIComponent(params['trigger']).replace(/:whigi_id:/g, self.backend.profile._id).replace(/:whigi_hidden_id:/g, self.backend.profile.hidden_id) : '';
            self.expire_epoch = (!!params['expire_epoch'])? new Date(parseInt(params['expire_epoch'])) : new Date(0);
            self.forever = parseInt(params['expire_epoch']) < (new Date).getTime();
            self.strangeEmail = (!!params['email'])? window.decodeURIComponent(params['email']) : '';
            self.sec_key = (!!params['sec_key'])? window.decodeURIComponent(params['sec_key']) : '';

            window.$('#pick3').ready(function() {
                window.$('#pick3').datetimepicker();
                window.$('#pick3').datetimepicker('date', window.moment(parseInt(params['expire_epoch'])));
            });
            
            //We prepare HTTPS
            if(!/^https/.test(self.return_url_ok)) {
                self.deny();
            }
            var parts = self.return_url_ok.split('https://');
            if(parts.length == 3) {
                self.return_url_ok = 'https://' + parts[1] + window.encodeURIComponent('https://' + parts[2]);
            }

            //List data
            self.dataservice.listData(false).then(function() {
                var all = true, more = [];
                self.data_list = (!!params['data_list'] && params['data_list'] != '-')? window.decodeURIComponent(params['data_list']).split('::') : [];
                //If we are asked for folders, go see what's underneath
                for(var i = 0; i < self.data_list.length; i++) {
                    if(self.data_list[i].charAt(self.data_list[i].length - 1) == '/') {
                        more = more.concat(self.backend.generics_trie.suggestions(self.data_list[i]));
                    }
                }
                self.data_list = self.data_list.concat(more).filter(function(el: string): boolean {
                    return el.charAt(el.length - 1) != '/';
                });
                self.data_list = (function(arr) {
                    var u = {}, a = [];
                    for(var i = 0, l = arr.length; i < l; ++i){
                        if(u.hasOwnProperty(arr[i])) {
                            continue;
                        }
                        a.push(arr[i]);
                        u[arr[i]] = 1;
                    }
                    return a;
                })(self.data_list);

                //Check if already granted
                for(var i = 0; i < self.data_list.length; i++) {
                    if((!(self.data_list[i] in self.backend.profile.data) || !(self.id_to in self.backend.profile.data[self.data_list[i]].shared_to)) && self.data_list[i] in self.backend.generics) {
                        if(self.backend.generics[self.data_list[i]][0].instantiable) {
                            var ret = self.backend.data_trie.suggestions(self.data_list[i] + '/', '/').filter(function(el: string): boolean {
                                return el.charAt(el.length - 1) != '/';
                            });
                            var nice = false;
                            for(var j = 0; j < ret.length; j++) {
                                if(ret[j] in self.backend.profile.data && self.id_to in self.backend.profile.data[ret[j]].shared_to) {
                                    nice = true;
                                    break;
                                }
                            }
                            if(!nice) {
                                all = false;
                                break;
                            }
                        } else {
                            all = false;
                            break;
                        }
                    }
                }
                if(all && (self.with_account == 'false' || ('keys/auth/' + self.id_to in self.backend.profile.data &&
                    self.id_to in self.backend.profile.data['keys/auth/' + self.id_to].shared_to))) {
                    self.ok();
                }
                //Fallback to a request
                window.$('#ctn-acc').ready(function() {
                    window.$('#ctn-acc').css('display', 'block');
                });
            }, function() {
                self.deny();
            });
            self.backend.getUser(self.id_to).then(function(user) {
                self.requester = user;
                if(self.strangeEmail == '')
                    self.dataservice.picts(user, 'pict-user');
                self.check.tick();
            }, function(e) {
                self.deny();
            });
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
        var self = this, saves: any[] = [], key = (this.sec_key != '')? this.sec_key : this.backend.generateRandomString(64);
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
            for(var i = 0; i < this.data_list.length; i++) {
                var adata = this.data_list[i];
                if(adata in this.backend.generics && ((!(adata in this.filter) && !(adata in this.backend.profile.data)) || (adata in this.filter && this.filter[adata] == '/new'))) {
                    //Build and test
                    window.$('#igen' + this.dataservice.sanit(adata)).removeClass('has-error');
                    var send = this.dataservice.recGeneric(this.new_data[adata], '', this.new_datas[adata], adata, false);
                    if(send.constructor === Array) {
                        this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
                        window.$('#igen' + this.dataservice.sanit(adata)).addClass('has-error');
                        return;
                    }
                    //Build name and create
                    var name = adata;
                    if(this.backend.generics[adata][this.backend.generics[adata].length - 1].instantiable) {
                        name += '/' + this.new_name[adata];
                    }
                    saves.push({
                        mode: 'new',
                        data: send,
                        name: name,
                        is_dated: this.backend.generics[adata][this.backend.generics[adata].length - 1].is_dated,
                        version: this.backend.generics[adata].length - 1,
                        force: false
                    });
                    saves.push({
                        mode: 'grant',
                        data: send,
                        to: this.id_to,
                        name: adata,
                        real_name: name,
                        until: this.expire_epoch,
                        version: this.backend.generics[adata].length - 1,
                        trigger: this.trigger
                    });
                } else if(adata in this.backend.generics) {
                    var name = adata;
                    if(this.backend.generics[adata][this.backend.generics[adata].length - 1].instantiable) {
                        name += '/' + this.filter[adata];
                    }
                    saves.push({
                        mode: 'get-and-grant',
                        to: this.id_to,
                        name: adata,
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
     * @return {Array} Known fields.
     */
    filters(folder: string): string[] {
        var ret = this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        }).concat(['/new']);

        if(!this.new_datas[folder] && !this.filter[folder]) {
            this.new_datas[folder] = {};
            this.filter[folder] = ret[0];
        }
        return ret;
    }

    /**
     * OK, which is a move and maybe some calls.
     * @function ok
     * @private
     */
    private ok() {
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

}
