/**
 * Component to display the sidebar.
 * @module sidebar.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
enableProdMode();
import * as template from './templates/sidebar.html';

@Component({
    selector: 'sidebar',
    template: template
})
export class Sidebar implements OnInit {

    @Input() lighted: EventEmitter<number> | number;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     */
    constructor(private router: Router) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        if(typeof this.lighted === 'number') {
            window.$('.linkbars').removeClass('start active');
            window.$('#linkbars' + this.lighted).addClass('start active');
        } else if(typeof this.lighted !== 'undefined') {
            this.lighted.asObservable().subscribe(function(vals) {
                window.$('.linkbars').removeClass('start active');
                window.$('#linkbars' + vals).addClass('start active');
            });
        }
    }

}
