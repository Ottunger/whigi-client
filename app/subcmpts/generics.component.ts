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
enableProdMode();
import * as template from './templates/generics.html';

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
        private routed: ActivatedRoute) {
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
     * @return {String[][][]} Keys.
     */
    generics(): string[][][] {
        var self = this, obj;
        if(this.filter in this.lists)
            return this.lists[this.filter];
        if(this.filter == 'generics.any')
            obj = Object.getOwnPropertyNames(this.backend.generics);
        else
            obj = Object.getOwnPropertyNames(this.backend.generics).filter(function(el): boolean {
                return self.backend.generics[el][self.backend.generics[el].length - 1].module == self.filter;
            });
        var ret = {};
        for(var i = 0; i < obj.length; i++) {
            ret[this.backend.generics[obj[i]][this.backend.generics[obj[i]].length - 1].group] = ret[this.backend.generics[obj[i]][this.backend.generics[obj[i]].length - 1].group] || [];
            ret[this.backend.generics[obj[i]][this.backend.generics[obj[i]].length - 1].group].push(obj[i]);
        }
        var toRet = [], keys = Object.getOwnPropertyNames(ret);
        for(var i = 0; i < keys.length; i++) {
            toRet.push([ret[keys[i]], keys[i]]);
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
        switch(this.filter) {
            case 'generics.profile':
                return 1;
            case 'generics.corporate':
                return 2;
        }
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
     * Update number of encryptions.
     * @function updateEnc
     * @public
     * @param {Number} num Number.
     */
    updateEnc(num: number) {

    }
    
}
