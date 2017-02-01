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

    public foranew: {[id: string]: string};
    public writing: boolean;
    public sincefrom: {[id: string]: {min: number, max: number, act: number}};
    public cached: {[id: string]: any};
    public changing: boolean;
    public ass_name: {[id: string]: string};
    public new_data: {[id: string]: string};
    public new_datas: {[id: string]: {[id: string]: string}};
    public new_data_file: {[id: string]: string};
    public data_list: string[];
    public toview: string;
    public offsets: {[id: string]: number};
    public marked: {[id: string]: boolean};
    @Input() tsl: boolean;
    @Input() iclose: boolean;
    @Input() group: string;
    @Input() raw_list: string[];
    @Output() rm: EventEmitter<string>;
    private inreg: boolean;
    private previews: {[id: string]: string[]};
    private asked: {[id: string]: boolean};
    private resets: {[id: string]: EventEmitter<any>}
    private rstCsv: EventEmitter<any>;

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
        this.cached = {};
        this.sincefrom = {};
        this.foranew = {};
        this.offsets = {};
        this.marked = {};
        this.changing = false;
        this.inreg = false;
        this.writing = false;
        this.toview = '[]';
        this.rm = new EventEmitter<string>();
        this.rstCsv = new EventEmitter<any>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        this.dataservice.filterKnown(this.raw_list.map(function(el) { return [el, el]; }), function(now: string[][]) {
            self.data_list = now.map(function(el) { return el[0]; });
            self.popList();
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
     * Populates our lists.
     * @function popList
     * @private
     */
    private popList() {
        for(var i = 0; i < this.data_list.length; i++) {
            this.new_datas[this.data_list[i]] = {};
            if(!this.resets[this.data_list[i]]) {
                this.resets[this.data_list[i]] = new EventEmitter();
                var arr = this.backend.generics[this.data_list[i]][this.backend.generics[this.data_list[i]].length - 1].new_key || [];
                for(var j = 0; j < arr.length; j++) {
                    var check = this.translate.instant(arr[j]);
                    if(!this.backend.data_trie.has(this.data_list[i] + '/' + check)) {
                        this.ass_name[this.data_list[i]] = check;
                        break;
                    }
                }
            }
            if(this.backend.generics[this.data_list[i]][this.backend.generics[this.data_list[i]].length - 1].instantiable) {
                if(this.backend.generics[this.data_list[i]][this.backend.generics[this.data_list[i]].length - 1].new_keys_only) {
                    this.ass_name[this.data_list[i]] = this.backend.generics[this.data_list[i]][this.backend.generics[this.data_list[i]].length - 1].new_key[0].substr(4);
                }
                var names = this.dataNames(this.data_list[i], 3);
                for(var j = 0; j < names.length; j++)
                    if(!this.resets[this.data_list[i] + '/' + names[j]])
                        this.resets[this.data_list[i] + '/' + names[j]] = new EventEmitter();
            }
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
        var self = this;
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
        if(!!event[1] && !!window.$('#setname' + this.dataservice.sanit(group)).length && window.$('#setname' + this.dataservice.sanit(group)).length > 0) {
            this.ass_name[window.$('#setname' + this.dataservice.sanit(group)).attr('g')] = event[1][window.$('#setname' + this.dataservice.sanit(group)).attr('nwkey')];
            window.$('#setname' + this.dataservice.sanit(group)).val(event[1][window.$('#setname' + this.dataservice.sanit(group)).attr('nwkey')]);
        }
        setImmediate(function() {
            self.check.tick();
        });
    }

    /**
     * Background of date pickers.
     * @function bkDaters
     * @public
     * @param {String} fname Who to check.
     * @return {String} Style.
     */
    bkDaters(fname: string): string {
        var div = window.$('#sincefrom' + this.dataservice.sanit(fname));
        var val = div.find('input').val();
        return (val == '01/01/1900 00:00' || val == '01/01/1900')? '#f3fdc6' : '#fff';
    }

    /**
     * Registers all entered inputs.
     * @function registerAll
     * @public
     */
    registerAll() {
        var self = this, objs, toclick: any[] = [], work: any[] = [];
        function complete(single: boolean) {
            function end() {
                //Can redo things
                self.inreg = false;
                window.$('#apsablegen' + self.dataservice.sanit(self.group)).find('.in-edit').attr('disabled', false);
                function doClick(idx: number) {
                    if(idx < toclick.length) {
                        if(toclick[idx].substr(0, 6) == 'tgdata') {
                            self.tgData(window.$('#' + toclick[idx]).attr('data-f'), window.$('#' + toclick[idx]).attr('data-g')).then(function() {
                                doClick(idx + 1);
                            });
                        } else {
                            self.tgName(window.$('#' + toclick[idx]).attr('data-g'), window.$('#' + toclick[idx]).attr('data-d')).then(function() {
                                doClick(idx + 1);
                            });
                        }
                    }
                }
                //For adding data
                var checks = window.$('.input-holder-' + self.dataservice.sanit(self.group));
                for(var i = 0; i < checks.length; i++) {
                    var g = window.$(checks[i]).attr('data-g');
                    if(self.backend.generics[g][self.backend.generics[g].length - 1].instantiable) {
                        if(!!self.ass_name[g]) {
                            if((self.backend.generics[g][self.backend.generics[g].length - 1].mode == 'file' && !!self.new_data_file[g] && self.new_data_file[g] != '') && self.notOrEdit(g + '/' + self.ass_name[g])) {
                                work.push([g, true, self.ass_name[g]]);
                            } else if((!!self.new_data[g] || Object.getOwnPropertyNames(self.new_datas[g]).length > 0) && self.notOrEdit(g + '/' + self.ass_name[g])) {
                                work.push([g, false, self.ass_name[g]]);
                            }
                        } else {
                            if(((self.backend.generics[g][self.backend.generics[g].length - 1].mode == 'file' && !!self.new_data_file[g] && self.new_data_file[g] != '') && self.notOrEdit(g + '/' + self.ass_name[g]))
                                    || ((!!self.new_data[g] || Object.getOwnPropertyNames(self.new_datas[g]).length > 0) && self.notOrEdit(g + '/' + self.ass_name[g]))) {
                                self.notif.alert(self.translate.instant('warning'), self.translate.instant('filesystem.noReg'));
                                window.$('.igen' + self.dataservice.sanit(g)).addClass('whigi-error');
                            }
                        }
                    } else {
                        if((self.backend.generics[g][self.backend.generics[g].length - 1].mode == 'file' && !!self.new_data_file[g] && self.new_data_file[g] != '') && self.notOrEdit(g)) {
                            work.push([g, true, undefined]);
                        } else if((!!self.new_data[g] || Object.getOwnPropertyNames(self.new_datas[g]).length > 0) && self.notOrEdit(g)) {
                            work.push([g, false, undefined]);
                        }
                    }
                }
                function doOne(idx: number) {
                    if(idx < work.length) {
                        self.register(work[idx][0], work[idx][1], work[idx][2]).then(function() {
                            doOne(idx + 1);
                        });
                    } else {
                        //We terminate with modifications
                        doClick(0);
                    }
                }
                doOne(0);
            };
            if(single)
                end();
            else
                setTimeout(end, 200);
        }

        this.inreg = true;
        //If some names are on, do them as well first
        objs = window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.btn-renamer.green');
        if(!!objs.length) {
            //Save who to click on
            var dt = window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit.to-click');
            for(var i = 0; i < dt.length; i++)
                toclick.push(dt[i].id);
            //Name then click
            var done = 0;
            for(var i = 0; i < objs.length; i++) {
                var g = window.$(objs[i]).attr('data-g'), d = window.$(objs[i]).attr('data-d');
                var idx = toclick.indexOf('tgdata' + this.dataservice.sanit(g + '/' + d));
                if(idx != -1)
                    toclick.splice(idx, 1, 'tgdata' + this.dataservice.sanit(g + '/' + window.$('#chgname' + this.dataservice.sanit(g + '/' + d)).val()));
                this.tgName(g, d, true).then(function() {
                    done++;
                    if(done >= objs.length)
                        complete(false);
                });
            }
        } else {
            //Save who to click on
            var dt = window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit.to-click');
            for(var i = 0; i < dt.length; i++)
                toclick.push(dt[i].id);
            complete(true);
        }
    }

    /**
     * Returns whether editing or creating a name.
     * @function notOrEdit
     * @private
     * @param {String} name Name.
     * @return {Boolean} Whether indeed.
     */
    private notOrEdit(name: string): boolean {
        if(!(name in this.backend.profile.data))
            return true;
        return !window.$('#tgdata' + this.dataservice.sanit(name)).length || !window.$('#tgdata' + this.dataservice.sanit(name)).hasClass('in-edit');
    }

    /**
     * Called if first time seen.
     * @function firstfrom
     * @public
     * @param {String} name Name first seen.
     * @param {String} gen_name Origin generic name.
     */
    firstfrom(name: string, gen_name: string) {
        var self = this;
        setImmediate(function() {
            window.$('#sincefrom' + self.dataservice.sanit(name)).ready(function() {
                window.$('#sincefrom' + self.dataservice.sanit(name)).datetimepicker();
                if(self.backend.generics[gen_name][self.backend.generics[gen_name].length - 1].is_dated_day_only)
                    window.$('#sincefrom' + self.dataservice.sanit(name)).datetimepicker('options', {format: 'DD/MM/YYYY'});
                window.$('#sincefrom' + self.dataservice.sanit(name)).datetimepicker('date',
                    window.moment(self.dataservice.strToObj(self.cached[name].decr_data)[self.sincefrom[name].act].from));
                self.check.tick();
            });
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {String} name Name of recorded file.
     * @param {Boolean} as_file Load from file.
     * @param {String} new_name Subfolder name for foldered data.
     * @return {Promise} When done.
     */
    register(name: string, as_file: boolean, new_name?: string): Promise {
        var self = this, send;
        return new Promise(function(resolve) {
            new_name = (!!new_name)? ('/' + new_name.replace('/', ':')) : '';
            new_name = new_name.substr(0, 63).replace(/\./g, '_');
            //Build and test
            window.$('.igen' + self.dataservice.sanit(name)).removeClass('whigi-error');
            send = self.dataservice.recGeneric(self.new_data[name], self.new_data_file[name], self.new_datas[name], name, as_file);
            if(send.constructor === Array) {
                if(send[1] != 'generics.silent') {
                    self.notif.error(self.translate.instant('error'), self.translate.instant(send[1]));
                    for(var i = 2; i < send.length; i++)
                        window.$('.igenfiner' + self.dataservice.sanit(name) + self.dataservice.sanit(send[i])).addClass('whigi-error');
                }
                resolve();
                return;
            }
            //Create it
            self.dataservice.newData(true, name + new_name, send, self.backend.generics[name][self.backend.generics[name].length - 1].is_dated, self.backend.generics[name].length - 1).then(function() {
                self.ass_name[name] = '';
                //Maybe create an emitter for a newly generated data.
                if(new_name != '')
                    self.resets[name + new_name] = new EventEmitter();
                self.resets[name].emit([0]);
                self.dataservice.filterKnown(self.raw_list.map(function(el) { return [el, el]; }), function(now: string[][]) {
                    self.data_list = now.map(function(el) { return el[0]; });
                    //Maybe you wanted acount creation?
                    if(self.backend.generics[name][self.backend.generics[name].length - 1].can_trigger_account) {
                        window.$(`
                            <div class="modal">
                                <h3>` + self.translate.instant('generics.create') + `</h3>
                                <div class="row text-center">
                                    <script type="text/javascript">
                                        window.addUser = function(user, pwd, pwd2, mail) {
                                            window.ngData.addUser(user, pwd, pwd2, ` + self.new_datas[name]['generics.first_name'] + `, ` + self.new_datas[name]['generics.last_name'] + `, mail).then(function(close) {
                                                if(close !== false) {
                                                    $('.tp-close').click();
                                                }
                                            });
                                        };
                                    </script>
                                    <p>` + self.translate.instant('generics.createExplain') + `</p>
                                    <label for="useracc">` + self.translate.instant('login.username') + `</label>
                                    <input type="text" id="useracc" class="form-control"/><br />
                                    <label for="pwd1acc">` + self.translate.instant('profile.new') + `</label>
                                    <input type="password" id="pwd1acc" class="form-control"/><br />
                                    <label for="pwd2acc">` + self.translate.instant('profile.new2') + `</label>
                                    <input type="password" id="pwd2acc" class="form-control"/><br />
                                    <label for="emailacc">` + self.translate.instant('login.email') + `</label>
                                    <input type="text" id="emailacc" class="form-control"/><br />
                                    <button class="btn default" onclick="$('.tp-close').click()">` + self.translate.instant('cancel') + `</button>
                                    <button class="btn green" onclick="addUser($('#useracc').val(), $('#pwd1acc').val(), $('#pwd2acc').val(), $('#emailacc').val())">` + self.translate.instant('goOn') + `</button>
                                </div>
                            </div>
                        `).appendTo('body').modal({closeClass: 'tp-close'});
                    }
                    resolve();
                });
            }, function(err) {
                if(err[0] == 'server') {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                } else {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
                }
                resolve();
            });
        });
    }

    /**
     * Offset modif.
     * @function modOffset
     * @public
     * @param {String} folder to list.
     * @param {Number} nn Max values to return.
     */
    modOffset(folder: string, nn: number) {
        var max = this.backend.data_trie.suggestions(folder + '/', '/').length;
        this.offsets[folder] = this.offsets[folder] || 0;
        this.offsets[folder] += nn;
        if(this.offsets[folder] < 0)
            this.offsets[folder] = 0;
        if(this.offsets[folder] > max - Math.abs(nn))
            this.offsets[folder] = max - Math.abs(nn);
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @param {String} folder to list.
     * @param {Number} nn Max values to return.
     * @param {Number} off Offset.
     * @return {Array} Known fields.
     */
    dataNames(folder: string, nn: number, off?: number): string[] {
        var i = 0;
        off = off || 0;
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            if(el.charAt(el.length - 1) != '/' && i >= off && i < (nn + off)) {
                i++;
                return true;
            } else if(el.charAt(el.length - 1) != '/') {
                i++;
            }
            return false;
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Show full.
     * @function select
     * @public
     * @param {String} gen Generic name.
     * @param {String} name Name of data.
     */
    select(gen: string, name: string) {
        if(this.backend.generics[gen][this.backend.generics[gen].length - 1].is_dated) {
            var idx = this.sincefrom[name].act;
            this.toview = this.dataservice.strToObj(this.cached[name].decr_data)[idx].value;
        } else {
            this.toview = this.cached[name].decr_data;
        }
        this.rstCsv.emit(this.toview);
        window.$('#fp' + this.dataservice.sanit(name)).modal();
    }

    /**
     * Deal with dating of already existing datas.
     * @function dateModifs
     * @public
     * @param {String} fname Full name of data.
     * @param {Number} dir Direction in array.
     * @param {Number} place Add or remove from array.
     * @param {Boolean} mod Change current timestamp.
     * @param {String} gname Underlying generic.
     */
    dateModifs(fname: string, dir: number, place: number, mod: boolean, gname: string) {
        var self = this, ret: {from: number, value: string}[];
        //Complete consists in removing preview
        function complete(res: string) {
            delete self.previews[fname];
            delete self.asked[fname];
            self.cached[fname].decr_data = res;
            self.dataservice.preview(self.cached, self.previews, self.asked, fname, self.backend.generics[gname][self.backend.generics[gname].length - 1].mode == 'json_keys',
                gname, false, self.sincefrom);
        }

        //Parse object
        ret = this.dataservice.strToObj(this.cached[fname].decr_data);
        //Move cursor
        if(dir != 0) {
            this.sincefrom[fname].act += dir;
            window.$('#sincefrom' + this.dataservice.sanit(fname)).datetimepicker('date', window.moment(ret[this.sincefrom[fname].act].from));
        }
        //Remove or add values.
        if(place < 0) {
            ret.splice(this.sincefrom[fname].act, -place);
            this.sincefrom[fname].max += place;
            if(this.sincefrom[fname].act > this.sincefrom[fname].max)
                this.sincefrom[fname].act = this.sincefrom[fname].max;
        } else if(place > 0) {
            //Cannot add values, do this with tgData...
        }
        //Modify current timestamp
        if(mod) {
            ret[this.sincefrom[fname].act].from = window.$('#sincefrom' + this.dataservice.sanit(fname)).datetimepicker('date').toDate().getTime();
            if(new Set(ret.map(function(el) {return el.from})).size != ret.length) {
                this.notif.error(this.translate.instant('error'), this.translate.instant('generics.twicedate'));
                return;
            }
        }
        //Save?
        if(mod || place < 0) {
            //Those are too sticky...
            window.$('.tooltip').remove();
            //One at a time
            this.changing = true;
            var send = JSON.stringify(ret);
            this.dataservice.modifyData(fname, send, true, this.backend.generics[gname].length - 1, {}, fname != gname, this.cached[fname].decr_aes).then(function() {
                self.changing = false;
                window.$('#sincefrom' + self.dataservice.sanit(fname)).datetimepicker('date', window.moment(ret[self.sincefrom[fname].act].from));
                complete(send);
            }, function(e) {
                self.changing = false;
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            });
        } else if(place == 0) {
            complete(this.cached[fname].decr_data);
        }
    }

    /**
     * Edit mode for a block.
     * @function editAll
     * @public
     */
    editAll() {
        var prevs = window.$('#apsablegen' + this.dataservice.sanit(this.group)).find("[name='preview']");
        for(var i = 0; i < prevs.length; i++) {
            var g = window.$(prevs[i]).attr('data-g');
            this.dataservice.clickOnEnter(true, '#tgdata' + this.dataservice.sanit(g));
        }
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
     * @param {Boolean} force Force do.
     * @return {Promise} When done.
     */
    tgName(folder: string, efix: string, force?: boolean): Promise {
        var self = this; 
        return new Promise(function(resolve) {
            if(force === true || window.$('#tgname' + self.dataservice.sanit(folder + '/' + efix)).hasClass('green')) {
                var before = folder + '/' + efix, after = folder + '/' + window.$('#chgname' + self.dataservice.sanit(before)).val();
                if(!window.$('#chgname' + self.dataservice.sanit(before)).val() || window.$('#chgname' + self.dataservice.sanit(before)).val() == '') {
                    window.$('#tgname' + self.dataservice.sanit(before)).removeClass('green').addClass('btn-link');
                    window.$('#chgname' + self.dataservice.sanit(before)).attr('readonly', true).val(efix);
                    resolve();
                }
                if(after in self.backend.profile.data) {
                    window.$('#tgname' + self.dataservice.sanit(before)).removeClass('green').addClass('btn-link');
                    window.$('#chgname' + self.dataservice.sanit(before)).attr('readonly', true).val(efix);
                    resolve();
                }
                self.backend.rename(before, after).then(function() {
                    window.$('#tgname' + self.dataservice.sanit(before)).removeClass('green').addClass('btn-link');
                    window.$('#chgname' + self.dataservice.sanit(before)).attr('readonly', true);
                    if(self.backend.generics[folder][self.backend.generics[folder].length - 1].is_dated) {
                        var date = window.$('#sincefrom' + self.dataservice.sanit(before)).datetimepicker('date');
                    }
                    self.dataservice.listData(false).then(function() {
                        self.previews[after] = self.previews[before];
                        self.asked[after] = self.asked[before];
                        self.cached[after] = self.cached[before];
                        self.sincefrom[after] = self.sincefrom[before];
                        self.foranew[after] = self.foranew[before];
                        self.resets[after] = self.resets[before];
                        //Tick all modifs
                        self.check.tick();
                        if(self.backend.generics[folder][self.backend.generics[folder].length - 1].is_dated) {
                            setTimeout(function() {
                                window.$('#sincefrom' + self.dataservice.sanit(after)).datetimepicker().datetimepicker('date', date);
                            }, 100);
                        }
                        resolve();
                    });
                }, function(e) {
                    //Must have been the same name!
                    //self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                    resolve();
                });
            } else {
                window.$('#tgname' + self.dataservice.sanit(folder + '/' + efix)).addClass('green').removeClass('btn-link');
                window.$('#chgname' + self.dataservice.sanit(folder + '/' + efix)).attr('readonly', false);
                resolve();
            }
        });
    }

    /**
     * Allows editing a data.
     * @function tgData
     * @public
     * @param {String} fname Full name.
     * @param {String} gname Generic underlying.
     * @param {Boolean} skip Force skip.
     * @return {Promise} When done.
     */
    tgData(fname: string, gname: string, skip?: boolean): Promise {
        var self = this;
        skip = skip === true;
        function allEmpty(): boolean {
            var keys = Object.getOwnPropertyNames(self.new_datas[fname]);
            for(var i = 0; i < keys.length ; i++) {
                if(!!self.new_datas[fname][keys[i]] && self.new_datas[fname][keys[i]] != '') {
                    return false;
                }
            }
            return true;
        }
        return new Promise(function(resolve) {
            if(!window.$('#tgdata' + self.dataservice.sanit(fname)).hasClass('green')) {
                window.$('#tgdata' + self.dataservice.sanit(fname)).addClass('green in-edit').removeClass('btn-link').attr('disabled', true);
                window.$('#tgdisp' + self.dataservice.sanit(fname)).css('display', 'none');
                window.$('#tginput' + self.dataservice.sanit(fname)).css('display', 'block');
                window.$('#on-edit' + self.dataservice.sanit(fname)).addClass('keys' + self.dataservice.sanit(fname));
                //Prefill
                if(!!self.resets[fname])
                    self.resets[fname].emit(self.previews[fname][1]);
                else
                    self.resets[fname].emit(self.backend.generics[gname][self.backend.generics[gname].length - 1].mode != 'json_keys'? {} : ' ');
                //Auto expand input_block
                window.$('#igen2' + self.dataservice.sanit(fname)).click();
                resolve();
            } else {
                if(skip || (self.backend.generics[gname][self.backend.generics[gname].length - 1].mode != 'json_keys'
                    && (!self.new_data[fname] || self.new_data[fname] == '') && (!self.new_data_file[fname] || self.new_data_file[fname] == '')) ||
                    (self.backend.generics[gname][self.backend.generics[gname].length - 1].mode == 'json_keys' && allEmpty())) {
                    window.$('#tgdata' + self.dataservice.sanit(fname)).removeClass('green in-edit').addClass('btn-link');
                    window.$('#tginput' + self.dataservice.sanit(fname)).css('display', 'none');
                    window.$('#tgdisp' + self.dataservice.sanit(fname)).css('display', 'block');
                    window.$('#tgch2' + self.dataservice.sanit(fname)).removeClass('green in-edit');
                    window.$('#on-edit' + self.dataservice.sanit(fname)).css('display', 'none').removeClass('keys' + self.dataservice.sanit(fname));
                    if(!!self.resets[fname])
                        self.resets[fname].emit([]);
                    delete self.new_data[gname];
                    delete self.new_data_file[gname];
                    self.new_datas[gname] = {};
                    resolve();
                    return;
                }
                //Build and test
                window.$('.iinput' + self.dataservice.sanit(fname)).removeClass('whigi-error');
                var send = self.dataservice.recGeneric(self.new_data[fname], self.new_data_file[fname], self.new_datas[fname], gname, self.backend.generics[gname][self.backend.generics[gname].length - 1].mode == 'file');
                if(send.constructor === Array) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant(send[1]));
                    for(var i = 2; i < send.length; i++)
                        window.$('.igenfiner' + self.dataservice.sanit(fname) + self.dataservice.sanit(send[i])).addClass('whigi-error');
                    resolve();
                    return;
                }
                //If it is dated, some more modifications need to be done
                var is_dated = self.backend.generics[gname][self.backend.generics[gname].length - 1].is_dated;
                if(is_dated) {
                    var sd: string = JSON.parse(send)[0].value;
                    var from = window.$('#sincefrom' + self.dataservice.sanit(fname)).datetimepicker('date').toDate().getTime();
                    var replacement = self.dataservice.strToObj(self.cached[fname].decr_data) || [];
                    if(!!self.foranew[fname]) {
                        replacement.push({from: from, value: sd});
                        if(new Set(replacement.map(function(el) {return el.from})).size != replacement.length) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('generics.twicedate'));
                            window.$('.igenfiner' + self.dataservice.sanit(fname) + self.dataservice.sanit(send[2])).addClass('whigi-error');
                            resolve();
                            return;
                        }
                    } else {
                        replacement[self.sincefrom[fname].act] = {from: from, value: sd};
                    }
                    replacement = replacement.sort(function(a, b): number {
                        return (a.from < b.from)? - 1 : 1;
                    });
                    send = JSON.stringify(replacement);
                }
                //Create it
                self.dataservice.modifyData(fname, send, is_dated, self.backend.generics[gname].length - 1, {}, fname != gname, self.cached[fname].decr_aes).then(function() {
                    window.$('#tgdata' + self.dataservice.sanit(fname)).removeClass('green in-edit').addClass('btn-link');
                    window.$('#tginput' + self.dataservice.sanit(fname)).css('display', 'none');
                    window.$('#tgdisp' + self.dataservice.sanit(fname)).css('display', 'block');
                    window.$('#tgch2' + self.dataservice.sanit(fname)).removeClass('green in-edit');
                    window.$('#on-edit' + self.dataservice.sanit(fname)).css('display', 'none').removeClass('keys' + self.dataservice.sanit(fname));
                    //Refresh preview
                    delete self.asked[fname];
                    delete self.previews[fname];
                    self.cached[fname].decr_data = send;
                    self.dataservice.preview(self.cached, self.previews, self.asked, fname, self.backend.generics[gname][self.backend.generics[gname].length - 1].mode == 'json_keys',
                        gname, false, self.sincefrom);
                    //Reset the input blocks
                    self.resets[fname].emit(send);
                    self.resets[fname].emit([]);
                    self.dataservice.filterKnown(self.raw_list.map(function(el) { return [el, el]; }), function(now: string[][]) {
                        self.data_list = now.map(function(el) { return el[0]; });
                        //Here we are done!
                        resolve();
                    });
                    //If this was dated, some more modifs...
                    if(!!self.foranew[fname]) {
                        self.sincefrom[fname].max++;
                        window.$('#sincefrom' + self.dataservice.sanit(fname)).datetimepicker('date', window.moment(replacement[self.sincefrom[fname].act].from));
                        window.$('#' + self.foranew[fname]).removeClass('green in-edit');
                        delete self.foranew[fname];
                    }
                    //Reset what we'll enter
                    setImmediate(function() {
                        delete self.new_data[gname];
                        delete self.new_data_file[gname];
                        self.new_datas[gname] = {};
                        self.check.tick();
                    }, 100);
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                    resolve();
                });
            }
        });
    }

    /**
     * Check if a row is in edit.
     * @function rowInEdit
     * @public
     * @param {String} id Who to check.
     * @return {Boolean} In edit.
     */
    rowInEdit(id: string): boolean {
        return !!window.$('#' + id).closest('.input-holder-' + this.dataservice.sanit(this.group)).find('.in-edit').length;
    }

    /**
     * Returns if in edit.
     * @function addDisabled
     * @public
     * @param {String} who Full name.
     * @return {Boolean} In edit.
     */
    addDisabled(who: string): boolean {
        return window.$('#tgdata' + this.dataservice.sanit(who)).hasClass('in-edit');
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
        var self = this;
        window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.whigi-error').removeClass('whigi-error');
        window.$('#apsablegen' + this.dataservice.sanit(this.group)).find('.in-edit').attr('disabled', false).each(function() {
            var f = window.$(this).attr('data-f');
            var g = window.$(this).attr('data-g');
            self.tgData(f, g, true);
        });
        //Reset which will be added
        this.foranew = {};
        //Reset the names
        this.ass_name = {};
        this.popList();
        //Reset the input blocks
        var keys = Object.getOwnPropertyNames(this.resets);
        for(var i = 0; i < keys.length; i++) {
            this.resets[keys[i]].emit(!!this.backend.profile.data[keys[i]]? [] : undefined);
        }
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
