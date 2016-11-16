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

    @Input() data_name: string;
    @Input() decr_data: string;
    @Input() is_dated: boolean;
    @Input() change: boolean;
    @Input() is_folder: boolean;
    @Input() version: number;
    @Input() gen_name: string;
    @Input() changed: EventEmitter<string>;
    @Output() notify: EventEmitter<string>;
    private values: {from: Date, value: string}[];

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
        new window.Clipboard('.btn-copier');
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if(!!this.changed) {
            this.changed.subscribe(function(nw_val) {
                self.decr_data = nw_val;
                delete self.values;
            });
        }
    }

    /**
     * Called for parsing.
     * @function computeValues
     * @public
     */
    computeValues(): {from: Date, value: string}[] {
        if(!this.values) {
            try {
                this.values = JSON.parse(this.decr_data);
            } catch(e) {
                this.values = [];
            }
            this.values = this.values.sort(function(a, b): number {
                return (a.from < b.from)? - 1 : 1;
            });
            for(var i = 0; i < this.values.length; i++) {
                this.values[i].from = new Date(this.values[i].from);
            }
            if(this.values.length == 0)
                this.values = undefined;
        }
        return this.values;
    }

    /**
     * Removes a milestone.
     * @function rem
     * @public
     * @param {Number} i Index to remove.
     */
    rem(i: number) {
        var str;
        try {
            str = JSON.parse(this.decr_data);
        } catch(e) {
            str = [];
        }
        str = str.sort(function(a, b): number {
            return (a.from < b.from)? - 1 : 1;
        });
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
        if(this.isGeneric())
            return this.translate.instant(this.backend.generics[this.gen_name][this.version].descr_key);
        return '';
    }

    /**
     * Is generic.
     * @function isGeneric
     * @public
     * @return {Boolean} Is generic.
     */
    isGeneric(): boolean {
        return (this.gen_name in this.backend.generics);
    }

}
