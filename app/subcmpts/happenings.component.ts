/**
 * Component displaying life events.
 * @module happenings.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
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

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router,
        private notif: NotificationsService, private dataservice: Data) {
        this.new_names = {};
        this.new_data = {};
        this.new_data_file = {};
        this.new_datas = {};
        this.redir = {};
        this.doRedir = {};
        this.works = {};
        this.resets = {};
        this.cstep = {};

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
        //Auto expand input_block
        window.$('.wigen2').ready(function() {
            window.$('.wigen2').click();
        });
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
     * @return {Array} Known fields.
     */
    filters(folder: string): string[] {
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
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
        window.$('.igen' + this.dataservice.sanit(folder)).removeClass('has-error');
        window.$('#igen2' + this.dataservice.sanit(folder)).css('color', '');
        send = this.dataservice.recGeneric(this.new_data[sid + step + folder], this.new_data_file[sid + step + folder], this.new_datas[sid + step + folder], folder, as_file);
        if(send.constructor === Array) {
            this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
            window.$('.igen' + this.dataservice.sanit(folder)).addClass('has-error');
            window.$('#igen2' + this.dataservice.sanit(folder)).css('color', 'red');
            return false;
        }
        this.works[sid].push({
            mode: "creating",
            new_name: new_name,
            send: send,
            is_dated: this.backend.generics[folder][this.backend.generics[folder].length - 1].is_dated,
            version: this.backend.generics[folder].length - 1,
            fid: sid + step + folder,
            redir: !!this.doRedir[sid + step + folder] && this.redir[sid + step + folder],
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
            self.notif.success(self.translate.instant('success'), self.translate.instant('happenings.saved'));
        }, function(err) {
            self.works[sid] = [];
            if(err.constructor === Array && err[0] != 'server') {
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('happenings.error'));
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
                            self.dataservice.newData(true, work.new_name, work.send, work.is_dated, work.version).then(function(naes: number[]) {
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
