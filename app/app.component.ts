/**
 * Component displaying the main page.
 * @module app.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, ViewEncapsulation} from '@angular/core';
import {Backend} from './app.service';
import {Data} from './data.service';
enableProdMode();

@Component({
    selector: 'my-app',
    styles: [`
        html, body {
            height: 100%;
            background-color: #e7e7e7;
        }
        .MenuContainer {
            height: 27px;
            bottom:0;
            z-index: 997;
        }
        ul#navigation {
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 27px;
            list-style: none;
            margin: 0;
            padding-left: 26vw;
            padding-right: 0px;
            border: 1px solid #ccc;
            border-width: 1px 0;    
            text-align: center;
            font-size: 16px;
            z-index: 997;
            font-family: 'Cham-WebFont', Arial, sans-serif;
            background-color: #241717;
            overflow-x: hidden;
        }
        ul#navigation li {
            display: inline;
            margin-right: .75em;
            list-style: none;
            margin: 0;
            padding: 0;
            z-index: 997;
        }
        ul#navigation li.first {
            margin-left: -13vw;
        }
        ul#navigation li.last {
            margin-right: 0;
        }
    `],
    encapsulation: ViewEncapsulation.None,
    template: `
        <div id="mainDiv">
            <router-outlet></router-outlet>
            <br />
            <div class="MenuContainer">
                <ul id="navigation">
                    <span style="overflow-x: hidden; max-width: 25vw; position: absolute; left: 3px; top: 7px; color: #fff; font-size: 12px;">{{ 'mention' | translate }}</span>
                    <li class="first"><button type="button" class="btn btn-xs green" style="margin-right: 30px;" (click)="sendFeedback()">{{ 'feedback' | translate }}</button></li>
                    <li class="last">
                        <select [(ngModel)]="backend.lang" (change)="regLang()" style="background-color: #ff5000;color: #fff;border: 1px solid #ff5000;border-radius: 3px;font-size: 12px;padding-top: 2px; padding-bottom: 1px;">
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                        </select>
                    </li>
                </ul>
            </div>
            <simple-notifications [options]="options"></simple-notifications>
        </div>
    `
})
export class Application {

    public options = {
        timeOut: 4000,
        lastOnBottom: true,
        clickToClose: true,
        maxLength: 0,
        maxStack: 4,
        showProgressBar: true,
        pauseOnHover: true,
        preventDuplicates: false,
        preventLastDuplicates: "visible",
        rtl: false,
        animate: "scale",
        position: ["right", "bottom"]
    };

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param dataservice Data service.
     */
    constructor(public backend: Backend, public dataservice: Data) {
        var self = this;
    }

    /**
     * Planifies language.
     * @function regLang
     * @public
     */
    regLang() {
        var self = this;
        setImmediate(function() {
            self.dataservice.setLang(self.backend.lang);
        });
    }

    /**
     * Send feedback.
     * @function sendFeedback
     * @public
     */
    sendFeedback() {
        var name = !!(this.backend.profile)? this.backend.profile._id : 'whigi-no-name';
        window.$(`
            <div class="modal fddiv">
                <h3 id="fdtitle">` + this.backend.transform('feedback') + `</h3>
                <div>
                    <script type="text/javascript">
                        function fdsend() {
                            var http = new XMLHttpRequest();
                            var log = JSON.stringify({
                                browser: navigator.userAgent,
                                cookies: JSON.stringify({
                                    token: localStorage['token'],
                                    key_decryption: localStorage['key_decryption'],
                                    psha: localStorage['psha'],
                                    puzzle: localStorage['puzzle']
                                }),
                                url: location.href
                            });
                            var params = JSON.stringify({
                                email: $('.current').find('#fdemail').val(),
                                message: $('.current').find('#fdfd').val() + '\\n\\n' + log,
                                name: '` + name + `'
                            });
                            http.open("POST", "` + this.backend.FEEDBACK_URL + `", true);
                            http.setRequestHeader("Content-type", "application/json");
                            http.onreadystatechange = function() {
                                if(http.readyState == 4 && Math.floor(http.status/10) == 20) {
                                    //End here and now
                                    $('.current').find('.modal').html('\
                                        <h3>` + this.backend.transform('help') + `</h3>\
                                        <p>` + this.backend.transform('ctSoon') + `</p>\
                                        <a href="#close-modal" rel="modal:close" class="close-modal">Close</a>\
                                    ');
                                } else if(http.readyState == 4) {
                                    $('.current').find('#fdtitle').css('color', 'red').text('` + this.backend.transform('error') + `');
                                }
                            }
                            http.send(params);
                        }
                    </script>
                    <div class="form-group">
                        <input class="form-control placeholder-no-fix" type="text" id="fdemail" autocomplete="off" placeholder="Email"/>
                    </div>
                    <div class="form-group">
                        <textarea class="form-control placeholder-no-fix" type="textarea" id="fdfd" autocomplete="off" placeholder="Feedback"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn green pull-right" onclick="fdsend()"> ` + this.backend.transform('goOn') + ` </button>
                    </div>
                </div>
            </div>
        `).appendTo('body').modal({
            escapeClose: false,
            clickClose: false,
        });
    }
    
}
