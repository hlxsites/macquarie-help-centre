/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-param-reassign */

/**
 * Creates an HTML tag
 * @param {String} tag The tag to create
 * @param {Object} attributes The attributes to add to the tag
 * @param {Element} html An html element to set as it's content
 * @returns The new element
 */
/**
 * Create an element with the given id and classes.
 * @param {string} tagName the tag
 * @param {string[]|string} classes the class or classes to add
 * @param {object} props any other attributes to add to the element
 * @returns the element
 */
export function createElement(tagName, classes, props) {
  const elem = document.createElement(tagName);
  if (classes) {
    const classesArr = (typeof classes === 'string') ? [classes] : classes;
    elem.classList.add(...classesArr);
  }
  if (props) {
    Object.keys(props).forEach((propName) => {
      elem.setAttribute(propName, props[propName]);
    });
  }

  return elem;
}

/**
 * Copies to the clipboard
 * @param {Blob} blob The data
 */
export function createCopy(blob) {
  const data = [new ClipboardItem({ [blob.type]: blob })];
  navigator.clipboard.write(data);
}
