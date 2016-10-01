/**
 * Component displaying the generic values
 * @module generics.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, ApplicationRef} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/generics.html';

@Component({
    template: template
})
export class Generics implements OnInit {

    public new_name: string;
    public new_data: string;
    public new_datas: {[id: string]: string};
    public new_data_file: string;
    public filter: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService,
        private dataservice: Data, private check: ApplicationRef) {
        this.filter = 'generics.any';
        this.new_name = '';
        this.new_datas = {};
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
        send = this.dataservice.recGeneric(this.new_data, this.new_data_file, this.new_datas, name, as_file);
        if(!send) {
            this.notif.error(this.translate.instant('error'), this.translate.instant('generics.regexp'));
            return;
        }
        //Create it
        this.dataservice.newData(name + new_name, send, this.backend.generics[name][this.backend.generics[name].length - 1].is_dated, this.backend.generics[name].length - 1).then(function() {
            self.new_name = '';
            self.new_data = '';
            self.new_data_file = '';
            self.new_datas = {};
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
        });
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @param {String} folder to list.
     * @return {Array} Known fields.
     */
    dataNames(folder: string): string[] {
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
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
     * Returns all available filters.
     * @function filters
     * @public
     */
    filters(): string[] {
        var ret = ['generics.any'];
        for(var data in this.backend.generics) {
            if(ret.indexOf(this.backend.generics[data][this.backend.generics[data].length - 1].module) < 0)
                ret.push(this.backend.generics[data][this.backend.generics[data].length - 1].module);
        }
        return ret;
    }

    /**
     * Returns the keys of generics.
     * @function generics
     * @public
     * @return {String[]} Keys.
     */
    generics(): string[] {
        var self = this;
        if(this.filter == 'generics.any')
            return Object.getOwnPropertyNames(this.backend.generics);
        return Object.getOwnPropertyNames(this.backend.generics).filter(function(el): boolean {
            return self.backend.generics[el][self.backend.generics[el].length - 1].module == self.filter;
        });
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
        }
        r.readAsDataURL(file);
    }
    
}
