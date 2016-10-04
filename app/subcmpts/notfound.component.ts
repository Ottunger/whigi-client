/**
 * Component displaying an error screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode} from '@angular/core';
import {Router} from '@angular/router';
enableProdMode();
import * as template from './templates/notfound.html';

@Component({
    template: template
})
export class Notfound {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     */
    constructor(private router: Router) {
        
    }
    
}
