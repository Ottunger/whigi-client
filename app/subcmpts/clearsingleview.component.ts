/**
 * Component to display the decrypted data at one step.
 * @module clearsingleview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, EventEmitter, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/clearsingleview.html';

@Component({
    selector: 'clear-single-view',
    template: template
})
export class ClearSingleview implements OnInit {

    @Input() data: string;
    @Input() fr: Date | string;
    @Input() jsoned: boolean;
    @Input() gen: string;
    @Input() version: number;
    @Input() rst: EventEmitter<any>;
    private asjson: any;

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
        
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.fr = !!this.fr? this.fr.toString() : '';
        try { this.asjson = JSON.parse(this.data); } catch(e) { this.asjson = {}; }
        if(!!this.rst) {
            this.rst.subscribe(function(params) {
                self.fr = !!self.fr? self.fr.toString() : '';
                try { self.asjson = JSON.parse(params); } catch(e) { self.asjson = {}; }
            });
        }
    }

    /**
     * Prepares input for showing.
     * @function show
     * @public
     * @return {String} Display.
     */
    show(): string {
        if(this.gen in this.backend.generics) {
            if(this.backend.generics[this.gen][this.backend.generics[this.gen].length - 1].mode == 'checkbox')
                return this.translate.instant(this.data? 'Yes' : 'No');
            else if(this.backend.generics[this.gen][this.backend.generics[this.gen].length - 1].mode == 'select')
                return this.translate.instant(this.data + '');
        }
        return this.data;
    }

    /**
     * Spreads a part of a folder generic content.
     * @function recover
     * @param {Object} key Key.
     * @return {String} Associated value.
     */
    recover(key: any): string {
        if(!this.asjson)
            return '';
        var bk;
        if(key.mode == 'select')
            try { bk = this.translate.instant(this.asjson[key.descr_key] + ''); } catch(e) { bk = this.asjson[key.descr_key]; }
        else if(key.mode == 'checkbox')
            bk = this.translate.instant(this.asjson[key.descr_key]? 'Yes' : 'No');
        else
            bk = this.asjson[key.descr_key];
        if(!bk || bk.trim() == '')
            bk = this.asjson[key.descr_key];
        return bk;
    }

    /**
     * Get columns.
     * @function columns
     * @public
     * @param {Boolean} right Right column.
     * @return {Object[]} Values. 
     */
    columns(right: boolean): any[] {
        var vals = this.backend.generics[this.gen][this.version].json_keys, ret = [];
        for(var i = 0; i < vals.length; i++) {
            if(this.dataservice.keyCheck(this.asjson, vals[i])) {
                ret.push(vals[i]);
            }
        }
        return right? ret.slice(ret.length / 2) : ret.slice(0, ret.length / 2);
    }

}
