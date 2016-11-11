/**
 * Component displaying the generic block
 * @module generic_block.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, ApplicationRef, Input, Output, OnInit, EventEmitter} from '@angular/core';
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
    public data_list: string[];
    @Input() tsl: boolean;
    @Input() iclose: boolean;
    @Input() group: string;
    @Input() raw_list: string[];
    @Output() rm: EventEmitter<string>;
    private previews: {[id: string]: string};
    private asked: {[id: string]: number[] | boolean};
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
        this.rm = new EventEmitter<string>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        this.dataservice.filterKnown(this.raw_list, function(now) {
            self.data_list = now;
            for(var i = 0; i < self.data_list.length; i++) {
                self.new_datas[self.data_list[i]] = {};
                self.resets[self.data_list[i]] = new EventEmitter();
                if(self.backend.generics[self.data_list[i]][self.backend.generics[self.data_list[i]].length - 1].instantiable) {
                    if(self.backend.generics[self.data_list[i]][self.backend.generics[self.data_list[i]].length - 1].new_keys_only) {
                        self.ass_name[self.data_list[i]] = self.backend.generics[self.data_list[i]][self.backend.generics[self.data_list[i]].length - 1].new_key[0].substr(4);
                    }
                    var names = self.dataNames(self.data_list[i], 3);
                    for(var j = 0; j < names.length; j++)
                        self.resets[self.data_list[i] + '/' + names[j]] = new EventEmitter();
                }
            }
            if(self.iclose) {
                window.$('#apsablegen' + self.dataservice.sanit(self.group)).ready(function() {
                    window.$('#apsablegen' + self.dataservice.sanit(self.group)).css('display', 'none');
                    window.$('#apsablegen' + self.dataservice.sanit(self.group)).prev().find('a').toggleClass('expand');
                    window.$('#apsablegen' + self.dataservice.sanit(self.group)).prev().find('a').toggleClass('collapse');
                });
            }
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
     * Registers all entered inputs.
     * @function registerAll
     * @public
     * @param {Boolean} perf Do operation or check.
     * @return {Boolean} Doable.
     */
    registerAll(perf: boolean): boolean {
        var checks = window.$('.input-holder-' + this.dataservice.sanit(this.group));
        //If in edit mode, say we can save
        if(!!window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit').length && window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit').length != 0) {
            if(perf == false) {
                return false;
            } else {
                window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit').attr('disabled', false).click();
                return;
            }
        }
        //For adding data
        for(var i = 0; i < checks.length; i++) {
            var g = window.$(checks[i]).attr('data-g');
            if(this.backend.generics[g][this.backend.generics[g].length - 1].instantiable) {
                if(!!this.ass_name[g] && this.ass_name[g] != '') {
                    if(this.backend.generics[g][this.backend.generics[g].length - 1].mode == 'file' && !!this.new_data_file[g] && this.new_data_file[g] != '') {
                        if(!perf)
                            return false;
                        else
                            this.register(g, true, this.ass_name[g]);
                    } else if((!!this.new_data[g] && this.new_data[g] != '') || Object.getOwnPropertyNames(this.new_datas[g]).length > 0) {
                        if(!perf)
                            return false;
                        else
                            this.register(g, false, this.ass_name[g]);
                    }
                }
            } else {
                if(this.backend.generics[g][this.backend.generics[g].length - 1].mode == 'file' && !!this.new_data_file[g] && this.new_data_file[g] != '') {
                    if(!perf)
                        return false;
                    else
                        this.register(g, true);
                } else if((!!this.new_data[g] && this.new_data[g] != '') || Object.getOwnPropertyNames(this.new_datas[g]).length > 0) {
                    if(!perf)
                        return false;
                    else
                        this.register(g, false);
                }
            }
        }
        return true;
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
        new_name = new_name.substr(0, 63);
        //Build and test
        window.$('.igen' + this.dataservice.sanit(name) + ',#iname' + this.dataservice.sanit(name)).removeClass('has-error');
        window.$('#igen2' + this.dataservice.sanit(name + new_name)).css('color', '');
        send = this.dataservice.recGeneric(this.new_data[name], this.new_data_file[name], this.new_datas[name], name, as_file);
        if(send.constructor === Array) {
            if(send[1] != 'generics.silent')
                this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
            window.$('.igen' + this.dataservice.sanit(name)).addClass('has-error');
            window.$('#igen2' + this.dataservice.sanit(name + new_name)).css('color', 'red');
            return;
        }
        //Create it
        this.dataservice.newData(true, name + new_name, send, this.backend.generics[name][this.backend.generics[name].length - 1].is_dated, this.backend.generics[name].length - 1).then(function() {
            self.ass_name[name] = '';
            self.resets[name].emit();
            self.dataservice.filterKnown(self.raw_list, function(now) {
                self.data_list = now;
            });
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
        return this.backend.data_trie.suggestions(folder + '/', '/').reverse().filter(function(el: string): boolean {
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
        this.router.navigate(['/data', window.encodeURIComponent(name), {backuri: JSON.stringify(this.router.routerState.snapshot.url.split('/').map(window.decodeURIComponent))}]);
    }

    /**
     * Preview a non instatiable held data.
     * @function preview
     * @public
     * @param {String} name Data name.
     * @param {Boolean} keyded Whether JSON keyded.
     * @return {String} Decrypted data.
     */
    preview(name: string, keyded: boolean): string {
        var self = this;
        if(name in this.previews)
            return this.previews[name];
        if(name in this.asked)
            return '[]';
        this.asked[name] = true;
        this.dataservice.getData(this.backend.profile.data[name].id, false, function(data) {
            return new Promise(function(resolve) {
                self.asked[name] = data.decr_aes;
                resolve();
            });
        }).then(function(data) {
            if(self.backend.profile.data[name].is_dated) {
                self.previews[name] = JSON.parse(data.decr_data)[0].value;
            } else {
                self.previews[name] = data.decr_data;
            }
            if(keyded) {
                var obj = JSON.parse(self.previews[name]);
                var keys = Object.getOwnPropertyNames(obj);
                self.previews[name] = '';
                for(var i = 0; i < keys.length; i++) {
                    self.previews[name] += obj[keys[i]] + ' ';
                }
                self.previews[name].trim();
            }
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
     * Allows editing a name.
     * @function tgName
     * @public
     * @param {String} folder Generic folder.
     * @param {String} efix Previous name.
     */
    tgName(folder: string, efix: string) {
        var self = this;
        if(!window.$('#tgname' + this.dataservice.sanit(folder + '/' + efix)).hasClass('green')) {
            window.$('#tgname' + this.dataservice.sanit(folder + '/' + efix)).addClass('green').removeClass('btn-link');
            window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).attr('readonly', false).val('');
        } else {
            if(!window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).val() || window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).val() == '') {
                window.$('#tgname' + this.dataservice.sanit(folder + '/' + efix)).removeClass('green').addClass('btn-link');
                window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).attr('readonly', true).val(efix);
                return;
            }
            if((folder + '/' + window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).val()) in this.backend.profile.data)
                return;
            this.backend.rename(folder + '/' + efix, folder + '/' + window.$('#chgname' + this.dataservice.sanit(folder + '/' + efix)).val()).then(function() {
                window.$('#tgname' + self.dataservice.sanit(folder + '/' + efix)).removeClass('green').addClass('btn-link');
                window.$('#chgname' + self.dataservice.sanit(folder + '/' + efix)).attr('readonly', true);
                self.dataservice.listData(false);
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            });
        }
    }

    /**
     * Allows editing a data.
     * @function tgData
     * @public
     * @param {String} fname Full name.
     * @param {String} gname Generic underlying.
     */
    tgData(fname: string, gname: string) {
        var self = this;
        function allEmpty(): boolean {
            var keys = Object.getOwnPropertyNames(self.new_datas[gname]);
            for(var i = 0; i < keys.length ; i++)
                if(!!self.new_datas[gname][keys[i]] && self.new_datas[gname][keys[i]] != '')
                    return false;
            return true;
        }

        if(!window.$('#tgdata' + this.dataservice.sanit(fname)).hasClass('green')) {
            window.$('#tgdata' + this.dataservice.sanit(fname)).addClass('green in-edit').removeClass('btn-link').attr('disabled', true);
            window.$('#tgdisp' + this.dataservice.sanit(fname)).css('display', 'none');
            window.$('#tginput' + this.dataservice.sanit(fname)).css('display', 'block');
            window.$('#on-edit' + this.dataservice.sanit(fname)).addClass('keys' + this.dataservice.sanit(fname));
        } else {
            if((this.backend.generics[gname][this.backend.generics[gname].length - 1].mode != 'json_keys'
                && (!this.new_data[fname] || this.new_data[fname] == '') && (!this.new_data_file[fname] || this.new_data_file[fname] == '')) ||
                (this.backend.generics[gname][this.backend.generics[gname].length - 1].mode == 'json_keys' && allEmpty())) {
                window.$('#tgdata' + this.dataservice.sanit(fname)).removeClass('green in-edit').addClass('btn-link');
                window.$('#tginput' + this.dataservice.sanit(fname)).css('display', 'none');
                window.$('#tgdisp' + this.dataservice.sanit(fname)).css('display', 'block');
                window.$('#on-edit' + this.dataservice.sanit(fname)).css('display', 'none').removeClass('keys' + this.dataservice.sanit(fname));
                return;
            }
            //Build and test
            window.$('.iinput' + this.dataservice.sanit(fname)).removeClass('has-error');
            var send = this.dataservice.recGeneric(this.new_data[fname], this.new_data_file[fname], this.new_datas[fname], gname, this.backend.generics[gname][this.backend.generics[gname].length - 1].mode == 'file');
            if(send.constructor === Array) {
                this.notif.error(this.translate.instant('error'), this.translate.instant(send[1]));
                window.$('.iinput' + this.dataservice.sanit(fname)).addClass('has-error');
                return;
            }
            //Create it
            this.dataservice.modifyData(fname, send, false, this.backend.generics[gname].length - 1, {}, fname != gname, this.asked[fname]).then(function() {
                window.$('#tgdata' + self.dataservice.sanit(fname)).removeClass('green in-edit').addClass('btn-link');
                window.$('#tginput' + self.dataservice.sanit(fname)).css('display', 'none');
                window.$('#tgdisp' + self.dataservice.sanit(fname)).css('display', 'block');
                window.$('#on-edit' + self.dataservice.sanit(fname)).css('display', 'none').removeClass('keys' + self.dataservice.sanit(fname));
                if(self.backend.generics[gname][self.backend.generics[gname].length - 1].mode != 'json_keys' && self.backend.generics[gname][self.backend.generics[gname].length - 1].mode != 'file')
                    self.previews[fname] = send;
                else if(self.backend.generics[gname][self.backend.generics[gname].length - 1].mode == 'json_keys') {
                    delete self.asked[fname];
                    delete self.previews[fname];
                    self.preview(fname, true);
                }
                self.resets[fname].emit();
                self.dataservice.filterKnown(self.raw_list, function(now) {
                    self.data_list = now;
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            });
        }
    }

    /**
     * Removes a data.
     * @function remove
     * @public
     * @param {String} fn Full name.
     */
    remove(fn: string) {
        var self = this;
        if(window.confirm(this.translate.instant('dataview.remove'))) {
            this.dataservice.remove(fn).then(function() {}, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            });
        }
    }

    /**
     * Returns whether a data has shares.
     * @function hasShares
     * @public
     * @param {String} fn Full name.
     * @return If OK.
     */
    hasShares(fn: string): boolean {
        return Object.getOwnPropertyNames(this.backend.profile.data[fn].shared_to).length > 0;
    }

    /**
     * Cancel addings.
     * @function cancel
     * @public
     */
    cancel() {
        this.ass_name = {};
        var keys = Object.getOwnPropertyNames(this.resets);
        for(var j = 0; j < keys.length; j++)
            this.resets[keys[j]].emit();
    }

    /**
     * Removes a generic from the topo list.
     * @function deleteTopo
     * @public
     * @param {String} gen Generic to remove.
     */
    deleteTopo(gen: string) {
        var me = this.dataservice.m.holds[this.group].holds.indexOf(gen);
        this.dataservice.m.holds[this.group].holds.splice(me, 1);
        me = this.data_list.indexOf(gen);
        this.data_list.splice(me, 1);
        this.dataservice.warnM();
    }

}
