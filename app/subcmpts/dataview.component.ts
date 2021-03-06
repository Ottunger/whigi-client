/**
 * Component displaying a detailed view of a data.
 * @module dataview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, OnInit, OnDestroy, ApplicationRef, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';

@Component({
    templateUrl: './templates/dataview.html'
})
export class Dataview implements OnInit, OnDestroy {

    public data: any;
    public data_name: string;
    public decr_data: string;
    public new_id: string;
    public timings: {[id: string]: {la: Date, ee: Date, seen: boolean, ends: boolean, trigger: string, shared_as: string}};
    public is_dated: boolean;
    public is_storable: boolean;
    public new_trigger: string;
    public is_generic: boolean;
    public version: number;
    public gen_name: string;
    public filter: string;
    public backuri: string;
    public to_filesystem: boolean;
    public sharedVector: string[];
    public changed: EventEmitter<string>;
    public sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.=
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(public backend: Backend, public router: Router,
        public notif: NotificationsService, public routed: ActivatedRoute, public dataservice: Data, public check: ApplicationRef) {
        this.decr_data = '[]';
        this.is_generic = false;
        this.is_storable = false;
        this.timings = {};
        this.filter = '';
        this.version = 0;
        this.changed = new EventEmitter<string>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            //Use params.name as key
            self.data_name = window.decodeURIComponent(params['name']);
            if(!(self.data_name in self.backend.profile.data)) {
                self.back(true);
                return;
            }
            self.to_filesystem = params['to_filesystem'];
            self.is_dated = self.backend.profile.data[self.data_name].is_dated;
            self.backuri = (!!params['backuri'])? params['backuri'] : JSON.stringify(['/generics']);

            var keys = Object.getOwnPropertyNames(self.backend.profile.data[self.data_name].shared_to);
            keys.forEach(function(val) {
                self.backend.getAccessVault(self.backend.profile.data[self.data_name].shared_to[val]).then(function(got) {
                    self.timings[val] = {
                        la: new Date(parseInt(got.last_access)),
                        ee: new Date(parseInt(got.expire_epoch)),
                        seen: parseInt(got.last_access) > 0,
                        ends: parseInt(got.expire_epoch) > (new Date).getTime(),
                        trigger: got.trigger,
                        shared_as: got.shared_as
                    };
                }, function(e) {
                    delete self.backend.profile.data[self.data_name].shared_to[val];
                });
            });

            self.dataservice.getData(self.backend.profile.data[self.data_name].id, true, function(data) {
                return new Promise(function(resolve) {
                    self.version = data.version;
                    self.data = data;
                    if(!!self.backend.generics[self.data_name]) {
                        self.is_generic = true;
                        self.gen_name = self.data_name;
                        //Auto expand input_block
                        setTimeout(function() {
                            window.$('#igen2' + self.dataservice.sanit(self.gen_name)).click();
                        }, 0);
                    } else if(!!self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')] && self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')][self.version].instantiable) {
                        self.is_generic = true;
                        self.gen_name = self.data_name.replace(/\/[^\/]*$/, '');
                        //Auto expand input_block
                        setTimeout(function() {
                            window.$('#igen2' + self.dataservice.sanit(self.gen_name)).click();
                        }, 0);
                    }
                    resolve();
                });
            }).then(function(data) {
                self.decr_data = data.decr_data;
                self.changed.emit(self.decr_data);
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noData'));
            });
            window.$('#pick5').ready(function() {
                window.$('#pick5').datetimepicker();
                window.$('#pick5').datetimepicker('date', window.moment());
                window.$('#pick5').datetimepicker('options', {widgetPositioning: {vertical: 'bottom'}});
            });
            //Breadcrump
            window.$('#breadcrump').ready(function() {
                self.dataservice.ev.emit([self.data_name, false]);
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
     * Check if this data is shared.
     * @function shared
     * @public
     * @return {Boolean} shared or not.
     */
    shared(): boolean {
        return Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to).length != 0;
    }

    /**
     * Returns other possible values.
     * @function filters
     * @public
     * @return {String[]} Values.
     */
    filters(): string[] {
        var self = this;
        return this.backend.data_trie.suggestions(this.gen_name + '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/' && el != self.data_name;
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Modifies a data the way asked.
     * @function mod
     * @public
     * @param {String} replacement New value.
     */
    mod(replacement: string) {
        var self = this, names = this.sharedIds(), dict: {[id: string]: {date: Date, trigger: string, shared_as: string}} = {}
        for(var i = 0; i < names.length; i++) {
            if(!!this.timings[names[i]])
                dict[names[i]] = {date: this.timings[names[i]].ee, trigger: this.timings[names[i]].trigger, shared_as: this.timings[names[i]].shared_as};
        }
        this.dataservice.modifyData(this.data_name, replacement, this.is_dated, this.version, dict, (this.is_generic && this.data_name != this.gen_name), this.data.decr_aes).then(function() {
            self.decr_data = replacement;
            self.changed.emit(self.decr_data);
        }, function(err) {
            if(err[0] == 'server')
                if(err[1].status == 413)
                    self.notif.error(self.backend.transform('error'), self.backend.transform('tooLarge'));
                else
                    self.notif.error(self.backend.transform('error'), self.backend.transform('server'));
            else
                self.notif.error(self.backend.transform('error'), self.backend.transform('profile.exists'));
        });
    }

    /**
     * Removes a data.
     * @function remove
     * @public
     */
    remove() {
        var self = this;
        if(window.confirm(this.backend.transform('dataview.remove'))) {
            this.dataservice.remove(this.data_name).then(function() {
                self.back(false);
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('server'));
            });
        }
    }

    /**
     * Keys of shared people array, which are user id's.
     * @function sharedIds
     * @public
     * @return {Array} Known fields.
     */
    sharedIds(): string[] {
        var self = this;
        if(!this.backend.profile.data[this.data_name])
            return [];
        if(!!this.sharedVector)
            return this.sharedVector;
        var ret = Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to);
        ret.forEach(function(d) {
            var test = setInterval(function() {
                if(!!self.timings[d]) {
                    clearInterval(test);
                    window.$('#pick-id' + d).ready(function() {
                            window.$('#pick-id' + d).datetimepicker();
                            window.$('#pick-id' + d).datetimepicker('date', window.moment(self.timings[d].la.getTime()));
                    });
                    window.$('#pick-id2' + d).ready(function() {
                        window.$('#pick-id2' + d).datetimepicker();
                        window.$('#pick-id2' + d).datetimepicker('date', window.moment(self.timings[d].ee.getTime()));
                    });
                    self.backend.getUser(d).then(function(user) {
                        window.$('#pict__' + d).ready(function() {
                            if(!!user && !!user.company_info && !!user.company_info.picture)
                                window.$('#pict__' + d).attr('src', user.company_info.picture);
                            else
                                window.$('#pict__' + d).attr('src', 'assets/logo.png');
                        });
                    }, function(e) {
                        window.$('#pict__' + d).ready(function() {
                            window.$('#pict__' + d).attr('src', 'assets/logo.png');
                        });
                    });
                }
            }, 30);
        });
        this.sharedVector = ret;
        return ret;
    }

    /**
     * Back to profile.
     * @function back
     * @public
     * @param {Boolean} gen To generics page.
     */
    back(gen: boolean) {
        if(gen)
            this.router.navigate(['/generics']);
        else
            this.router.navigate(JSON.parse(this.backuri));
    }

    /**
     * Revoke an access.
     * @function revoke
     * @public
     * @param {String} shared_to_id Id of sharee.
     */
    revoke(shared_to_id: string) {
        var self = this;
        if(this.data_name.indexOf('keys/pwd/') == 0 && !window.confirm(this.backend.transform('dataview.revokeKey')))
            return;
        this.dataservice.revoke(this.data_name, shared_to_id).then(function() {
            delete self.sharedVector;
        }, function(e) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noRevoke'));
        });
    }

    /**
     * Transfers an access.
     * @function change
     * @public
     * @param {String} shared_to_id Id of sharee.
     */
    change(shared_to_id: string) {
        var self = this;
        this.backend.getAccessVault(this.backend.profile.data[this.data_name].shared_to[shared_to_id]).then(function(timer) {
            //Get other data and create its vault
            self.dataservice.getData(self.backend.profile.data[self.gen_name + '/' + self.filter].id).then(function(data) {
                self.dataservice.grantVault(shared_to_id, timer.shared_as, self.gen_name + '/' + self.filter, data.decr_data, self.version, new Date(timer.expire_epoch), timer.trigger, false, data.decr_aes).then(function() {
                    //Remove actual vault
                    delete self.backend.profile.data[self.data_name].shared_to[shared_to_id];
                    self.backend.my_shares[shared_to_id].splice(self.backend.my_shares[shared_to_id].indexOf(self.data_name), 1);
                    delete self.sharedVector;
                    //Housekeeping
                    self.backend.triggerVaults(self.gen_name + '/' + self.filter);
                    self.notif.success(self.backend.transform('success'), self.backend.transform('dataview.transferred'));
                }, function(e) {
                    self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noGrant'));
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noData'));
            });
        });
    }

    /**
     * Revoke all accesses.
     * @function revokeAll
     * @public
     */
    revokeAll() {
        var self = this, keys = Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to);
        keys.forEach(function(val) {
            self.dataservice.revoke(self.data_name, val).then(function() {
                delete self.sharedVector;
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noRevoke'));
            });
        });
    }

    /**
     * Register a new grant.
     * @function register
     * @public
     */
    register() {
        var self = this;
        var date: Date = window.$('#pick5').datetimepicker('date').toDate();
        this.dataservice.grantVault(this.new_id, this.data_name, this.data_name, this.decr_data, this.version, date, this.new_trigger, this.is_storable, this.data.decr_aes).then(function(more) {
            var user = more[0], id = more[1];
            self.timings[user._id] = {la: new Date(0), ee: date, seen: false,
                ends: date.getTime() > (new Date).getTime(), trigger: self.new_trigger, shared_as: self.data_name};
            self.new_id = '';
            self.is_storable = false;
            delete self.sharedVector;
        }, function() {
            self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noGrant'));
        });
    }

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }

    /**
     * Go to user page
     * @function user
     * @param {String} user The user.
     */
    user(user: string) {
        window.ngUserMove(user);
    }
    
}
