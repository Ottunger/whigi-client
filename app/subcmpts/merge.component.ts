/**
 * Component to merge two users into one.
 * @module merge.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/merge.html';

@Component({
    selector: 'merge-account',
    template: template
})
export class Merge {

    public login: string;
    public password: string;
    public erase: boolean;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend App service.
     * @param auth Auth service.
     * @param dataservice Data service.
     * @param check Check service.
     * @param routed Activated route.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend, private auth: Auth,
        private dataservice: Data, private check: ApplicationRef, private routed: ActivatedRoute, private router: Router) {
        this.erase = false;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            if(!!params['mergeu'])
                self.login = params['mergeu'];
            else
                self.login = '';
            if(!!params['mergep'])
                self.password = params['mergep'];
            else
                self.password = '';
            if(!!params['mergeu'] && !!params['mergep'] && self.login != self.backend.profile._id) {
                if(window.confirm(this.translate.instant('merge.confirm') + self.login)) {
                    self.merge().then(function() {
                        self.router.navigate(['/generics', 'generics.profile']);
                    });
                } else {
                    //Fallback to a request
                    self.router.navigate(['/generics', 'generics.profile']);
                }
            } else {
                //Fallback to a request
                window.$('#ctn-merge').ready(function() {
                    window.$('#ctn-merge').css('display', 'block');
                });
            }
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
     * Merges another account.
     * @function merge
     * @public
     * @return {Promise} When done.
     */
    merge(): Promise {
        var self = this, fnew: boolean = true;
        var current = this.auth.getParams();
        this.backend.decryptMaster();
        var my_master = this.backend.master_key, my_id = this.backend.profile._id;

        return new Promise(function(resolve) {
            if(self.backend.profile._id.toLowerCase() == self.login.toLowerCase()) {
                self.login = '';
                self.password = '';
                self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noSelf'));
                resolve();
                return;
            }
            self.backend.forceReload();

            window.$('.imerging').removeClass('has-error');
            self.backend.createToken(self.login, self.password, false).then(function(ticket) {
                self.auth.switchLogin(self.login, ticket._id);
                self.dataservice.mPublic().then(function(profile) {
                    self.backend.profile = profile;
                    self.auth.regPuzzle(undefined, window.sha256(self.password + profile.salt));
                    
                    self.dataservice.listData(false).then(function() {
                        var array: {
                            mode: string,
                            name: string,
                            index: number,
                            is_dated: boolean,
                            shared_to: {[id: string]: string | {sa: string, ee: Date, trigger: string, links: string[]}},
                            version?: number,
                            decr_data?: string,
                            decr_aes?: number[],
                            is_bound?: boolean,
                            is_folder?: boolean
                        }[] = [], index = 0, mapping = {};
                        var datakeys = Object.getOwnPropertyNames(self.backend.profile.data);
                        for(var i = 0; i < datakeys.length; i++) {
                            if(datakeys[i].indexOf('keys/pwd/') != 0) {
                                array.push({
                                    mode: 'get',
                                    name: datakeys[i],
                                    index: 0,
                                    is_dated: self.backend.profile.data[datakeys[i]].is_dated,
                                    shared_to: self.backend.profile.data[datakeys[i]].shared_to,
                                });
                            }
                        }
                        //Manage UI
                        self.manageUI(true);
                        
                        function next() {
                            if(index < array.length) {
                                var work = array[index];
                                index++;
                                switch(work.mode) {
                                    case 'get':
                                        self.dataservice.getData(self.backend.profile.data[work.name].id, false).then(function(data) {
                                            work.mode = 'getVault',
                                            work.version = data.version;
                                            work.decr_data = data.decr_data;
                                            work.decr_aes = data.decr_aes;
                                            work.is_bound = data._id.indexOf('datafragment') == 0;
                                            work.is_folder = (!!self.backend.generics[work.name.replace(/\/[^\/]*$/, '')] && self.backend.generics[work.name.replace(/\/[^\/]*$/, '')][data.version].instantiable);
                                            array.push(work);
                                            next();
                                        }, function(e) {
                                            self.manageUI(false);
                                            self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                            self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                                        });
                                        break;
                                    case 'getVault':
                                        var keys = Object.getOwnPropertyNames(work.shared_to);
                                        if(keys.length > work.index) {
                                            var key = keys[work.index];
                                            self.backend.getAccessVault(<string>work.shared_to[key]).then(function(got) {
                                                function aget() {
                                                    work.shared_to[key] = {
                                                        sa: got.shared_as,
                                                        ee: new Date(got.expire_epoch),
                                                        trigger: got.trigger,
                                                        links: got.links
                                                    };
                                                    work.index++;
                                                    index--;
                                                    next();
                                                }
                                                self.backend.revokeVault(<string>work.shared_to[key]).then(aget, aget);
                                            }, function(e) {
                                                if(e.status == 417) {
                                                    work.index++;
                                                    index--;
                                                    next();
                                                } else {
                                                    self.manageUI(false);
                                                    self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                                    self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                                                }
                                            });
                                        } else {
                                            work.mode = 'new';
                                            array.push(work);
                                            next();
                                        }
                                        break;
                                    case 'new':
                                        function nnew() {
                                            self.dataservice.newData(work.is_bound, work.name, work.decr_data, work.is_dated, work.version, self.erase, undefined, false).then(function(naes: number[]) {
                                                work.mode = 'giveVault',
                                                work.index = 0;
                                                work.decr_aes = naes;
                                                array.push(work);
                                                next();
                                            }, function(e) {
                                                if(e[0] == 'exists') {
                                                    self.dataservice.getData(self.backend.profile.data[work.name].id, false).then(function(data) {
                                                        work.mode = 'giveVault',
                                                        work.index = 0;
                                                        work.decr_data = data.decr_data;
                                                        work.decr_aes = data.decr_aes;
                                                        work.version = data.version;
                                                        work.is_dated = data.is_dated;
                                                        array.push(work);
                                                        next();
                                                    }, function(e) {
                                                        self.manageUI(false);
                                                        self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                                        resolve();
                                                    });
                                                } else {
                                                    self.manageUI(false);
                                                    self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                                    resolve();
                                                }
                                            });
                                        }
                                        if(fnew) {
                                            fnew = false;
                                            self.backend.closeTo(my_id, my_master).then(function() {
                                                self.dataservice.reloadProfile(current[4], current[2], nnew, resolve);
                                            }, function(e) {
                                                self.manageUI(false);
                                                self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                                self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                                            });
                                        } else {
                                            nnew();
                                        }
                                        break;
                                    case 'giveVault':
                                        var keys = Object.getOwnPropertyNames(work.shared_to);
                                        if(keys.length > work.index) {
                                            var key = keys[work.index];
                                            self.dataservice.grantVault(key, (work.shared_to[key]).sa, work.name, work.decr_data, work.version, (work.shared_to[key]).ee,
                                                (work.shared_to[key]).trigger, false, work.decr_aes, false, (work.shared_to[key]).links).then(function() {
                                                work.index++;
                                                index--;
                                                next();
                                            }, function(e) {
                                                self.manageUI(false);
                                                self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                                resolve();
                                            });
                                        } else {
                                            next();
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            } else {
                                self.manageUI(false);
                                self.notif.success(self.translate.instant('success'), self.translate.instant('merge.merged'));
                                self.login = '';
                                self.password = '';
                                resolve();
                            }
                        }
                        next();
                    }, function(e) {
                        self.manageUI(false);
                        self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                        self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                        window.$('.imerging').addClass('has-error');
                    });
                }, function(e) {
                    self.manageUI(false);
                    self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                    self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                    window.$('.imerging').addClass('has-error');
                });
            }, function(e) {
                self.manageUI(false);
                self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                window.$('.imerging').addClass('has-error');
            });
        });
    }

    /**
     * Block UI.
     * @function manageUI
     * @private
     * @param {Boolean} on Toggle.
     */
    private manageUI(on: boolean) {
        this.backend.block_mask = !on;
        this.backend.block(on);
    }

}
