/**
 * Component displaying the files as folders.
 * @module filesystem.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, ApplicationRef, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/filesystem.html';

@Component({
    template: template
})
export class Filesystem implements OnInit {

    public data_name: string;
    public data_value: string;
    public data_value_file: string;
    public folders: string;
    private mode: string;
    private lighted: EventEmitter<number>;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param routed Route snapshot service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private routed: ActivatedRoute,
        private notif: NotificationsService, private dataservice: Data, private check: ApplicationRef) {
        this.folders = '';
        this.data_value_file = '';
        this.lighted = new EventEmitter<number>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            if(!!params['folders'])
                self.folders = params['folders'];
            self.mode = params['mode'];
            setTimeout(function() {
                window.$('#pick1').datetimepicker();
                window.$('#pick1').datetimepicker('date', window.moment());
                window.$('#pick2').datetimepicker();
                window.$('#pick2').datetimepicker('date', window.moment());
            }, 100);
            self.regUpdate();
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {Boolean} as_file Load from file.
     * @param {Boolean} is_dated Dated or not.
     */
    register(as_file: boolean, is_dated: boolean) {
        var self = this, send;
        if(this.completeName() in this.backend.generics || (this.folders.slice(0, -1) in this.backend.generics && 
            this.backend.generics[this.folders.slice(0, -1)][this.backend.generics[this.folders.slice(0, -1)].length - 1].instantiable)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.generics'));
            return;
        }
        if(is_dated) {
            send = JSON.stringify([{
                value: as_file? this.data_value_file : this.data_value,
                from: window.$('#pick1').datetimepicker('date').toDate().getTime()
            }]);
        } else {
            send = as_file? this.data_value_file : this.data_value;
        }
        this.dataservice.newData(this.completeName(), send, is_dated, 0).then(function() {
            self.data_name = '';
            self.data_value = '';
            self.data_value_file = '';
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
        });
    }

    /**
     * Get a folder up.
     * @function getUp
     * @public
     */
    getUp() {
        this.router.navigate(['/filesystem', this.mode, {folders: this.folders.replace(/[^\/]+\/$/, '')}]);
    }

    /**
     * Access a folder.
     * @function select
     * @public
     * @param {String} name Folder name.
     */
    select(name: string) {
        this.router.navigate(['/filesystem', this.mode, {folders: this.folders + name + '/'}]);
    }

    /**
     * Navigate to details panel.
     * @function view
     * @public
     * @param {String} name Name of data.
     */
    view(name: string) {
        if(this.mode == 'data') {
            this.router.navigate(['/data', window.encodeURIComponent(this.folders + name)]);
        } else if(this.mode == 'vault') {
            var mail = this.folders.substr(0, this.folders.indexOf('/'));
            this.router.navigate(['/vault', window.encodeURIComponent(mail), this.backend.shared_with_me_trie.find(this.folders + name).value, {
                route_back: this.folders,
                data_name: name
            }]);
        }
    }

    /**
     * List this level.
     * @function listLevel
     * @public
     * @return {Array} Known fields.
     */
    listLevel(): string[] {
        if(this.mode == 'data') {
            return this.backend.data_trie.suggestions(this.folders, '/').sort();
        } else if(this.mode == 'vault') {
            return this.backend.shared_with_me_trie.suggestions(this.folders, '/').sort();
        }
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });;
    }

    /**
     * Keys of folder names known.
     * @function folderNames
     * @public
     * @return {Array} Known fields.
     */
    folderNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/';
        }).map(function(el: string): string {
            return el.slice(0, -1).replace(/.+\//, '');
        });;
    }

    /**
     * Returns a name based on directory structure.
     * @function completeName
     * @private
     * @return {String} Describing name.
     */
    private completeName(): string {
        return this.folders + this.data_name.replace('/', ':');
    } 

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        var self = this;
        return new Promise<boolean>(function(resolve, reject) {
            if(window.confirm(msg)) {
                //On route change, reset the route
                self.folders = '';
                resolve(true);
            } else {
                resolve(false);
            }
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
                self.data_value_file = atob(r.result.split(',')[1]);
            else
                self.data_value_file = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Allows to display a context of the folder.
     * @function hasKey
     * @param {Boolean} long Return long description.
     * @return {String} A key to describe the folder or undefined.
     */
    hasKey(long: boolean): string {
        if(!this.folders) {
            this.folders = '';
        }
        var test = (this.mode == 'data')? this.folders : this.folders.replace(/^[^\/]*\//, '');
        return (test in this.backend.generics_paths)? (long? this.backend.generics_paths[test].long_descr_key : this.backend.generics_paths[test].descr_key) : undefined;
    }

    /**
     * Return which item to light up.
     * @function getLight
     * @public
     * @return {Number} Item.
     */
    getLight(): number {
        return (this.mode == 'data'? 3 : 4);
    }

    /**
     * Register an update of lighter.
     * @function regUpdate
     * @public
     */
    regUpdate() {
        var self = this;
        setImmediate(function() {
            self.lighted.emit(self.getLight())
        });
    }
    
}
