/**
 * Component displaying a detailed view of a data.
 * @module dataview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/dataview.html';

@Component({
    template: template
})
export class Dataview implements OnInit, OnDestroy {

    public data: any;
    public data_name: string;
    public decr_data: string;
    public new_datas: {[id: string]: string};
    public new_data: string;
    public new_data_file: string;
    public new_id: string;
    public timings: {[id: string]: {la: Date, ee: Date, seen: boolean, ends: boolean, trigger: string}};
    public is_dated: boolean;
    public is_storable: boolean;
    public new_trigger: string;
    public is_generic: boolean;
    public version: number;
    public gen_name: string;
    public filter: string;
    private backuri: string;
    private to_filesystem: boolean;
    private sharedVector: string[];
    private changed: EventEmitter<string>;
    private reset: EventEmitter<any>;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.=
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router,
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data, private check: ApplicationRef) {
        this.decr_data = '[]';
        this.new_data_file = '';
        this.is_generic = false;
        this.is_storable = false;
        this.timings = {};
        this.new_datas = {};
        this.filter = '';
        this.version = 0;
        this.changed = new EventEmitter<string>();
        this.reset = new EventEmitter<any>();
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
            self.to_filesystem = params['to_filesystem'];
            self.is_dated = self.backend.profile.data[self.data_name].is_dated;
            self.backuri = (!!params['backuri'])? params['backuri'] : JSON.stringify(['/filesystem', 'data', {folders: self.data_name.replace(/[^\/]+$/, '')}]);

            var keys = Object.getOwnPropertyNames(self.backend.profile.data[self.data_name].shared_to);
            keys.forEach(function(val) {
                self.backend.getAccessVault(self.backend.profile.data[self.data_name].shared_to[val]).then(function(got) {
                    self.timings[val] = {
                        la: new Date(parseInt(got.last_access)),
                        ee: new Date(parseInt(got.expire_epoch)),
                        seen: parseInt(got.last_access) > 0,
                        ends: parseInt(got.expire_epoch) > (new Date).getTime(),
                        trigger: got.trigger
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
                    } else if(!!self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')] && self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')][self.version].instantiable) {
                        self.is_generic = true;
                        self.gen_name = self.data_name.replace(/\/[^\/]*$/, '');
                    }
                    resolve();
                });
            }).then(function(data) {
                self.decr_data = data.decr_data;
                self.check.tick();
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
            });
            window.$('#pick4').ready(function() {
                window.$('#pick4').datetimepicker();
                window.$('#pick4').datetimepicker('date', window.moment());
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
     * Register data from input_block.
     * @function regData
     * @public
     * @param {String} group Attached group.
     * @param {Object[]} Event.
     */
    regData(event: any[]) {
        switch(event[0]) {
            case 1:
                this.new_data = event[1];
                break;
            case 2:
                this.new_data_file = event[1];
                break;
            case 3:
                this.new_datas = event[1];
                break;
        }
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
     * Modifies the data.
     * @function modify
     * @public
     */
    modify() {
        var replacement, done = false, err;
        window.$('.igen' + this.dataservice.sanit(this.gen_name)).removeClass('has-error');
        window.$('#igen2' + this.dataservice.sanit(this.gen_name)).css('color', '');
        if(this.is_generic && (err = this.dataservice.recGeneric(this.new_data, this.new_data_file, this.new_datas, this.gen_name, this.backend.generics[this.gen_name][this.version].mode == 'file')).constructor === Array) {
            this.notif.error(this.translate.instant('error'), this.translate.instant(err[1]));
            window.$('.igen' + this.dataservice.sanit(this.gen_name)).addClass('has-error');
            window.$('#igen2' + this.dataservice.sanit(this.gen_name)).css('color', 'red');
            return;
        }
        //Generic data, use what has been returned by recGeneric. If we are dated, sicard the date info.
        if(this.is_generic && this.backend.generics[this.gen_name][this.version].is_dated) {
            this.new_data = JSON.parse(err)[0].value;
        } else if(this.is_generic) {
            this.new_data = err;
        }
        //Add the date info
        if(this.is_dated) {
            var from = window.$('#pick4').datetimepicker('date').toDate().getTime();
            replacement = JSON.parse(this.decr_data) || [];
            for(var i = 0; i < replacement.length; i++) {
                if(from > replacement[i].from) {
                    replacement.splice(i, 0, {
                        from: from,
                        value: (!!this.new_data_file && this.new_data_file != '')? this.new_data_file : this.new_data
                    });
                    done = true;
                    break;
                }
            }
            if(!done) {
                replacement.push({
                    from: from,
                    value: (!!this.new_data_file && this.new_data_file != '')? this.new_data_file : this.new_data
                });
            }
            replacement = JSON.stringify(replacement);
        } else {
            replacement = (!!this.new_data_file && this.new_data_file != '')? this.new_data_file : this.new_data.trim();
        }
        this.reset.emit();
        this.mod(replacement);
    }

    /**
     * Modifies a data the way asked.
     * @function mod
     * @private
     * @param {String} replacement New value.
     */
    private mod(replacement: string) {
        var self = this, names = this.sharedIds(), dict: {[id: string]: {date: Date, trigger: string}} = {}
        for(var i = 0; i < names.length; i++) {
            if(!!this.timings[names[i]])
                dict[names[i]] = {date: this.timings[names[i]].ee, trigger: this.timings[names[i]].trigger};
        }
        this.dataservice.modifyData(this.data_name, replacement, this.is_dated, this.version, dict, (this.is_generic && this.data_name != this.gen_name), this.data.decr_aes).then(function() {
            self.decr_data = replacement;
            self.changed.emit(self.decr_data);
        }, function(err) {
            if(err[0] == 'server')
                if(err[1].status == 413)
                    self.notif.error(self.translate.instant('error'), self.translate.instant('tooLarge'));
                else
                    self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.exists'));
        });
    }

    /**
     * Removes a data.
     * @function remove
     * @public
     */
    remove() {
        var self = this;
        if(window.confirm(this.translate.instant('dataview.remove'))) {
            this.dataservice.remove(this.data_name).then(function() {
                self.back(false);
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
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
        if(this.data_name.indexOf('keys/pwd/') == 0 && !window.confirm(this.translate.instant('dataview.revokeKey')))
            return;
        this.dataservice.revoke(this.data_name, shared_to_id).then(function() {
            delete self.sharedVector;
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
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
                self.dataservice.grantVault(shared_to_id, self.gen_name, self.gen_name + '/' + self.filter, data.decr_data, self.version, new Date(timer.expire_epoch), timer.trigger, false, data.decr_aes).then(function() {
                    //Remove actual vault
                    delete self.backend.profile.data[self.data_name].shared_to[shared_to_id];
                    self.backend.my_shares[shared_to_id].splice(self.backend.my_shares[shared_to_id].indexOf(self.data_name), 1);
                    delete self.sharedVector;
                    //Housekeeping
                    self.backend.triggerVaults(self.gen_name + '/' + self.filter);
                    self.notif.success(self.translate.instant('success'), self.translate.instant('dataview.transferred'));
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noGrant'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
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
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
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
        this.dataservice.grantVault(this.new_id, this.data_name, this.data_name, this.decr_data, this.version, date, this.new_trigger, this.is_storable, this.data.decr_aes).then(function(user, id) {
            self.timings[user._id] = {la: new Date(0), ee: date, seen: false,
                ends: date.getTime() > (new Date).getTime(), trigger: self.new_trigger};
            self.new_id = '';
            self.is_storable = false;
            delete self.sharedVector;
        }, function() {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noGrant'));
        });
    }

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            if(/^data:;base64,/.test(r.result))
                self.new_data_file = atob(r.result.split(',')[1]);
            else
                self.new_data_file = r.result;
            window.$('.load-button').removeClass('default').addClass('green');
        }
        r.readAsDataURL(file);
    }

    /**
     * Undo file loading.
     * @function undoLoad
     * @public
     */
    undoLoad() {
        this.new_data_file = '';
        window.$('.load-button').addClass('default').removeClass('green');
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
