/**
 * Pipe for traaduction.
 * @module translate.pipe
 * @author Mathonet Grégoire
 */

import {Pipe, PipeTransform} from '@angular/core';
import {Backend} from './app.service';

@Pipe({name: 'translate', pure: false})
export class TranslatePipe implements PipeTransform {

  /**
   * Constructs the service.
   * @function constructor
   * @public
   * @param {Backend} backend Backend.
   */
  constructor(private backend: Backend) {

  }

  /**
   * Transforms.
   * @function transform
   * @public
   * @param {String} value Value.
   * @return {String} Translated.
   */
  transform(value: string): string {
    return this.backend.transform(value);
  }

}