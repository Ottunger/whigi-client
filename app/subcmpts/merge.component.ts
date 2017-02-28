/**
 * Component to merge two users into one.
 * @module merge.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, Input, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';

@Component({
    selector: 'merge-account',
    templateUrl: './templates/merge.html'
})
export class Merge {

    public login: string;
    public password: string;
    public erase: boolean;
    public sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param notif Notification service.
     * @param backend App service.
     * @param auth Auth service.
     * @param dataservice Data service.
     * @param check Check service.
     * @param routed Activated route.
     * @param router Routing service.
     */
    constructor(public notif: NotificationsService, public backend: Backend, public auth: Auth,
        public dataservice: Data, public check: ApplicationRef, public routed: ActivatedRoute, public router: Router) {
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
                self.login = ' ';
            if(!!params['mergep'])
                self.password = params['mergep'];
            else
                self.password = '';
            if(!!params['mergeu'] && !!params['mergep'] && self.login != self.backend.profile._id) {
                if(window.confirm(this.backend.transform('merge.confirm') + self.login)) {
                    self.merge().then(function() {
                        if(!params['return']) {
                            self.router.navigate(['/generics', 'generics.profile']);
                        } else {
                            window.location.href = window.decodeURIComponent(params['return']);
                        }
                    }, function(e) {
                        setTimeout(function() {
                            //Fallback to moving
                            self.router.navigate(['/generics', 'generics.profile']);
                        }, 1500);
                    });
                } else {
                    //Fallback to moving
                    self.router.navigate(['/generics', 'generics.profile']);
                }
            } else {
                //Fallback to a request
                window.$('#ctn-merge').ready(function() {
                    window.$('#ctn-merge').css('display', 'block');
                    setTimeout(function() {
                        self.login = ' ';
                        self.password = '';
                    }, 0);
                });
            }
        });
    }

    /**
     * Destroys the account...
     * @function oblit
     * @public
     */
    oblit() {
        var self = this;
        this.backend.oblit().then(function() {
            self.auth.deleteUid(undefined, true);
            self.backend.forceReload();
            delete self.backend.profile;
            self.dataservice.navigate(self.router, ['/']);
        }, function(e) {});
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    /**
     * Merges another account.
     * @function merge
     * @public
     * @return {Promise} When done.
     */
    merge(): Promise<undefined> {
        var self = this;
        this.login = this.login.replace(/ /g, '');
        return new Promise(function(resolve, reject) {
            self.backend.canClose(self.login).then(function() {
                self.doMerge().then(function() {
                    resolve();
                }, function(e) {
                    reject(e);
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noSelf'));
                reject();
            });
        });
    }

    /**
     * Merges another account.
     * @function doMerge
     * @public
     * @return {Promise} When done.
     */
    doMerge(): Promise<undefined> {
        var self = this, fnew: boolean = true;
        var current = this.auth.getParams();
        this.backend.decryptMaster();
        var my_master = this.backend.master_key, my_id = this.backend.profile._id;

        return new Promise(function(resolve) {
            if(self.backend.profile._id.toLowerCase() == self.login.toLowerCase()) {
                self.login = '';
                self.password = '';
                self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noSelf'));
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
                        
                        function nnew(work: any) {
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
                                        self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                                        resolve();
                                    });
                                } else {
                                    self.manageUI(false);
                                    self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                                    resolve();
                                }
                            });
                        }
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
                                            self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
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
                                                    self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
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
                                        if(fnew) {
                                            fnew = false;
                                            self.backend.closeTo(my_id, my_master).then(function() {
                                                self.dataservice.reloadProfile(current[4], current[2], nnew.bind(this, work), resolve);
                                            }, function(e) {
                                                self.manageUI(false);
                                                self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                                                self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                                            });
                                        } else {
                                            nnew(work);
                                        }
                                        break;
                                    case 'giveVault':
                                        var keys = Object.getOwnPropertyNames(work.shared_to);
                                        if(keys.length > work.index) {
                                            var key = keys[work.index];
                                            self.dataservice.grantVault(key, (<any>work.shared_to[key]).sa, work.name, work.decr_data, work.version, (<any>work.shared_to[key]).ee,
                                                (<any>work.shared_to[key]).trigger, false, work.decr_aes, false, (<any>work.shared_to[key]).links).then(function() {
                                                work.index++;
                                                index--;
                                                next();
                                            }, function(e) {
                                                self.manageUI(false);
                                                self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                                                resolve();
                                            });
                                        } else {
                                            //Need to trigger the trigger to make any update
                                            self.backend.triggerVaults(work.name).then(function() {}, function(e) {});
                                            next();
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            } else {
                                self.manageUI(false);
                                self.notif.success(self.backend.transform('success'), self.backend.transform('merge.merged'));
                                self.login = '';
                                self.password = '';
                                resolve();
                            }
                        }
                        next();
                    }, function(e) {
                        self.manageUI(false);
                        self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                        self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                        window.$('.imerging').addClass('has-error');
                    });
                }, function(e) {
                    self.manageUI(false);
                    self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
                    self.dataservice.reloadProfile(current[4], current[2], resolve, resolve);
                    window.$('.imerging').addClass('has-error');
                });
            }, function(e) {
                self.manageUI(false);
                self.notif.error(self.backend.transform('error'), self.backend.transform('merge.noMerge'));
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
