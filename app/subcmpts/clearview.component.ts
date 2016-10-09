/**
 * Component to display the decrypted data.
 * @module clearview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, Output, EventEmitter} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
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
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend) {
        this.values = undefined;
        this.notify = new EventEmitter<string>();
        new window.Clipboard('.btn-copier');
    }

    /**
     * Called for parsing.
     * @function computeValues
     * @public
     */
    computeValues(): {from: Date, value: string}[] {
        if(!this.values) {
            this.values = JSON.parse(this.decr_data);
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
        this.values.splice(i, 1);
        this.notify.emit(JSON.stringify(this.values.map(function(el) {
            el.from = el.from.getTime();
            return el;
        })));
    }

    /**
     * Spreads a part of a folder generic content.
     * @function recover
     * @param {String} key Key.
     * @param {String} json JSON.
     * @return {String} Associated value.
     */
    recover(key: string, json: string): string {
        var ret = JSON.parse(json);
        return ret[key];
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
