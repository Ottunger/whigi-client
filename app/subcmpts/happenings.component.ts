/**
 * Component displaying life events.
 * @module happenings.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/happenings.html';
import * as happenings from './templates/happenings.js';

@Component({
    template: template
})
export class Happenings {

    public ha;
    public new_names: {[id: string]: string};
    public new_datas: {[id: string]: {[id: string]: string}};
    public new_data: {[id: string]: string};
    public new_data_file: {[id: string]: string};
    public redir: {[id: string]: string};
    public doRedir: {[id: string]: boolean};
    public cstep: {[id :string]: number};
    private resets: {[id: string]: EventEmitter<any>};
    private works: {[id: string]: any[]};
    private onEid: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     */
    constructor(private backend: Backend, private router: Router, private notif: NotificationsService, private dataservice: Data) {
        this.new_names = {};
        this.new_data = {};
        this.new_data_file = {};
        this.new_datas = {};
        this.redir = {};
        this.doRedir = {};
        this.works = {};
        this.resets = {};
        this.cstep = {};
        this.onEid = true;

        this.ha = happenings.h;
        for(var i = 0; i < this.ha.length; i++) {
            this.works[this.ha[i].sid] = [];
            this.cstep[this.ha[i].sid] = this.ha[i].entryStep;
            for(var j = 0; j < this.ha[i].steps.length; j++) {
                this.resets[this.ha[i].sid + j + this.ha[i].steps[j].gen] = new EventEmitter<any>();
            }
        }
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        //Auto expand input_block
        window.$('.wigen2').ready(function() {
            window.$('.wigen2').click();
        });
        if(this.onEid && /eidok/.test(window.location.href)) {
            //Back from eID
            this.onEid = false;
            this.notif.success(this.backend.transform('success'), this.backend.transform('profile.eidRead'));
            try {
                var toreturn = JSON.parse(location.search.replace(/^.*=/, ''));
                if(toreturn.erase_name) {
                    self.dataservice.getData('profile/name', false, undefined, true).then(function(data) {
                        self.dataservice.newData(true, 'profile/name', JSON.stringify({
                            'generics.first_name': self.backend.profile.company_info.first_name,
                            'generics.last_name': self.backend.profile.company_info.last_name
                        }), false, 0, true, data.decr_aes).then(function() {
                            if(toreturn.erase_addr.substr(0, 2) != '<<') {
                                function complete(naes?: number[]) {
                                    naes = naes || self.backend.newAES();
                                    self.dataservice.newData(true, 'profile/address/' + toreturn.erase_addr, JSON.stringify({
                                        from: -2208992400000,
                                        value: self.backend.profile.company_info.address
                                    }), false, 0, true, naes).then(function() {}, function() {});
                                }
                                //Check if we have this address suitable
                                if(!!self.backend.profile.data['profile/address/' + toreturn.erase_addr]) {
                                    if(self.backend.profile.data['profile/address/' + toreturn.erase_addr].id.indexOf('datafragment') == 0) {
                                        self.dataservice.getData(self.backend.profile.data['profile/address/' + toreturn.erase_addr].id, false).then(function(data) {
                                            complete(data.decr_aes);
                                        }, function(e) {});
                                    } else {
                                        complete();
                                    }
                                }
                            }
                        }, function(e) {});
                    }, function(e) {});
                }
            } catch(e) {}
        }
    }

    /**
     * Register data from input_block.
     * @function regData
     * @public
     * @param {String} group Attached group.
     * @param {Object[]} Event.
     * @param {String} sid Soft ID of happening.
     * @param {Number} i Step.
     */
    regData(group: string, event: any[], sid: string, i: number) {
        switch(event[0]) {
            case 1:
                this.new_data[sid + i + group] = event[1];
                break;
            case 2:
                this.new_data_file[sid + i + group] = event[1];
                break;
            case 3:
                this.new_datas[sid + i + group] = event[1];
                break;
        }
        if(!!event[1] && !!window.$('#setname' + sid + i + this.dataservice.sanit(group)).length && window.$('#setname' + sid + i + this.dataservice.sanit(group)).length > 0) {
            this.new_names[sid + i + group] = event[1][window.$('#setname' + sid + i + this.dataservice.sanit(group)).attr('nwkey')];
            window.$('#setname' + sid + i + this.dataservice.sanit(group)).val(event[1][window.$('#setname' + sid + i + this.dataservice.sanit(group)).attr('nwkey')]);
        }
    }

    /**
     * Keys of data names known.
     * @function filters
     * @public
     * @param {String} folder to list.
     * @param {String} uid ID.
     * @return {Array} Known fields.
     */
    filters(folder: string, uid: string): string[] {
        var self = this;
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        }).filter(function(el: string): boolean {
            return el != self.new_names[uid + folder];  
        });
    }

    /**
     * Returns a name based on directory structure.
     * @function completeName
     * @private
     * @param {String} folders Folder name.
     * @param {String} name Orginal name.
     * @return {String} Describing name.
     */
    private completeName(folders: string, name: string): string {
        return folders + '/' + name.replace(/\//g, ':').substr(0, 63);
    } 

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {String} folder Folder name.
     * @param {String} fname New name of recorded file.
     * @param {Boolean} as_file Load from file.
     * @param {String} sid Soft happenings ID.
     * @param {Number} step Step.
     * @param {Number} next Next step.
     * @return {Boolean} Whether went OK.
     */
    register(folder: string, fname: string, as_file: boolean, sid: string, step: number, next: number): boolean {
        var self = this, send;
        var new_name = this.completeName(folder, fname);
        //Build and test
        window.$('.igen' + this.dataservice.sanit(sid + step + folder)).removeClass('whigi-error');
        send = this.dataservice.recGeneric(this.new_data[sid + step + folder], this.new_data_file[sid + step + folder], this.new_datas[sid + step + folder], folder, as_file);
        if(send.constructor === Array) {
            this.notif.error(this.backend.transform('error'), this.backend.transform(send[1]));
            for(var i = 2; i < send.length; i++)
                window.$('.igenfiner' + this.dataservice.sanit(sid + step + folder) + this.dataservice.sanit(send[i])).addClass('whigi-error');
            return false;
        }
        this.works[sid].push({
            mode: "creating",
            new_name: new_name,
            send: send,
            is_dated: this.backend.generics[folder][this.backend.generics[folder].length - 1].is_dated,
            version: this.backend.generics[folder].length - 1,
            fid: sid + step + folder,
            redir: !!this.doRedir[sid + step + folder] && !!this.redir[sid + step + folder],
            towards: this.redir[sid + step + folder]
        });
        this.cstep[sid] = next;

        self.doRedir[sid + step + folder] = false;
        delete self.redir[sid + step + folder];
        this.resets[sid + step + folder].emit();
        return true;
    }

    /**
     * Wrapper around process for display.
     * @function finish
     * @public
     * @param {String} sid Soft ID.
     */
    finish(sid: string) {
        var self = this;
        this.process(sid).then(function() {
            self.works[sid] = [];
            self.notif.success(self.backend.transform('success'), self.backend.transform('happenings.saved'));
        }, function(err) {
            self.works[sid] = [];
            if(err.constructor === Array && err[0] != 'server') {
                self.notif.error(self.backend.transform('error'), self.backend.transform('filesystem.exists'));
            } else {
                self.notif.error(self.backend.transform('error'), self.backend.transform('happenings.error'));
            }
        });
    }

    /**
     * Deals with grantings, etc.
     * @function process
     * @private
     * @param {String} sid Soft ID.
     * @return {Promise} When done.
     */
    private process(sid: string): Promise {
        var self = this, index = 0, array = this.works[sid];
        return new Promise(function(resolve, reject) {
            function next() {
                if(index < array.length) {
                    var work = array[index];
                    index++;
                    switch(work.mode) {
                        case 'creating':
                            function complete(force: boolean, decr_aes?: number[], decr_data?: string) {
                                if(force && work.is_dated) {
                                    //If we had the value and it is dated, we do not erase but rather add a new horology
                                    var sofar = JSON.parse(decr_data);
                                    sofar.push(JSON.parse(work.send)[0]);
                                    work.send = JSON.stringify(sofar.sort(function(a, b): number {return (a.from < b.from)? - 1 : 1;}));
                                }
                                self.dataservice.newData(true, work.new_name, work.send, work.is_dated, work.version, force, decr_aes).then(function(naes: number[]) {
                                    self.new_names[work.fid] = '';
                                    if(work.redir) {
                                        var keys = Object.getOwnPropertyNames(self.backend.profile.data[work.towards].shared_to), done = 0;
                                        function complete() {
                                            self.dataservice.listData(false).then(function() {
                                                next();
                                            });
                                        }
                                        keys.forEach(function(key) {
                                            self.backend.getAccessVault(self.backend.profile.data[work.towards].shared_to[key]).then(function(info) {
                                                self.dataservice.grantVault(self.backend.profile.data[work.towards].shared_to[key], info.shared_as, work.new_name, work.send, work.version,
                                                    new Date(info.expire_epoch), info.trigger, true, naes).then(function() {
                                                        done++;
                                                        if(done >= keys.length)
                                                            complete();
                                                    }, function(e) {
                                                        done++;
                                                        if(done >= keys.length)
                                                            complete();
                                                    });
                                            }, function(e) {
                                                done++;
                                                if(done >= keys.length)
                                                    complete();
                                            });
                                        });
                                        next();
                                    } else {
                                        next();
                                    }
                                }, function(e) {
                                    reject(e);
                                });
                            }
                            //Existed as bound?
                            if(!!self.backend.profile.data[work.new_name] && self.backend.profile.data[work.new_name].id.indexOf('datafragment') == 0) {
                                self.dataservice.getData(self.backend.profile.data[work.new_name].id).then(function(data) {
                                    complete(true, data.decr_aes, data.decr_data);
                                });
                            } else {
                                complete(false);
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
    
}
