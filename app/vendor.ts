// Angular 2
import '@angular/platform-browser';
import '@angular/platform-browser-dynamic';
import '@angular/core';
import '@angular/common';
import '@angular/http';
import '@angular/router';

// RxJS
import 'rxjs';

// Other vendors for example jQuery, Lodash or Bootstrap
// You can import js, css, sass, ...
window.aesjs = require('../js/aesjs.min.js');
window.JSEncrypt = require('../js/jsencrypt.min.js');
window.sha256 = require('../js/sha256.js').hash;
window.download = require('../js/download.min.js');
window.Clipboard = require('../js/clipboard.min.js');
window.$ = window.jQuery = require('../js/jquery.min.js');
window.moment = require('../js/moment.js');
require('../js/moment.locales/moment.locales.js');
require('../js/bootstrap-datetimepicker.min.js');
require('../js/bootstrap.min.js');
require('../js/jquery.blockUI.js');
require('../js/jquery.modal.js');
window.introJs = require('../js/intro.js');

require('../fonts/Lato-Regular.ttf');
import '../css/fonts.css';

import '../css/bootstrap.css';
import '../css/bootstrap-datetimepicker.min.css';
import '../css/components-rounded.css';
import '../css/simple-line-icons.min.css';
import '../css/layout.css';
import '../css/envict.min.css';
import '../css/login.css';
import '../css/whigi.css';
import '../css/font-awesome.min.css';
import '../css/jquery.modal.css';
import '../css/introjs.css';