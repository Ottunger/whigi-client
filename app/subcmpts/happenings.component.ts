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

@Component({
    template: template
})
export class Happenings {

    public new_names: {[id: string]: string};
    public new_datas: {[id: string]: {[id: string]: string}};
    public new_data: {[id: string]: string};
    public new_data_file: {[id: string]: string};
    public redir: {[id: string]: string};
    private resets: {[id: string]: EventEmitter<any>};

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
        this.resets = {
            'profile/address': new EventEmitter<any>()
        };
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        //Auto expand input_block
        window.$('#igen2profile_address').ready(function() {
            window.$('#igen2profile_address').click();
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
                this.new_data_file[group] = event[1];
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
     * @param {Boolean} redir Do a redirection afterwards.
     * @param {String} towards What share to steal users from.
     */
    register(folder: string, fname: string, as_file: boolean, redir: boolean, towards: string) {
        var self = this, send;
        var new_name = this.completeName(folder, fname);
        //Build and test
        window.$('.igen' + this.dataservice.sanit(folder)).removeClass('has-error');
        window.$('#igen2' + this.dataservice.sanit(folder)).css('color', '');
        send = this.dataservice.recGeneric(this.new_data[folder], this.new_data_file[folder], this.new_datas[folder], folder, as_file);
        if(send.constructor === Array) {
            this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
            window.$('.igen' + this.dataservice.sanit(folder)).addClass('has-error');
            window.$('#igen2' + this.dataservice.sanit(folder)).css('color', 'red');
            return;
        }
        //Create it
        this.dataservice.newData(true, new_name, send, this.backend.generics[folder][this.backend.generics[folder].length - 1].is_dated, this.backend.generics[folder].length - 1).then(function(naes: number[]) {
            self.new_names[folder] = '';
            self.resets[folder].emit();
            if(redir) {
                var keys = Object.getOwnPropertyNames(self.backend.profile.data[towards].shared_to), done = 0;
                function complete() {
                    self.dataservice.listData(false).then(function() {
                        self.notif.success(self.translate.instant('success'), self.translate.instant('happenings.saved'));
                    });
                }
                keys.forEach(function(key) {
                    self.backend.getAccessVault(self.backend.profile.data[towards].shared_to[key]).then(function(info) {
                        self.dataservice.grantVault(self.backend.profile.data[towards].shared_to[key], folder, new_name, send, this.backend.generics[folder].length - 1,
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
                if(keys.length == 0) {
                    self.notif.success(self.translate.instant('success'), self.translate.instant('happenings.saved'));
                }
            } else {
                self.notif.success(self.translate.instant('success'), self.translate.instant('happenings.saved'));
            }
        }, function(err) {
            if(err[0] == 'server') {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
                window.$('.igen' + this.dataservice.sanit(folder)).addClass('has-error');
            }
        });
    }
    
}
