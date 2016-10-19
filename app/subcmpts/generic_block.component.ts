/**
 * Component displaying the generic block
 * @module generic_block.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, ApplicationRef, Input, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/generic_block.html';

@Component({
    selector: 'generic_block',
    template: template
})
export class GenericBlock implements OnInit {

    public ass_name: {[id: string]: string};
    public new_data: {[id: string]: string};
    public new_datas: {[id: string]: {[id: string]: string}};
    public new_data_file: {[id: string]: string};
    @Input() group: string;
    @Input() data_list: string[];
    private previews: {[id: string]: string};
    private asked: {[id: string]: boolean};
    private resets: {[id: string]: EventEmitter<any>}

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private notif: NotificationsService,
        private dataservice: Data, private check: ApplicationRef, private router: Router) {
        this.ass_name = {};
        this.new_data = {};
        this.new_datas = {};
        this.new_data_file = {};
        this.previews = {};
        this.asked = {};
        this.resets = {};
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        for(var i = 0; i < this.data_list.length; i++) {
            this.new_datas[this.data_list[i]] = {};
            this.resets[this.data_list[i]] = new EventEmitter();
        }
        if(this.group.indexOf('none', this.group.length - 4) != -1) {
            window.$('#apsablegen' + this.dataservice.sanit(this.group)).ready(function() {
                window.$('#apsablegen' + self.dataservice.sanit(self.group)).css('display', 'none');
                window.$('#apsablegen' + self.dataservice.sanit(self.group)).prev().find('a').toggleClass('expand');
                window.$('#apsablegen' + self.dataservice.sanit(self.group)).prev().find('a').toggleClass('collapse');
            });
        }
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
     * Registers all entered inputs.
     * @function registerAll
     * @public
     */
    registerAll() {
        var self = this;
        window.$('.input-holder-' + this.dataservice.sanit(this.group)).each(function(index, el) {
            var g = window.$(this).attr('data-g');
            if(self.backend.generics[g][self.backend.generics[g].length - 1].instantiable) {
                if(!!self.ass_name[g] && self.ass_name[g] != '') {
                    if(self.backend.generics[g][self.backend.generics[g].length - 1].mode == 'file' && !!self.new_data_file[g] && self.new_data_file[g] != '') {
                        self.register(g, true, self.ass_name[g]);
                    } else if((!!self.new_data[g] && self.new_data[g] != '') || Object.getOwnPropertyNames(self.new_datas[g]).length > 0) {
                        self.register(g, false, self.ass_name[g]);
                    }
                }
            } else {
                if(self.backend.generics[g][self.backend.generics[g].length - 1].mode == 'file' && !!self.new_data_file[g] && self.new_data_file[g] != '') {
                    self.register(g, true);
                } else if((!!self.new_data[g] && self.new_data[g] != '') || Object.getOwnPropertyNames(self.new_datas[g]).length > 0) {
                    self.register(g, false);
                }
            }
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {String} name Name of recorded file.
     * @param {Boolean} as_file Load from file.
     * @param {String} new_name Subfolder name for foldered data.
     */
    register(name: string, as_file: boolean, new_name?: string) {
        var self = this, send;
        new_name = (!!new_name)? ('/' + new_name.replace('/', ':')) : '';
        //Build and test
        window.$('#igen' + this.dataservice.sanit(name) + ',#iname' + this.dataservice.sanit(name)).removeClass('has-error');
        send = this.dataservice.recGeneric(this.new_data[name], this.new_data_file[name], this.new_datas[name], name, as_file);
        if(send.constructor === Array) {
            this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
            window.$('#igen' + this.dataservice.sanit(name)).addClass('has-error');
            return;
        }
        //Create it
        this.dataservice.newData(true, name + new_name, send, this.backend.generics[name][this.backend.generics[name].length - 1].is_dated, this.backend.generics[name].length - 1).then(function() {
            self.ass_name[name] = '';
            self.resets[name].emit();
        }, function(err) {
            if(err[0] == 'server') {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
                window.$('#iname' + self.dataservice.sanit(name)).addClass('has-error');
            }
        });
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @param {String} folder to list.
     * @param {Number} nn Max values to return.
     * @return {Array} Known fields.
     */
    dataNames(folder: string, nn: number): string[] {
        var i = 0;
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            if(el.charAt(el.length - 1) != '/' && i++ < nn)
                return true;
            return false;
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Navigate to details panel.
     * @function select
     * @public
     * @param {String} name Name of data.
     */
    select(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(name)]);
    }

    /**
     * Preview a non instatiable held data.
     * @function preview
     * @public
     * @param {String} name Data name.
     * @return {String} Decrypted data.
     */
    preview(name: string): string {
        var self = this;
        if(name in this.previews)
            return this.previews[name];
        if(name in this.asked)
            return '[]';
        this.asked[name] = true;
        this.dataservice.getData(this.backend.profile.data[name].id, false).then(function(data) {
            if(self.backend.profile.data[name].is_dated) {
                self.previews[name] = JSON.parse(data.decr_data)[0].value;
            } else {
                self.previews[name] = data.decr_data;
            }
            delete self.asked[name];
            self.check.tick();
        }, function(e) {
            self.previews[name] = '[]';
            delete self.asked[name];
        });
    }

    /**
     * Do the collapse when entering input.
     * @function doCollapse
     * @param {String} g Profile.
     * @param {Boolean} ok Whether to not do.
     */
    doCollapse(g: string, ok: boolean) {
        var self = this;
        if(!ok)
            return;
        setImmediate(function() {
            if(!!self.ass_name[g] && self.ass_name[g] != '') {
                window.$('.json' + self.dataservice.sanit(g)).css('display', 'block');
                window.$('.keys' + self.dataservice.sanit(g)).css('display', (window.innerWidth > 991)? 'block' : 'none');
            } else {
                window.$('.json' + self.dataservice.sanit(g)).css('display', 'none');
                window.$('.keys' + self.dataservice.sanit(g)).css('display', 'none');
            }
        });
    }

    /**
     * Cancel.
     * @function cancel
     * @public
     */
    cancel() {
        this.ass_name = {};
        this.new_data = {};
        this.new_data_file = {};
        for(var i = 0; i < this.data_list.length; i++) {
            var keys = Object.getOwnPropertyNames(this.new_datas[this.data_list[i]]);
            for(var j = 0; j < keys.length; j++)
                this.new_datas[this.data_list[i]][keys[j]] = '';
        }
    }

}
