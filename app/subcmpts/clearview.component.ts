/**
 * Component to display the decrypted data.
 * @module clearview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/clearview.html';

@Component({
    selector: 'clear-view',
    template: template
})
export class Clearview {

    public new_datas: {[id: string]: string};
    public new_data: string;
    public new_data_file: string;
    @Input() data_name: string;
    @Input() decr_data: string;
    @Input() is_dated: boolean;
    @Input() change: boolean;
    @Input() is_folder: boolean;
    @Input() version: number;
    @Input() gen_name: string;
    @Input() is_generic: boolean;
    @Input() changed: EventEmitter<string>;
    @Output() notify: EventEmitter<string>;
    private values: {from: number | Date, value: string}[];
    private reset: EventEmitter<any>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param check Check service.
     * @param backend App service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend, private dataservice: Data) {
        this.values = undefined;
        this.notify = new EventEmitter<string>();
        this.reset = new EventEmitter<any>();
        new window.Clipboard('.btn-copier');
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.new_datas = {};
        this.new_data_file = '';
        window.$('#pick4').ready(function() {
            window.$('#pick4').datetimepicker();
            window.$('#pick4').datetimepicker('date', window.moment());
        });
        if(!!this.changed) {
            this.changed.subscribe(function(nw_val) {
                self.decr_data = nw_val;
                delete self.values;
                self.reset.emit();
                window.$('.wlimore').removeClass('active');
                window.$('.fi-listable').addClass('active');
            });
        }
    }

    /**
     * Called for parsing.
     * @function computeValues
     * @public
     */
    computeValues(): {from: Date, value: string}[] {
        var self = this;
        if(!this.values) {
            this.values = this.dataservice.strToObj(this.decr_data);
            for(var i = 0; i < this.values.length; i++) {
                this.values[i].from = new Date(this.values[i].from);
                window.$('#pick-chg' + this.dataservice.sanit(this.values[i].from.toLocaleString())).ready(function() {
                    window.$('#pick-chg' + self.dataservice.sanit(self.values[this].from.toLocaleString())).datetimepicker();
                    window.$('#pick-chg' + self.dataservice.sanit(self.values[this].from.toLocaleString())).datetimepicker('date', window.moment(self.values[this].from));
                }.bind(i));
            }
            if(this.values.length == 0)
                this.values = undefined;
        }
        return this.values;
    }

    /**
     * Modifies a stamp.
     * @function recFrom
     * @public
     * @param {String} dom DOM input for date.
     * @param {Number} i Current position in current decrypted object.
     */
    recFrom(dom: string, i: number) {
        var date = window.$('#' + dom).datetimepicker('date').valueOf();
        var str = this.dataservice.strToObj(this.decr_data);
        str[i].from = date;
        this.notify.emit(JSON.stringify(str));
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
        //Generic data, use what has been returned by recGeneric. If we are dated, discard the date info.
        if(this.is_generic && this.is_dated) {
            this.new_data = JSON.parse(err)[0].value;
        } else if(this.is_generic) {
            this.new_data = err;
        }
        //Add the date info
        if(this.is_dated) {
            var from = window.$('#pick4').datetimepicker('date').toDate().getTime();
            replacement = this.dataservice.strToObj(this.decr_data) || [];
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
        this.notify.emit(replacement);
    }

    /**
     * Removes a milestone.
     * @function rem
     * @public
     * @param {Number} i Index to remove.
     */
    rem(i: number) {
        var str = this.dataservice.strToObj(this.decr_data);
        str.splice(i, 1);
        this.notify.emit(JSON.stringify(str));
    }

    /**
     * Prompts for downloading.
     * @function dl
     * @public
     * @param {String} data Data to download.
     */
    dl(data: string) {
        var spl = this.data_name.split('/');
        window.download(data, spl[spl.length - 1]);
    }

    /**
     * Get possible name.
     * @function getName
     * @public
     * @return {String} Traduction.
     */
    getName(): string {
        if(this.is_generic)
            return this.translate.instant(this.backend.generics[this.gen_name][this.version].descr_key);
        return '';
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

}
