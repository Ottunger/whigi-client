/**
 * Component displaying an error screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    templateUrl: './templates/notfound.html'
})
export class Notfound {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     */
    constructor(public router: Router) {
        
    }
    
}
