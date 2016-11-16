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
export class ClearSingleview {

    @Input() data: string;
    @Input() fr: Date | string;
    @Input() jsoned: boolean;
    @Input() gen: string;
    @Input() version: number;
    @Input() rst: EventEmitter<any>;
    public keys: {descr_key: string, mode: string, enum: string, required: boolean, placeholder?: string}[];
    private cpt: {[id: string]: string};

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
        this.cpt = {};
        if(!!this.gen && this.jsoned) {
            this.keys = this.backend.generics[this.gen][this.version].json_keys;
        }
        if(!!this.rst) {
            this.rst.subscribe(function(params) {
                self.fr = !!self.fr? self.fr.toString() : '';
                self.cpt = {};
                if(!!self.gen && self.jsoned) {
                    self.keys = self.backend.generics[self.gen][self.version].json_keys;
                }
            });
        }
    }

    /**
     * Spreads a part of a folder generic content.
     * @function recover
     * @param {String} key Key.
     * @param {String} json JSON.
     * @param {Date} from Desinbiguifier. 
     * @return {String} Associated value.
     */
    recover(key: string, json: string, from: Date): string {
        if(key + '___' + from in this.cpt)
            return this.cpt[key + '___' + from];
        var idx = 0;
        var ret = JSON.parse(json), bk;
        for(var i = 0; i < this.keys.length; i++) {
            if(this.keys[i].descr_key == key) {
                idx = i;
                break;
            }
        }
        if(this.keys[idx].mode == 'select')
            try { bk = this.translate.instant(ret[key]); } catch(e) { bk = ret[key]; }
        if(this.keys[idx].mode == 'checkbox')
            bk = this.translate.instant(ret[key]? 'Yes' : 'No');
        else
            bk = ret[key];
        if(!bk || bk.trim() == '')
            bk = ret[key];
        this.cpt[key + '___' + from] = bk;
        return bk;
    }

}
