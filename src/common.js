/**
 * Copyright 2022 Justin Randall, Cisco Systems Inc. All Rights Reserved.
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the License, or 
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. If not, 
 * see <https://www.gnu.org/licenses/>.
 */

const CHARS_NUMBERS = "0123456789";
const CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARS_SPECIAL = ".@()-_";

/**
 * Utility function to generate a basic password with upper/lower case letters, 
 * numbers, and special characters to satify Redmine's password policy.  This
 * function is not suitable for production/secure passwords.
 * 
 * @param {number} passwordLength   The length of the password.
 * @returns the generated password.
 */
function generatePassword(passwordLength=8) {
    let allChars = CHARS_NUMBERS + CHARS_UPPER + CHARS_LOWER + CHARS_SPECIAL;
    let randPasswordArray = Array(passwordLength);
    randPasswordArray[0] = CHARS_NUMBERS;
    randPasswordArray[1] = CHARS_UPPER;
    randPasswordArray[2] = CHARS_LOWER;
    randPasswordArray[3] = CHARS_SPECIAL;
    randPasswordArray = randPasswordArray.fill(allChars, 4);
    return shuffleArray(randPasswordArray.map(function(x) { return x[Math.floor(Math.random() * x.length)]; })).join('');
}
    
// Shuffle an array.
// array - The array.
function shuffleArray(array) {
    for (let x = array.length - 1; x > 0; x--) {
        let y = Math.floor(Math.random() * (x + 1));
        let temp = array[x];
        array[x] = array[y];
        array[y] = temp;
    }
    return array;
}

module.exports = {generatePassword};