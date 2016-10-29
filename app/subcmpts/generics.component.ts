/**
 * Component displaying the generic values
 * @module generics.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/generics.html';
import * as modules from './templates/generics';

@Component({
    template: template
})
export class Generics implements OnInit {

    public filter: string;
    private lighted: EventEmitter<number>;
    private sub: Subscription;
    private lists: {[id: string]: any};

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Current route.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private dataservice: Data) {
        this.filter = 'generics.any';
        this.lighted = new EventEmitter<number>();
        this.lists = {}
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.filter = !!params['filter']? params['filter'] : 'generics.any';
            self.regUpdate();
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    /**
     * Returns the keys of generics.
     * @function generics
     * @public
     * @return {String[][][]} Keys.
     */
    generics(): string[][][] {
        var self = this, obj;
        if(this.filter in this.lists)
            return this.lists[this.filter];
        if(this.filter == 'generics.any')
            obj = modules.m.modules;
        else
            obj = modules.m.modules.filter(function(el, i): boolean {
                return modules.m.keys[self.filter].holds.indexOf(i) != -1;
            });
        var toRet = [];
        for(var i = 0; i < obj.length; i++) {
            toRet.push([modules.m.holds[obj[i]].holds, obj[i], modules.m.holds[obj[i]].is_i18n, !modules.m.holds[obj[i]].open]);
        }
        this.lists[this.filter] = toRet;
        return toRet;
    }

    /**
     * Return which item to light up.
     * @function getLight
     * @public
     * @return {Number} Item.
     */
    getLight(): number {
        if(this.filter in modules.m.keys)
            return modules.m.keys[this.filter].left_num;
        return -1;
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

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }
    
}
