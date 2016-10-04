/**
 * Component to display the sidebar.
 * @module sidebar.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit} from '@angular/core';
enableProdMode();
import * as template from './templates/sidebar.html';

@Component({
    selector: 'sidebar',
    template: template
})
export class Sidebar implements OnInit {

    @Input() lighted: number;

    /**
     * Creates the component.
     * @function constructor
     * @public
     */
    constructor() {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        window.$('#linkbars' + this.lighted).addClass('start active');
    }

}
